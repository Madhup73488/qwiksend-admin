import { NextResponse } from 'next/server';
import { getLicense, saveLicense } from '@/lib/kv';
import { validateKey } from '@/lib/license';

// CORS headers for desktop app
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Normalize machine ID (remove dashes for comparison)
function normalizeMachineId(mid) {
    return (mid || '').toString().trim().toUpperCase().replace(/-/g, '');
}

// PUBLIC endpoint – called by the QwikSend desktop app on startup / activation
export async function POST(req) {
    try {
        const { key, machineId } = await req.json();

        if (!key || !machineId)
            return NextResponse.json({ valid: false, error: 'key and machineId required' }, { headers: corsHeaders });

        const cleanKey = key.trim().toUpperCase();
        // Normalize machine ID by removing dashes
        const cleanMid = normalizeMachineId(machineId);

        // 1. DB existence + revocation check first
        const license = await getLicense(cleanKey);
        if (!license)
            return NextResponse.json({ valid: false, error: 'Key not registered' }, { headers: corsHeaders });
        if (license.revoked)
            return NextResponse.json({ valid: false, error: 'Key has been revoked' }, { headers: corsHeaders });

        // 2. Validate using client machineId by default.
        //    If this specific license has super-admin exception enabled,
        //    allow fallback to the machineId stored at generation time.
        const primaryCrypto = validateKey(cleanKey, cleanMid);
        let crypto = primaryCrypto;

        let usedExceptionFallback = false;
        if ((!crypto || !crypto.valid) && license.validationException === true) {
            // Exception mode: validate against stored machine signature and allow re-bind to current machine.
            const storedMid = normalizeMachineId(license.machineId);
            const fallbackCrypto = validateKey(cleanKey, storedMid);
            if (fallbackCrypto?.valid) {
                crypto = fallbackCrypto;
                usedExceptionFallback = true;
            }
        }

        if (!crypto)
            return NextResponse.json({ valid: false, error: 'Invalid key signature' }, { headers: corsHeaders });
        if (!crypto.valid)
            return NextResponse.json({ valid: false, error: 'Key expired' }, { headers: corsHeaders });

        // 3. Record first activation
        const now = Math.floor(Date.now() / 1000);
        let updatedLicense = license;
        if (!license.activated) {
            updatedLicense = { ...updatedLicense, activated: true, activatedAt: now };
        }

        // Exception mode re-binds to latest validated machine.
        if (usedExceptionFallback && license.exceptionBoundMachineId !== cleanMid) {
            updatedLicense = { ...updatedLicense, exceptionBoundMachineId: cleanMid };
        }

        if (updatedLicense !== license) {
            await saveLicense(updatedLicense);
        }

        // 4. Compute time fields
        const secondsLeft = crypto.isLifetime ? null : Math.max(0, crypto.expiryTs - now);
        const daysLeft    = crypto.isLifetime ? 9999  : Math.floor((secondsLeft ?? 0) / 86400);

        return NextResponse.json({
            valid:       true,
            plan:        license.plan,
            deviceLimit: crypto.deviceLimit,
            isLifetime:  crypto.isLifetime,
            daysLeft,
            secondsLeft,
            expiry:      crypto.isLifetime ? null : new Date(crypto.expiryTs * 1000).toISOString(),
            features:    license.features || null,
        }, { headers: corsHeaders });

    } catch (err) {
        console.error('Validate error:', err);
        return NextResponse.json({ valid: false, error: 'Server error' }, { headers: corsHeaders });
    }
}

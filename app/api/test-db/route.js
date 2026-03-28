import { NextResponse } from 'next/server';
import { getLicense, listAllLicenses } from '@/lib/kv';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        
        if (key) {
            const license = await getLicense(key);
            return NextResponse.json({
                searchedFor: key,
                found: !!license,
                license: license
            });
        }
        
        const all = await listAllLicenses();
        return NextResponse.json({
            totalLicenses: all.length,
            licenses: all.map(l => ({
                key: l.key,
                machineId: l.machineId,
                clientName: l.clientName,
                revoked: l.revoked
            }))
        });
    } catch (err) {
        return NextResponse.json({ error: err.message });
    }
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/apiFetch';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); return; }
            setToken(data.token);
            localStorage.setItem('qwiksend_admin_user', JSON.stringify({ username: data.username, role: data.role }));
            router.replace('/dashboard');
        } catch {
            setError('Connection failed. Check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: '#0c0c0e',
        }}>
            {/* Left panel — branding */}
            <div style={{
                width: '42%',
                background: '#111113',
                borderRight: '1px solid #222226',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 48px',
            }}>
                {/* Logo */}
                <img 
                    src="/logo.svg" 
                    alt="QwikSend" 
                    style={{ height: 45, width: 'auto', objectFit: 'contain', marginBottom: 40 }}
                />

                {/* Center text */}
                <div style={{ textAlign: 'center', maxWidth: 340 }}>
                    <div style={{
                        fontSize: 26, fontWeight: 700, color: '#ededed',
                        lineHeight: 1.3, letterSpacing: '-0.03em', marginBottom: 14,
                    }}>
                        License management<br />
                        <span style={{ color: '#10b981' }}>built for speed.</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#52525b', lineHeight: 1.7 }}>
                        Issue, track and revoke WhatsApp software licenses — all in one place.
                    </p>
                </div>

                {/* Footer */}
                <div style={{ fontSize: 12, color: '#3f3f46', marginTop: 'auto', paddingTop: 40 }}>
                    © {new Date().getFullYear()} QwikSend. All rights reserved.
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 32px',
            }}>
                <div style={{ width: '100%', maxWidth: 360 }}>
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#ededed', letterSpacing: '-0.02em' }}>
                            Sign in
                        </div>
                        <div style={{ fontSize: 13.5, color: '#71717a', marginTop: 6 }}>
                            Enter your credentials to continue
                        </div>
                    </div>

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                className="form-input"
                                value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                placeholder="your username"
                                autoFocus required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && <div className="form-error">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ marginTop: 6, padding: '10px', fontSize: 13.5 }}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

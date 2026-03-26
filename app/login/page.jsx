'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/apiFetch';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            {/* Left panel — branding (hidden on mobile) */}
            <div style={{
                width: '45%',
                background: '#111113',
                borderRight: '1px solid #222226',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '48px',
            }} className="login-left-panel">
                {/* Content container - vertically centered */}
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                    {/* Logo at top */}
                    <img 
                        src="/logo.svg" 
                        alt="QwikSend" 
                        style={{ height: 48, width: 'auto', objectFit: 'contain', marginBottom: 40 }}
                    />

                    {/* Text below logo */}
                    <div style={{
                        fontSize: 28, fontWeight: 700, color: '#ededed',
                        lineHeight: 1.3, letterSpacing: '-0.03em', marginBottom: 16,
                    }}>
                        License management<br />
                        <span style={{ color: '#10b981' }}>built for speed.</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#52525b', lineHeight: 1.7 }}>
                        Issue, track and revoke WhatsApp software licenses — all in one place.
                    </p>
                </div>

                {/* Footer at bottom */}
                <div style={{ fontSize: 12, color: '#3f3f46', position: 'absolute', bottom: 32 }}>
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
                <div style={{ width: '100%', maxWidth: 380 }}>
                    {/* Mobile logo (visible only on mobile) */}
                    <div className="mobile-logo" style={{ display: 'none', marginBottom: 32, textAlign: 'center' }}>
                        <img 
                            src="/logo.svg" 
                            alt="QwikSend" 
                            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                        />
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#ededed', letterSpacing: '-0.02em' }}>
                            Sign in
                        </div>
                        <div style={{ fontSize: 14, color: '#71717a', marginTop: 6 }}>
                            Enter your credentials to continue
                        </div>
                    </div>

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                className="form-input"
                                value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                placeholder="Enter your username"
                                autoFocus required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Enter your password"
                                    style={{ paddingRight: 44 }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 4,
                                        color: '#52525b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                            <line x1="3" y1="3" x2="21" y2="21"/>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <div className="form-error">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ marginTop: 8, padding: '12px', fontSize: 14, fontWeight: 600 }}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 900px) {
                    .login-left-panel {
                        display: none !important;
                    }
                    .mobile-logo {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}

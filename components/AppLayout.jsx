'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, clearToken, apiFetch } from '@/lib/apiFetch';

const ALL_NAV = [
    { href: '/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
    )},
    { href: '/licenses', label: 'Licenses', mobileLabel: 'Keys', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    )},
    { href: '/sales', label: 'Sales', mobileLabel: 'Sales', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
    )},
    { href: '/expenses', label: 'Expenses', mobileLabel: 'Spend', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
    )},
    { href: '/admins', label: 'Admins', mobileLabel: 'Team', superOnly: true, icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
    )},
];

export default function AppLayout({ children }) {
    const router   = useRouter();
    const pathname = usePathname();
    const [user, setUser]   = useState(null);
    const [ready, setReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!getToken()) { router.replace('/login'); return; }
        const cached = localStorage.getItem('qwiksend_admin_user');
        if (cached) try { setUser(JSON.parse(cached)); } catch {}

        apiFetch('/api/auth/me').then(r => {
            if (!r) return;
            if (r.ok) {
                setUser(r.data);
                localStorage.setItem('qwiksend_admin_user', JSON.stringify(r.data));
            }
            setReady(true);
        });
    }, []);

    const logout = () => {
        clearToken();
        router.replace('/login');
    };

    if (!ready && !user) {
        return (
            <div style={{
                minHeight: '100vh', background: '#0c0c0e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#52525b', fontSize: 13,
            }}>
                Loading…
            </div>
        );
    }

    const nav = ALL_NAV.filter(n => !n.superOnly || user?.role === 'super');
    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0c0e' }}>
            {/* Sidebar - Desktop */}
            <aside className="sidebar desktop-only">
                {/* Logo */}
                <div className="sidebar-logo" style={{ padding: '22px 16px 18px' }}>
                    <Link href="/dashboard" style={{ display: 'block' }}>
                        <img 
                            src="/logo.svg" 
                            alt="QwikSend" 
                            style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block', cursor: 'pointer' }}
                        />
                    </Link>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {nav.map(n => (
                        <Link
                            key={n.href}
                            href={n.href}
                            className={`nav-item${pathname.startsWith(n.href) ? ' active' : ''}`}
                        >
                            <span className="nav-icon">{n.icon}</span>
                            <span>{n.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-avatar">{initials}</div>
                        <div>
                            <div className="sidebar-user-name">{user?.username}</div>
                            <div className="sidebar-user-role">{user?.role}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: '100%' }}>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            {isMobile && (
                <header style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 56,
                    background: '#111113',
                    borderBottom: '1px solid #222226',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    zIndex: 100,
                }}>
                    <Link href="/dashboard">
                        <img 
                            src="/logo.svg" 
                            alt="QwikSend" 
                            style={{ height: 24, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
                        />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: '#a1a1aa' }}>{user?.username}</span>
                        <button 
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ededed',
                                fontSize: 20,
                                padding: '4px 8px',
                                cursor: 'pointer',
                            }}
                        >
                            ☰
                        </button>
                    </div>
                </header>
            )}

            {/* Mobile Menu Overlay */}
            {isMobile && showMobileMenu && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 99,
                    }}
                    onClick={() => setShowMobileMenu(false)}
                >
                    <div 
                        style={{
                            position: 'absolute',
                            top: 56,
                            right: 16,
                            background: '#111113',
                            border: '1px solid #222226',
                            borderRadius: 12,
                            padding: '12px',
                            minWidth: 180,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #222226', marginBottom: 8 }}>
                            <div style={{ fontSize: 13, color: '#ededed', fontWeight: 500 }}>{user?.username}</div>
                            <div style={{ fontSize: 11, color: '#52525b', textTransform: 'capitalize' }}>{user?.role}</div>
                        </div>
                        <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => { logout(); setShowMobileMenu(false); }}
                            style={{ width: '100%' }}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
            }}>
                {children}
            </main>

            {/* Bottom Navigation - Mobile */}
            {isMobile && (
                <nav style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 64,
                    background: '#111113',
                    borderTop: '1px solid #222226',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    zIndex: 100,
                }}>
                    {nav.map(n => (
                        <Link
                            key={n.href}
                            href={n.href}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 3,
                                padding: '6px 12px',
                                color: pathname.startsWith(n.href) ? '#10b981' : '#52525b',
                                textDecoration: 'none',
                                fontSize: 10,
                                fontWeight: pathname.startsWith(n.href) ? 500 : 400,
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{n.icon}</span>
                            <span>{n.mobileLabel}</span>
                        </Link>
                    ))}
                </nav>
            )}
        </div>
    );
}

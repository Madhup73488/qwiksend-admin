'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { apiFetch } from '@/lib/apiFetch';
import { StatsGridSkeleton, TableSkeleton, CardSkeleton, Sk } from '@/components/Skeleton';

function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDaysLeft(lic) {
    if (lic.isLifetime) return null;
    return Math.floor((lic.expiryTs - Math.floor(Date.now() / 1000)) / 86400);
}

function StatCard({ label, value, sub, valueColor, progress, progressColor }) {
    return (
        <div className="stat-card fade-up">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color: valueColor || 'var(--text)' }}>{value}</div>
            {sub && <div className="stat-sub">{sub}</div>}
            {progress !== undefined && (
                <div className="progress-bar-track">
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${Math.min(100, progress)}%`,
                            background: progressColor || 'var(--accent)',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

const PLAN_ORDER = ['trial', 'weekly', 'monthly', '3months', '6months', 'yearly', 'lifetime', 'custom'];
const PLAN_COLORS = {
    trial: '#f59e0b', weekly: '#fb923c', monthly: '#60a5fa',
    '3months': '#818cf8', '6months': '#10b981', yearly: '#22c55e',
    lifetime: '#f87171', custom: '#a1a1aa',
};

export default function DashboardPage() {
    const [licenses, setLicenses] = useState([]);
    const [admins,   setAdmins]   = useState([]);
    const [sales,    setSales]    = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [user,     setUser]     = useState(null);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        const cached = localStorage.getItem('qwiksend_admin_user');
        if (cached) try { setUser(JSON.parse(cached)); } catch {}

        const loadData = async () => {
            const [lRes, aRes, sRes, eRes] = await Promise.all([
                apiFetch('/api/licenses/list'),
                apiFetch('/api/admins/list').catch(() => null),
                apiFetch('/api/sales'),
                apiFetch('/api/expenses'),
            ]);
            if (lRes?.ok) setLicenses(lRes.data);
            if (aRes?.ok) setAdmins(aRes.data);
            if (sRes?.ok) setSales(sRes.data);
            if (eRes?.ok) setExpenses(eRes.data);
            setLoading(false);
        };
        loadData();
    }, []);

    const now        = Math.floor(Date.now() / 1000);
    const todayStart = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() / 1000);

    const total         = licenses.length;
    const active        = licenses.filter(l => !l.revoked && (l.isLifetime || l.expiryTs > now)).length;
    const revoked       = licenses.filter(l => l.revoked).length;
    const expired       = licenses.filter(l => !l.revoked && !l.isLifetime && l.expiryTs <= now).length;
    const expiringSoon  = licenses.filter(l => !l.revoked && !l.isLifetime && l.expiryTs > now && l.expiryTs - now < 7 * 86400).length;
    const issuedToday   = licenses.filter(l => (l.issuedAt || 0) >= todayStart).length;
    const totalRevenue  = sales.reduce((s, x) => s + (Number(x.price) || 0), 0);
    const totalExpenses = expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const netMoney      = totalRevenue - totalExpenses;
    const recent        = [...licenses].sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0)).slice(0, 8);

    const planCount = licenses.reduce((acc, l) => {
        if (!l.revoked) acc[l.plan] = (acc[l.plan] || 0) + 1;
        return acc;
    }, {});
    const planEntries = PLAN_ORDER.filter(p => planCount[p]).map(p => ({ plan: p, count: planCount[p] }));
    const maxPlanCount = Math.max(...planEntries.map(e => e.count), 1);

    const topSpenders = user?.role === 'super'
        ? Object.values(expenses.reduce((acc, e) => {
            if (!acc[e.spentBy]) acc[e.spentBy] = { id: e.spentBy, name: e.spentByName, total: 0, count: 0 };
            acc[e.spentBy].total += Number(e.amount) || 0;
            acc[e.spentBy].count += 1;
            return acc;
        }, {})).sort((a, b) => b.total - a.total).slice(0, 5)
        : [];

    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    // Mobile-optimized stat cards (fewer, more important ones)
    const mobileStats = [
        { label: 'Total', value: total, sub: 'licenses', valueColor: 'var(--text)' },
        { label: 'Active', value: active, sub: `${activeRate}%`, valueColor: '#10b981' },
        { label: 'Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}k`, sub: 'total', valueColor: '#10b981' },
        { label: 'Net', value: `₹${(Math.abs(netMoney) / 1000).toFixed(1)}k`, sub: netMoney >= 0 ? 'profit' : 'loss', valueColor: netMoney >= 0 ? '#10b981' : '#ef4444' },
    ];

    return (
        <AppLayout>
            <div className="page">
                <div className="page-header">
                    <div>
                        <div className="page-title">Dashboard</div>
                        <div className="page-subtitle">Overview of your license business</div>
                    </div>
                    {!loading && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            Live
                        </div>
                    )}
                </div>

                <div className="page-body">
                    {loading ? (
                        <>
                            <div className="desktop-only">
                                <StatsGridSkeleton count={9} />
                            </div>
                            <div className="mobile-only" style={{ display: 'none' }}>
                                <StatsGridSkeleton count={4} />
                            </div>
                            <CardSkeleton lines={2} />
                            <div style={{ marginBottom: 12 }}><Sk w="140px" h={13} /></div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            {['Client','Key','Plan','Issued By','Date','Status'].map(h => (
                                                <th key={h}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <TableSkeleton rows={6} cols={6} widths={['55%','80%','40%','45%','50%','35%']} />
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Desktop Stats Grid */}
                            <div className="stats-grid desktop-only">
                                <StatCard label="Total Licenses" value={total} sub="All time issued" valueColor="var(--text)" />
                                <StatCard
                                    label="Active"
                                    value={active}
                                    sub={`${activeRate}% of total`}
                                    valueColor="#10b981"
                                    progress={activeRate}
                                    progressColor="#10b981"
                                />
                                <StatCard label="Revoked" value={revoked} sub="Manually revoked" valueColor="#ef4444" />
                                <StatCard label="Expired" value={expired} sub="Past expiry date" valueColor="#52525b" />
                                <StatCard
                                    label="Expiring Soon"
                                    value={expiringSoon}
                                    sub="Within 7 days"
                                    valueColor={expiringSoon > 0 ? '#f59e0b' : '#52525b'}
                                />
                                <StatCard label="Issued Today" value={issuedToday} sub="Since midnight" valueColor="#f59e0b" />
                                {user?.role === 'super' && (
                                    <StatCard
                                        label="Admins"
                                        value={admins.length}
                                        sub={`${admins.filter(a => a.active).length} active`}
                                        valueColor="#3b82f6"
                                    />
                                )}
                                <StatCard
                                    label="Revenue"
                                    value={`₹${totalRevenue.toLocaleString('en-IN')}`}
                                    sub="From license sales"
                                    valueColor="#10b981"
                                />
                                <StatCard
                                    label="Net"
                                    value={`₹${Math.abs(netMoney).toLocaleString('en-IN')}`}
                                    sub={netMoney >= 0 ? 'Profit after expenses' : 'Net loss'}
                                    valueColor={netMoney >= 0 ? '#10b981' : '#ef4444'}
                                />
                            </div>

                            {/* Mobile Stats Grid - Simplified */}
                            <div className="mobile-only" style={{ display: 'none' }}>
                                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                                    {mobileStats.map((stat, i) => (
                                        <div key={i} className="stat-card fade-up">
                                            <div className="stat-label">{stat.label}</div>
                                            <div className="stat-value" style={{ color: stat.valueColor, fontSize: 20 }}>{stat.value}</div>
                                            <div className="stat-sub">{stat.sub}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Two-col layout: Plan breakdown + Top spenders */}
                            <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: expiringSoon > 0 || (user?.role === 'super' && topSpenders.length > 0) ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>

                                {/* Plan breakdown */}
                                {planEntries.length > 0 && (
                                    <div className="card fade-up">
                                        <div className="section-title" style={{ marginBottom: 16 }}>Active by Plan</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {planEntries.slice(0, 5).map(({ plan, count }) => (
                                                <div key={plan}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                        <span style={{ fontSize: 12.5, color: 'var(--text-2)', textTransform: 'capitalize' }}>{plan}</span>
                                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: PLAN_COLORS[plan] || 'var(--text)' }}>{count}</span>
                                                    </div>
                                                    <div className="progress-bar-track">
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{
                                                                width: `${(count / maxPlanCount) * 100}%`,
                                                                background: PLAN_COLORS[plan] || 'var(--accent)',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Top spenders — super only */}
                                {user?.role === 'super' && topSpenders.length > 0 && (
                                    <div className="card fade-up">
                                        <div className="section-title" style={{ marginBottom: 16 }}>Top Expense Users</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {topSpenders.slice(0, 3).map((s, i) => {
                                                const maxTotal = topSpenders[0].total || 1;
                                                return (
                                                    <div key={s.id}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                                                                {i + 1}. {s.name}
                                                            </span>
                                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ef4444' }}>
                                                                ₹{(s.total / 1000).toFixed(1)}k
                                                            </span>
                                                        </div>
                                                        <div className="progress-bar-track">
                                                            <div
                                                                className="progress-bar-fill"
                                                                style={{
                                                                    width: `${(s.total / maxTotal) * 100}%`,
                                                                    background: '#ef4444',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recent licenses table */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div className="section-title" style={{ margin: 0 }}>Recent Licenses</div>
                                {recent.length > 0 && (
                                    <a href="/licenses" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>
                                        View all →
                                    </a>
                                )}
                            </div>
                            <div className="table-wrap fade-up">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th className="desktop-only">Key</th>
                                            <th>Plan</th>
                                            <th className="desktop-only">Issued By</th>
                                            <th className="desktop-only">Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.length === 0 ? (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className="empty-state">
                                                        <div className="empty-state-icon">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                                            </svg>
                                                        </div>
                                                        <div className="empty-state-title">No licenses yet</div>
                                                        <div className="empty-state-sub">Generated licenses will appear here</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : recent.map(l => {
                                            const days = getDaysLeft(l);
                                            const isExpired = !l.isLifetime && days !== null && days < 0;
                                            return (
                                                <tr key={l.key}>
                                                    <td><span className="bold">{l.clientName}</span></td>
                                                    <td className="desktop-only"><span className="mono">{l.key.slice(0, 19)}…</span></td>
                                                    <td><span className={`badge badge-plan-${l.plan}`}>{l.plan}</span></td>
                                                    <td className="desktop-only"><span style={{ color: 'var(--text-3)' }}>{l.issuedByName}</span></td>
                                                    <td className="desktop-only"><span style={{ color: 'var(--text-3)' }}>{fmtDate(l.issuedAt)}</span></td>
                                                    <td>
                                                        {l.revoked   && <span className="badge badge-revoked">Revoked</span>}
                                                        {!l.revoked && isExpired  && <span className="badge badge-expired">Expired</span>}
                                                        {!l.revoked && !isExpired && <span className="badge badge-active">Active</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .desktop-only {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block !important;
                    }
                    .two-col-layout {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (min-width: 769px) {
                    .mobile-only {
                        display: none !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}

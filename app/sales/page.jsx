'use client';
import { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { apiFetch } from '@/lib/apiFetch';
import { StatsGridSkeleton, TableSkeleton } from '@/components/Skeleton';

const PERIODS = [
    { key: 'today',  label: 'Today'      },
    { key: 'week',   label: 'This Week'  },
    { key: 'month',  label: 'This Month' },
    { key: 'all',    label: 'All Time'   },
];

function fmt(n) {
    return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function periodStart(key) {
    const now = new Date();
    if (key === 'today') {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.floor(d.getTime() / 1000);
    }
    if (key === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
    }
    if (key === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        return Math.floor(d.getTime() / 1000);
    }
    return 0; // all time
}

export default function SalesPage() {
    const [user,    setUser]    = useState(null);
    const [sales,   setSales]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [period,  setPeriod]  = useState('month');
    const [adminFilter, setAdminFilter] = useState('all');

    useEffect(() => {
        try { const u = localStorage.getItem('qwiksend_admin_user'); if (u) setUser(JSON.parse(u)); } catch {}
        apiFetch('/api/sales').then(r => {
            if (r?.ok) setSales(r.data);
            setLoading(false);
        });
    }, []);

    const isSuper = user?.role === 'super';

    // Unique admins for super filter
    const adminList = useMemo(() => {
        const map = {};
        sales.forEach(s => { if (s.issuedBy) map[s.issuedBy] = s.issuedByName; });
        return Object.entries(map).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [sales]);

    const start = periodStart(period);

    // Filtered by period + admin
    const filtered = useMemo(() => sales.filter(s => {
        if ((s.issuedAt || 0) < start) return false;
        if (isSuper && adminFilter !== 'all' && s.issuedBy !== adminFilter) return false;
        return true;
    }), [sales, start, adminFilter, isSuper]);

    const totalRevenue = filtered.reduce((a, s) => a + (s.price || 0), 0);
    const totalCount   = filtered.length;

    // Per-admin breakdown (super only)
    const adminBreakdown = useMemo(() => {
        if (!isSuper) return [];
        const map = {};
        filtered.forEach(s => {
            if (!map[s.issuedBy]) map[s.issuedBy] = { id: s.issuedBy, name: s.issuedByName, revenue: 0, count: 0 };
            map[s.issuedBy].revenue += s.price || 0;
            map[s.issuedBy].count  += 1;
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [filtered, isSuper]);

    // Summary stats for all 4 periods (quick overview row)
    const periodStats = useMemo(() => PERIODS.map(p => {
        const s = periodStart(p.key);
        const rows = sales.filter(x => (x.issuedAt || 0) >= s);
        return { label: p.label, revenue: rows.reduce((a, x) => a + (x.price || 0), 0), count: rows.length };
    }), [sales]);

    return (
        <AppLayout>
            <div className="page">
                <div className="page-header">
                    <div>
                        <div className="page-title">Sales</div>
                        <div className="page-subtitle">Revenue from license sales</div>
                    </div>
                </div>

                <div className="page-body">
                    {loading ? (
                        <>
                            <StatsGridSkeleton count={4} />
                            <div className="table-wrap" style={{ marginTop: 16 }}>
                                <table>
                                    <thead><tr>
                                        {['#','Client','Plan','Price','Date','Status'].map(h => <th key={h}>{h}</th>)}
                                    </tr></thead>
                                    <tbody><TableSkeleton rows={7} cols={6} widths={['20px','55%','40%','40%','45%','35%']} /></tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Summary stat cards */}
                            <div className="stats-grid" style={{ marginBottom: 24 }}>
                                {periodStats.map((ps, i) => (
                                    <div
                                        key={ps.label}
                                        className="stat-card fade-up"
                                        style={{
                                            cursor: 'pointer',
                                            borderColor: period === PERIODS[i].key ? 'var(--accent)' : 'var(--border)',
                                            background:  period === PERIODS[i].key ? 'rgba(16,185,129,.06)' : 'var(--surface)',
                                        }}
                                        onClick={() => setPeriod(PERIODS[i].key)}
                                    >
                                        <div className="stat-label">{ps.label}</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: period === PERIODS[i].key ? 'var(--accent)' : 'var(--text)' }}>
                                            {fmt(ps.revenue)}
                                        </div>
                                        <div className="stat-sub">{ps.count} sale{ps.count !== 1 ? 's' : ''}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Filters row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {PERIODS.map(p => (
                                        <button
                                            key={p.key}
                                            className={`btn btn-sm ${period === p.key ? 'btn-primary' : 'btn-ghost'}`}
                                            onClick={() => setPeriod(p.key)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                {isSuper && adminList.length > 1 && (
                                    <select
                                        className="form-select"
                                        style={{ width: 'auto', maxWidth: 200 }}
                                        value={adminFilter}
                                        onChange={e => setAdminFilter(e.target.value)}
                                    >
                                        <option value="all">All Admins</option>
                                        {adminList.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                )}
                                <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 13 }}>
                                    {totalCount} sale{totalCount !== 1 ? 's' : ''} &nbsp;·&nbsp;
                                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(totalRevenue)}</span>
                                </span>
                            </div>

                            {/* Per-admin breakdown (super only) */}
                            {isSuper && adminBreakdown.length > 1 && adminFilter === 'all' && (
                                <div className="card fade-up" style={{ marginBottom: 20 }}>
                                    <div className="section-title" style={{ marginBottom: 12 }}>Admin Breakdown</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {adminBreakdown.map(a => (
                                            <div
                                                key={a.id}
                                                style={{
                                                    background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                                                    borderRadius: 8, padding: '10px 16px', minWidth: 150,
                                                    cursor: 'pointer', transition: 'border-color 0.12s',
                                                }}
                                                onClick={() => setAdminFilter(a.id)}
                                            >
                                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>
                                                    {a.name}
                                                </div>
                                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                                                    {fmt(a.revenue)}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                                                    {a.count} sale{a.count !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sales table */}
                            {filtered.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                                    </div>
                                    <div className="empty-state-title">No sales for this period</div>
                                    <div className="empty-state-sub">Try selecting a wider time range</div>
                                </div>
                            ) : (
                                <div className="table-wrap fade-up">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Client</th>
                                                <th>Plan</th>
                                                <th>Price</th>
                                                {isSuper && <th>Admin</th>}
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((s, i) => (
                                                <tr key={s.key}>
                                                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{i + 1}</td>
                                                    <td>
                                                        <div className="bold">{s.clientName}</div>
                                                        {s.clientPhone && <div className="dim">{s.clientPhone}</div>}
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-plan-${s.plan}`}>{s.plan}</span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13.5 }}>
                                                            {fmt(s.price)}
                                                        </span>
                                                    </td>
                                                    {isSuper && (
                                                        <td style={{ color: 'var(--text-3)' }}>{s.issuedByName}</td>
                                                    )}
                                                    <td>{fmtDate(s.issuedAt)}</td>
                                                    <td>
                                                        {s.revoked
                                                            ? <span className="badge badge-revoked">Revoked</span>
                                                            : <span className="badge badge-active">Active</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// Reusable skeleton primitives

/** Inline shimmer block */
export function Sk({ w = '100%', h = 14, radius = 6, style = {} }) {
    return (
        <span
            className="skeleton"
            style={{ width: w, height: h, borderRadius: radius, display: 'block', ...style }}
        />
    );
}

/** Skeleton for a single stat card */
export function StatCardSkeleton() {
    return (
        <div className="skeleton-stat">
            <Sk w="55%" h={11} style={{ marginBottom: 12 }} />
            <Sk w="45%" h={28} style={{ marginBottom: 8 }} />
            <Sk w="65%" h={10} />
        </div>
    );
}

/** Skeleton row for tables — pass colCount */
export function TableRowSkeleton({ cols = 5, widths = [] }) {
    return (
        <tr className="skeleton-row">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i}>
                    <Sk w={widths[i] || '70%'} h={13} />
                </td>
            ))}
        </tr>
    );
}

/** Skeleton for a full table — renders n rows */
export function TableSkeleton({ rows = 6, cols = 5, widths = [] }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} cols={cols} widths={widths} />
            ))}
        </>
    );
}

/** Skeleton for the stats grid */
export function StatsGridSkeleton({ count = 6 }) {
    return (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
            {Array.from({ length: count }).map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>
    );
}

/** Generic card skeleton with a few lines */
export function CardSkeleton({ lines = 3 }) {
    return (
        <div className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Sk w="35%" h={13} />
            {Array.from({ length: lines }).map((_, i) => (
                <Sk key={i} w={`${90 - i * 10}%`} h={11} />
            ))}
        </div>
    );
}

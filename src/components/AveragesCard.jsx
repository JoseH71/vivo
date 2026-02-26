/**
 * VIVO — Averages Card v1.2
 * Medias temporales (Hoy, 7d, 14d, 30d, 60d) + Tendencia
 * Updated: Larger text and layout as requested.
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrendIcon = ({ metric, d7, d14, d30 }) => {
    if (!d7 || !d14 || !d30) return null;

    const isFCR = metric === 'FCR';

    // Logic for Positive Metrics (HRV, Sleep)
    if (!isFCR) {
        if (d7 >= d14) return <TrendingUp size={20} style={{ color: 'var(--green)' }} />;
        if (d7 < d30 * 0.92) return <TrendingDown size={20} style={{ color: 'var(--red)' }} />;
        if (d7 < d14) return <TrendingDown size={20} style={{ color: 'var(--yellow)' }} />;
    }
    // Logic for FCR (Lower is better)
    else {
        if (d7 <= d14) return <TrendingDown size={20} style={{ color: 'var(--green)' }} />;
        if (d7 > d30 * 1.08) return <TrendingUp size={20} style={{ color: 'var(--red)' }} />;
        if (d7 > d14) return <TrendingUp size={20} style={{ color: 'var(--yellow)' }} />;
    }

    return <Minus size={20} style={{ color: 'var(--text-muted)' }} />;
};

const AverageRow = ({ label, unit, data, todayValue }) => {
    if (!data) return null;
    const { d7, d14, d30, d60 } = data;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 0.6fr 1.1fr 1.1fr 1fr 1fr 1fr',
            alignItems: 'center',
            padding: '1rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <TrendIcon metric={label} d7={d7} d14={d14} d30={d30} />
            </div>

            {/* HOY */}
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'monospace' }}>
                    {todayValue ? Math.round(todayValue) : '—'}
                </span>
            </div>

            {/* 7d */}
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{Math.round(d7)}</span>
            </div>

            {/* 14d */}
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{Math.round(d14)}</span>
            </div>

            {/* 30d */}
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{Math.round(d30)}</span>
            </div>

            {/* 60d */}
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{Math.round(d60)}</span>
            </div>
        </div>
    );
};

const AveragesCard = ({ iea }) => {
    if (!iea?.averages) return null;
    const { averages, details } = iea;

    return (
        <div className="card-glass animate-fade-in" style={{ padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 0.6fr 1.1fr 1.1fr 1fr 1fr 1fr',
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.15)'
            }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Métricas</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'center' }}>Trend</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--cyan)', textTransform: 'uppercase', textAlign: 'center' }}>Hoy</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', textAlign: 'center' }}>7d</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', textAlign: 'center' }}>14d</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', textAlign: 'center' }}>30d</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', textAlign: 'center' }}>60d</span>
            </div>

            <AverageRow label="VFC" unit="ms" data={averages.hrv} todayValue={details.hrv?.value} />
            <AverageRow label="FCR" unit="bpm" data={averages.rhr} todayValue={details.rhr?.value} />
            <AverageRow label="Sueño" unit="" data={averages.sleep} todayValue={details.sleep?.value} />
        </div>
    );
};

export default AveragesCard;

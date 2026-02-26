/**
 * VIVO — Bio Metrics Panel v2.1
 * Updates: Labels to VFC/FC, White labels/units, Colored values.
 */

const MetricPill = ({ label, value, unit, color, subtext }) => (
    <div className="metric-pill animate-fade-in" style={color ? { borderColor: `${color}33`, background: `${color}08` } : {}}>
        <span className="value" style={color ? { color } : {}}>
            {value ?? '—'}
        </span>
        {unit && <span className="text-xs" style={{ color: '#ffffff', opacity: 0.6 }}>{unit}</span>}
        <span className="label" style={{ color: '#ffffff', opacity: 0.8 }}>{label}</span>
        {subtext && <span className="text-xs" style={{ color: color || 'var(--text-muted)', fontSize: '0.55rem', fontWeight: 700 }}>{subtext}</span>}
    </div>
);

const BioMetrics = ({ iea, intervalsData }) => {
    if (!iea?.details || !intervalsData?.length) return null;

    const today = intervalsData[0];
    const { hrv, rhr, sleep, load } = iea.details;

    const getColor = (points) => {
        if (points >= 80) return 'var(--green)';
        if (points >= 50) return 'var(--yellow)';
        return 'var(--red)';
    };

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
                <div className="text-xs uppercase tracking-widest font-bold" style={{ color: '#ffffff' }}>Bio-Métricas</div>
                <div className="text-xs font-mono" style={{ fontSize: '0.55rem', color: '#ffffff' }}>Pesos Dinámicos Activos</div>
            </div>
            <div className="grid-4 stagger">
                <MetricPill
                    label="VFC"
                    value={today.hrv || '—'}
                    unit="ms"
                    color={getColor(hrv.points)}
                    subtext={hrv.weight ? `w: ${hrv.weight}%` : ''}
                />
                <MetricPill
                    label="FC"
                    value={today.restingHR || today.rhr || '—'}
                    unit="bpm"
                    color={getColor(rhr.points)}
                    subtext={rhr.weight ? `w: ${rhr.weight}%` : ''}
                />
                <MetricPill
                    label="Sueño"
                    value={today.sleepScore || '—'}
                    unit="/100"
                    color={getColor(sleep.points)}
                    subtext={sleep.weight ? `w: ${sleep.weight}%` : ''}
                />
                <MetricPill
                    label="TSB"
                    value={load.tsb}
                    unit=""
                    color={getColor(load.points)}
                    subtext={load.weight ? `w: ${load.weight}%` : ''}
                />
            </div>
        </div>
    );
};

export default BioMetrics;

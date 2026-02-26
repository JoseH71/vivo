/**
 * VIVO — Normality Bands v1.0
 * Bandas de Normalidad (±0.75σ sobre 60d)
 * Estilo visual Vivo (inline styles, card bg-card)
 */

const BandBar = ({ label, ma7, today, mean, lower, upper, unit, isLowerAlarm }) => {
    if (mean === null || lower === null || upper === null) return null;

    const isOutside = isLowerAlarm
        ? (ma7 && ma7 < lower)
        : (ma7 && ma7 > upper);

    // Rango visual: extender ±70% más allá de la banda
    const bandWidth = upper - lower;
    const viewMin = lower - (bandWidth * 0.7);
    const viewMax = upper + (bandWidth * 0.7);
    const totalRange = viewMax - viewMin;
    const getPos = (val) => Math.max(0, Math.min(100, ((val - viewMin) / totalRange) * 100));

    const dotColor = isOutside ? '#f43f5e' : '#34d399';
    const dotShadow = isOutside ? '0 0 12px rgba(244, 63, 94, 0.6)' : '0 0 16px rgba(52, 211, 153, 0.5)';
    const bandBg = isOutside ? 'rgba(244, 63, 94, 0.15)' : 'rgba(52, 211, 153, 0.15)';
    const bandBorder = isOutside ? 'rgba(244, 63, 94, 0.3)' : 'rgba(52, 211, 153, 0.3)';

    return (
        <div style={{ padding: '1rem 0' }}>
            {/* Header: Label + MA7 left, Today right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
                <div>
                    <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>
                        {label}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{
                            fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em',
                            color: isOutside ? '#f43f5e' : '#34d399',
                        }}>
                            {ma7 !== null ? ma7.toFixed(1) : '—'}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            {unit}
                        </span>
                    </div>
                </div>
                {today !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Hoy</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{Math.round(today)}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{unit}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Band Bar */}
            <div style={{ position: 'relative', height: '3rem', width: '100%', display: 'flex', alignItems: 'center' }}>
                {/* Track */}
                <div style={{ position: 'absolute', width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px' }} />

                {/* Normal zone */}
                <div style={{
                    position: 'absolute',
                    height: '1rem',
                    borderRadius: '9999px',
                    background: bandBg,
                    border: `1px solid ${bandBorder}`,
                    left: `${getPos(lower)}%`,
                    width: `${getPos(upper) - getPos(lower)}%`,
                    transition: 'all 0.7s ease',
                }} />

                {/* Mean line */}
                <div style={{
                    position: 'absolute',
                    height: '1.5rem',
                    width: '1px',
                    background: 'rgba(255,255,255,0.2)',
                    left: `${getPos(mean)}%`,
                }}>
                    <div style={{
                        position: 'absolute', top: '-0.2rem', left: '50%', transform: 'translateX(-50%)',
                        width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                    }} />
                </div>

                {/* Lower / Upper labels */}
                <span style={{
                    position: 'absolute', top: '-1.1rem',
                    left: `${getPos(lower)}%`, transform: 'translateX(-50%)',
                    fontSize: '0.7rem', fontWeight: 500, color: '#fff',
                }}>{lower}</span>
                <span style={{
                    position: 'absolute', top: '-1.1rem',
                    left: `${getPos(upper)}%`, transform: 'translateX(-50%)',
                    fontSize: '0.7rem', fontWeight: 500, color: '#fff',
                }}>{upper}</span>

                {/* MA7 dot (big) */}
                {ma7 !== null && (
                    <div style={{
                        position: 'absolute', zIndex: 20,
                        left: `${getPos(ma7)}%`,
                        transition: 'left 1s ease-out',
                    }}>
                        <div style={{
                            width: '1.25rem', height: '1.25rem',
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%',
                            background: dotColor,
                            boxShadow: dotShadow,
                        }} />
                    </div>
                )}

                {/* Today dot (small) */}
                {today !== null && (
                    <div style={{
                        position: 'absolute', zIndex: 10, opacity: 0.6,
                        left: `${getPos(today)}%`,
                        transition: 'left 1s ease-out',
                    }}>
                        <div style={{
                            width: '0.75rem', height: '0.75rem',
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%',
                            background: '#818cf8',
                            border: '1px solid rgba(255,255,255,0.4)',
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
};

const NormalityBands = ({ bands }) => {
    if (!bands?.hrv && !bands?.rhr) return null;

    return (
        <div style={{
            background: 'var(--bg-card)',
            padding: '1rem',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                📊 Bandas de Normalidad
            </p>

            {bands.rhr?.mean > 0 && (
                <BandBar
                    label="FC 7d"
                    ma7={bands.rhr.ma7}
                    today={bands.rhr.today}
                    mean={bands.rhr.mean}
                    lower={bands.rhr.lower}
                    upper={bands.rhr.upper}
                    unit="bpm"
                    isLowerAlarm={false}
                />
            )}

            {bands.rhr?.mean > 0 && bands.hrv?.mean > 0 && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', width: '100%' }} />
            )}

            {bands.hrv?.mean > 0 && (
                <BandBar
                    label="VFC 7d"
                    ma7={bands.hrv.ma7}
                    today={bands.hrv.today}
                    mean={bands.hrv.mean}
                    lower={bands.hrv.lower}
                    upper={bands.hrv.upper}
                    unit="ms"
                    isLowerAlarm={true}
                />
            )}
        </div>
    );
};

export default NormalityBands;

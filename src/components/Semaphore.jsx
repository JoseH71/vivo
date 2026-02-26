/**
 * VIVO — Semaphore Component v4.0
 * The central IEA indicator with glow effect
 * Color thresholds: ≥70 green, 55-69 yellow, <55 red
 * Cap defines color, ALWAYS.
 */
import { Activity, Shield, AlertTriangle, Lock } from 'lucide-react';

const Semaphore = ({ iea }) => {
    if (!iea || iea.score === null) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="text-muted text-sm">Cargando datos de Intervals.icu...</div>
            </div>
        );
    }

    const colorMap = {
        green: {
            bg: 'semaphore-green',
            glow: 'glow-green',
            accent: 'var(--green)',
            icon: Shield,
            orbBg: 'rgba(34, 197, 94, 0.15)',
            orbShadow: '0 0 60px rgba(34, 197, 94, 0.3), 0 0 120px rgba(34, 197, 94, 0.1)',
        },
        yellow: {
            bg: 'semaphore-yellow',
            glow: 'glow-yellow',
            accent: 'var(--yellow)',
            icon: Activity,
            orbBg: 'rgba(234, 179, 8, 0.15)',
            orbShadow: '0 0 60px rgba(234, 179, 8, 0.3), 0 0 120px rgba(234, 179, 8, 0.1)',
        },
        red: {
            bg: 'semaphore-red',
            glow: 'glow-red',
            accent: 'var(--red)',
            icon: AlertTriangle,
            orbBg: 'rgba(239, 68, 68, 0.15)',
            orbShadow: '0 0 60px rgba(239, 68, 68, 0.3), 0 0 120px rgba(239, 68, 68, 0.1)',
        }
    };

    const theme = colorMap[iea.color] || colorMap.yellow;
    const Icon = theme.icon;

    return (
        <div className={`${theme.bg} animate-fade-in`} style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background orb glow */}
            <div className="animate-breathe" style={{
                position: 'absolute',
                top: '-30%', right: '-20%',
                width: '200px', height: '200px',
                borderRadius: '50%',
                background: theme.orbBg,
                boxShadow: theme.orbShadow,
                filter: 'blur(40px)',
                pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Top row: label + icon */}
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <div>
                        <div className="text-xs uppercase tracking-widest text-muted font-bold" style={{ marginBottom: '0.25rem' }}>
                            Índice de Estabilidad Autonómica
                        </div>
                        <div className="text-lg font-black tracking-tight" style={{ color: theme.accent }}>
                            {iea.label}
                        </div>
                    </div>
                    <div className="animate-pulse-glow" style={{
                        width: '56px', height: '56px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: theme.orbBg,
                        boxShadow: theme.orbShadow
                    }}>
                        <Icon size={28} style={{ color: theme.accent }} />
                    </div>
                </div>

                {/* Score display */}
                <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span className="text-5xl font-black font-mono tracking-tight" style={{ color: theme.accent }}>
                            {iea.score}
                        </span>
                        <span className="text-xl text-muted font-bold">/100</span>
                    </div>

                    {iea.details?.safety?.capActive && (
                        <div className="animate-fade-in" style={{
                            padding: '0.3rem 0.6rem', background: 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid ${theme.accent}`, borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}>
                            <Lock size={14} style={{ color: theme.accent }} />
                            <div className="flex-col">
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Cap {iea.details.safety.capValue}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {iea.details.safety.capReason}
                                </span>
                            </div>
                        </div>
                    )}

                    {iea.isProvisional && (
                        <div style={{
                            padding: '0.2rem 0.5rem', background: 'rgba(234, 179, 8, 0.1)',
                            border: '1px solid var(--yellow)', borderRadius: 'var(--radius-sm)',
                        }}>
                            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--yellow)' }}>DATOS PROVISIONALES</span>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                <div className="progress-track" style={{ height: '8px', marginBottom: '1rem' }}>
                    <div className="progress-fill" style={{
                        width: `${iea.score}%`,
                        background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)`
                    }} />
                </div>

                {/* Message */}
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: iea.alerts?.length ? '1rem' : 0 }}>
                    {iea.message}
                </p>

                {/* Acute Alerts */}
                {iea.alerts?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {iea.alerts.map((alert, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.25)',
                                borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <AlertTriangle size={12} style={{ color: 'var(--red)' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {alert}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Semaphore;

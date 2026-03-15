/**
 * VIVO — Decision Card v2.0
 * Pantalla principal del Motor de Decisión.
 * Muestra: Estado eléctrico + Recomendación + Motivo + Tendencias
 * Sin complejidad matemática visible.
 */
import { useState } from 'react';
import { Shield, Zap, TrendingDown, TrendingUp, Minus, Info, Lock } from 'lucide-react';

const stateStyles = {
    green: {
        bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)',
        border: 'rgba(34, 197, 94, 0.3)',
        accent: 'var(--green)',
        glow: 'rgba(34, 197, 94, 0.15)',
    },
    yellow: {
        bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.02) 100%)',
        border: 'rgba(234, 179, 8, 0.3)',
        accent: 'var(--yellow)',
        glow: 'rgba(234, 179, 8, 0.15)',
    },
    red: {
        bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
        border: 'rgba(239, 68, 68, 0.3)',
        accent: 'var(--red)',
        glow: 'rgba(239, 68, 68, 0.15)',
    },
    purple: {
        bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
        border: 'rgba(139, 92, 246, 0.3)',
        accent: 'var(--purple)',
        glow: 'rgba(139, 92, 246, 0.15)',
    },
};

const TrendIcon = ({ value, type }) => {
    if (value === null || value === undefined || Math.abs(value) < 0.5) {
        return <Minus size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />;
    }
    const isGood = type === 'hrv' ? value > 0 : value < 0;
    const color = isGood ? 'var(--green)' : 'var(--red)';
    return value > 0
        ? <TrendingUp size={16} style={{ color }} />
        : <TrendingDown size={16} style={{ color }} />;
};

const DecisionCard = ({ decision, iea, dailyRecommendation }) => {
    if (!decision || !decision.recommendation) return null;

    const { recommendation, trends } = decision;
    const ieaScore = iea?.score;
    const ieaLabel = iea?.label || '';
    const style = stateStyles[recommendation.color] || stateStyles.yellow;

    // Use dailyRecommendation if available, fallback to basic decision
    const rec = dailyRecommendation || {
        title: recommendation.intensity,
        msg: recommendation.description,
        color: recommendation.color,
        stimulus: 'Mantenimiento del SNA',
        workout: recommendation.intensity,
        strategy: 'Optimización de la carga según IEA.'
    };

    return (
        <div className="animate-fade-in stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── Header: Estado Eléctrico ── */}
            <div className="card-glass" style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '32px',
                padding: '1.5rem',
                boxShadow: `0 0 40px ${style.glow}`,
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: style.accent, filter: 'blur(50px)', opacity: 0.1 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Shield size={18} style={{ color: style.accent }} />
                            <span className="uppercase tracking-widest font-black" style={{ color: style.accent, fontSize: '0.7rem' }}>
                                Escudo Autonómico
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '2.8rem' }}>{recommendation.emoji}</span>
                            <div>
                                <div className="font-black uppercase tracking-tight" style={{ fontSize: '1.6rem', color: '#fff' }}>
                                    {ieaLabel}
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest opacity-50">Copiloto VIVO v5.0</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-1">IEA Score</div>
                        <div className="font-black font-mono" style={{ fontSize: '2.5rem', color: style.accent, lineHeight: 0.9 }}>
                            {ieaScore}
                        </div>
                        {iea?.isProvisional && (
                            <div className="text-xs font-black" style={{ color: 'var(--yellow)', marginTop: '0.4rem', fontSize: '0.5rem' }}>PROVISIONAL</div>
                        )}
                    </div>
                </div>

                {/* Sugerencia de Hoy (Mini Preview) */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div className="text-xs font-black text-muted uppercase tracking-widest mb-1" style={{ fontSize: '0.6rem' }}>Sugerencia de Hoy</div>
                    <div className="font-black text-sm" style={{ color: '#fff' }}>{rec.title}</div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{rec.workout}</p>
                </div>

                {/* Cap activo */}
                {iea?.details?.safety?.capActive && (
                    <div className="card-glass" style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.8rem', marginTop: '1.25rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '16px',
                        borderLeft: `4px solid ${style.accent}`,
                    }}>
                        <Lock size={14} style={{ color: style.accent }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: style.accent, textTransform: 'uppercase' }}>
                            Gate {iea.details.safety.capValue}
                        </span>
                        <span className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {iea.details.safety.capReason}
                        </span>
                    </div>
                )}
            </div>

            {/* Alerta DOMS — Modulador Mecánico */}
            {rec.domsAlert && (
                <div className="animate-fade-in" style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.85rem 1rem', marginTop: '1rem',
                    background: `${rec.domsAlert.color}18`,
                    borderRadius: '16px',
                    borderLeft: `4px solid ${rec.domsAlert.color}`,
                }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{rec.domsAlert.icon}</span>
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: rec.domsAlert.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                            {rec.domsAlert.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                            {rec.domsAlert.msg}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tendencias MA7 ── */}
            {trends?.hrv && trends?.rhr && (
                <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '24px' }}>
                    <TrendSection trends={trends} accent={style.accent} />
                </div>
            )}
        </div>
    );
};

// ── Subcomponente: Tendencias con explicación ──
const TrendSection = ({ trends, accent }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{ display: 'flex', gap: '1.25rem', padding: '0.25rem 0', cursor: 'pointer', alignItems: 'center' }}
            >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendIcon value={trends.hrv.changePct} type="hrv" />
                    <span className="font-bold" style={{
                        fontSize: '0.75rem',
                        color: trends.hrv.changePct > 0 ? 'var(--green)' : trends.hrv.changePct < -3 ? 'var(--red)' : 'var(--text-secondary)'
                    }}>VFC</span>
                    <span className="font-mono font-bold" style={{
                        color: trends.hrv.changePct > 0 ? 'var(--green)' : trends.hrv.changePct < -3 ? 'var(--red)' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                    }}>
                        {trends.hrv.changePct > 0 ? '+' : ''}{trends.hrv.changePct.toFixed(1)}%
                    </span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendIcon value={trends.rhr.changePct} type="rhr" />
                    <span className="font-bold" style={{
                        fontSize: '0.75rem',
                        color: trends.rhr.changePct < 0 ? 'var(--green)' : trends.rhr.changePct > 3 ? 'var(--red)' : 'var(--text-secondary)'
                    }}>FC</span>
                    <span className="font-mono font-bold" style={{
                        color: trends.rhr.changePct < 0 ? 'var(--green)' : trends.rhr.changePct > 3 ? 'var(--red)' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                    }}>
                        {trends.rhr.changePct > 0 ? '+' : ''}{trends.rhr.changePct.toFixed(1)}%
                    </span>
                </div>
                <Info size={14} style={{ color: accent, opacity: expanded ? 1 : 0.4, transition: 'opacity 0.2s' }} />
            </div>

            {expanded && (
                <div style={{
                    marginTop: '0.6rem',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                        Comparativa de <strong style={{ color: '#fff' }}>media móvil 7 días</strong> actual vs los 7 días anteriores.
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>VFC (Variabilidad)</div>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#fff' }}>
                                <span style={{ opacity: 0.5 }}>Sem. pasada:</span> {trends.hrv.previous.toFixed(0)} ms
                            </div>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#fff' }}>
                                <span style={{ opacity: 0.5 }}>Esta semana:</span> {trends.hrv.current.toFixed(0)} ms
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>FC (Reposo)</div>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#fff' }}>
                                <span style={{ opacity: 0.5 }}>Sem. pasada:</span> {trends.rhr.previous.toFixed(0)} bpm
                            </div>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: '#fff' }}>
                                <span style={{ opacity: 0.5 }}>Esta semana:</span> {trends.rhr.current.toFixed(0)} bpm
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecisionCard;

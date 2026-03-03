/**
 * VIVO — AI Analysis v4.0
 * Layout de 3 pestañas internas: Interpretación / Prescripción / Plan
 */
import { useState, useMemo } from 'react';
import {
    Brain, Loader2, RefreshCw, Moon, Zap, Droplets, Activity,
    ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus,
    ChevronDown, ChevronUp, HelpCircle, Flame, Award, MessageCircle,
    Calendar, Dumbbell, Bike, Search, Clipboard, CheckSquare
} from 'lucide-react';

/* ── Status Theme ── */
const STATUS = {
    green: {
        bg: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.02) 100%)',
        border: 'rgba(34,197,94,0.3)',
        accent: '#22c55e',
        glow: '0 0 40px rgba(34,197,94,0.12)',
        pill: 'rgba(34,197,94,0.15)'
    },
    yellow: {
        bg: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0.02) 100%)',
        border: 'rgba(234,179,8,0.3)',
        accent: '#eab308',
        glow: '0 0 40px rgba(234,179,8,0.12)',
        pill: 'rgba(234,179,8,0.15)'
    },
    red: {
        bg: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.02) 100%)',
        border: 'rgba(239,68,68,0.3)',
        accent: '#ef4444',
        glow: '0 0 40px rgba(239,68,68,0.12)',
        pill: 'rgba(239,68,68,0.15)'
    }
};

/* ── Tiny SVG Sparkline ── */
const Sparkline = ({ values, color = 'var(--cyan)', width = 60, height = 22 }) => {
    if (!values || values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    });
    return (
        <svg width={width} height={height} style={{ display: 'block', opacity: 0.7 }}>
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={color} />
        </svg>
    );
};

/* ── Trend Arrow ── */
const TrendArrow = ({ trend }) => {
    if (trend === 'up') return <TrendingUp size={17} style={{ color: '#22c55e' }} />;
    if (trend === 'down') return <TrendingDown size={17} style={{ color: '#ef4444' }} />;
    return <Minus size={17} style={{ color: 'rgba(255,255,255,0.3)' }} />;
};

/* ── Z-Score Badge ── */
const ZBadge = ({ z }) => {
    const val = parseFloat(z);
    if (isNaN(val)) return null;
    const color = val >= 0.5 ? '#22c55e' : val >= -0.5 ? '#eab308' : '#ef4444';
    return (
        <span style={{
            fontSize: '0.65rem', fontWeight: 900, color,
            background: `${color}15`, padding: '1px 5px',
            borderRadius: '6px', fontFamily: 'var(--font-mono)'
        }}>
            Z {val > 0 ? '+' : ''}{val.toFixed(1)}
        </span>
    );
};

/* ── Metric Card ── */
const MetricCard = ({ label, unit, value, trend, icon, sub, subColor, zScore, sparkData, sparkColor, comparison }) => (
    <div className="ia-metric-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.33rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.39rem' }}>
                {zScore && <ZBadge z={zScore} />}
                {icon || <TrendArrow trend={trend} />}
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
                <div style={{ fontSize: '1.95rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {value ?? '—'}
                    {unit && <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginLeft: '2px' }}>{unit}</span>}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: subColor || 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>
                    {sub || ''}
                </div>
            </div>
            {sparkData && <Sparkline values={sparkData} color={sparkColor} />}
        </div>
        {comparison && (
            <div style={{
                fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                marginTop: '0.39rem', paddingTop: '0.39rem',
                borderTop: '1px solid rgba(255,255,255,0.04)'
            }}>
                {comparison}
            </div>
        )}
    </div>
);

/* ── Helper ── */
const getSleepColor = (label) => {
    if (!label) return 'rgba(255,255,255,0.4)';
    const l = label.toLowerCase();
    if (l.includes('buen')) return '#22c55e';
    if (l.includes('regular')) return '#eab308';
    return '#ef4444';
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const AIAnalysis = ({ analysis, isLoading, onRequestAnalysis, iea, intervalsData, error }) => {
    const [activeTab, setActiveTab] = useState('interpretacion');
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [expandedQ, setExpandedQ] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [feedbackDetail, setFeedbackDetail] = useState(null);

    // Parse analysis data
    const data = useMemo(() => {
        if (!analysis) return null;
        try {
            const parsed = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
            if (parsed && (parsed.statusLabel || parsed.greeting || parsed.prescription)) {
                return { type: 'json', ...parsed };
            }
        } catch { /* not JSON */ }
        return { type: 'stale' };
    }, [analysis]);

    // Extract sparkline data
    const sparklines = useMemo(() => {
        if (!intervalsData || !Array.isArray(intervalsData)) return {};
        const last7 = intervalsData.slice(0, 7).reverse();
        return {
            hrv: last7.map(d => d.hrv || 0).filter(v => v > 0),
            rhr: last7.map(d => d.restingHR || 0).filter(v => v > 0),
            sleep: last7.map(d => d.sleepScore || 0).filter(v => v > 0)
        };
    }, [intervalsData]);

    // Mini-history 5d
    const history5d = useMemo(() => {
        if (!intervalsData || !Array.isArray(intervalsData)) return [];
        return intervalsData.slice(0, 5).map(d => {
            const date = new Date(d.id);
            return {
                day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
                num: date.getDate(),
                hrv: d.hrv || 0,
                tss: Math.round(d.activities?.[0]?.icu_training_load || 0),
                isToday: d === intervalsData[0]
            };
        });
    }, [intervalsData]);

    // ── EMPTY / STALE STATE ──
    if ((!analysis && !isLoading) || (data?.type === 'stale' && !isLoading)) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{
                        padding: '0.75rem 1rem', borderRadius: '14px',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                <div className="card-glass" style={{
                    padding: '3rem 1.95rem', borderRadius: '32px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.95rem',
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.06), transparent)',
                    border: '1px solid rgba(6,182,212,0.15)'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Brain size={62} style={{ color: 'var(--cyan)', opacity: 0.8 }} />
                        <div style={{
                            position: 'absolute', top: -4, right: -4,
                            width: 14, height: 14, borderRadius: '50%',
                            background: 'var(--cyan)', animation: 'pulse 2s infinite'
                        }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.43rem', fontWeight: 900, color: '#fff', marginBottom: '0.65rem' }}>
                            Motor IA VIVO
                        </div>
                        <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                            Analiza tus métricas de hoy con inteligencia artificial.<br />
                            Obtén recomendaciones personalizadas.
                        </p>
                    </div>
                    <button onClick={onRequestAnalysis} className="ia-cta-btn">
                        <Brain size={23} /> Analizar Mi Día
                    </button>
                </div>
            </div>
        );
    }

    // ── LOADING ──
    if (isLoading) {
        return (
            <div className="card-glass" style={{
                padding: '4rem 1.95rem', borderRadius: '32px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.95rem'
            }}>
                <Loader2 size={52} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                    Sincronizando bio-datos...
                </span>
                <div style={{ width: '60%', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                        width: '40%', height: '100%', borderRadius: '2px',
                        background: 'var(--cyan)', animation: 'loading-bar 1.5s ease-in-out infinite'
                    }} />
                </div>
            </div>
        );
    }

    if (!data || data.type !== 'json') return null;

    const theme = STATUS[data.statusColor] || STATUS.green;
    const metrics = data.metricsSnapshot || {};
    const comparisons = data.comparisons || {};

    const TABS = [
        { id: 'interpretacion', label: 'Interpretación', icon: <Search size={15} /> },
        { id: 'prescripcion', label: 'Prescripción', icon: <Zap size={15} /> },
        { id: 'plan', label: 'Plan', icon: <CheckSquare size={15} /> },
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

            {/* Error banner */}
            {error && (
                <div style={{
                    padding: '0.7rem 1rem', borderRadius: '14px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.4
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ════════════════════════════════════════════════
                1. HEADER — Siempre visible, encima de las tabs
            ════════════════════════════════════════════════ */}
            <div className="ia-header" style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.glow
            }}>
                {/* Glow blob */}
                <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 100, height: 100, borderRadius: '50%',
                    background: theme.accent, filter: 'blur(60px)', opacity: 0.08
                }} />

                {/* Status pill + icon — sin título */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Brain size={16} style={{ color: theme.accent, opacity: 0.7 }} />
                    <div style={{ flex: 1 }} />
                    <span className="ia-status-pill" style={{ background: theme.pill, color: theme.accent }}>
                        {data.statusLabel}
                    </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
                    {data.greeting}
                </div>

                {data.consistencyStreak && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.45rem',
                        marginTop: '0.6rem', padding: '0.3rem 0.6rem',
                        background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                        position: 'relative', zIndex: 1
                    }}>
                        <Flame size={13} style={{ color: '#f97316' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                            {data.consistencyStreak.text}
                        </span>
                    </div>
                )}
            </div>



            {/* ════════════════════════════════════════════════
                3. TAB BAR — Selector fijo
            ════════════════════════════════════════════════ */}
            <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '18px',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '4px',
                gap: '4px'
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.6rem 0.3rem',
                            borderRadius: '14px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            transition: 'all 0.2s ease',
                            background: activeTab === tab.id
                                ? (tab.id === 'interpretacion' ? 'rgba(6,182,212,0.15)' : tab.id === 'prescripcion' ? `${theme.accent}20` : 'rgba(34,197,94,0.12)')
                                : 'transparent',
                            color: activeTab === tab.id
                                ? (tab.id === 'interpretacion' ? 'var(--cyan)' : tab.id === 'prescripcion' ? theme.accent : '#22c55e')
                                : 'rgba(255,255,255,0.35)',
                            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════
                4. TAB CONTENT
            ════════════════════════════════════════════════ */}

            {/* ── TAB 1: INTERPRETACIÓN ── */}
            {activeTab === 'interpretacion' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                    {/* Historia 5d */}
                    {history5d.length > 0 && (
                        <div className="card-glass" style={{ padding: '1rem', borderRadius: '20px' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.6rem' }}>
                                Últimos 5 días
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
                                {history5d.map((d, i) => (
                                    <div key={i} style={{
                                        flex: '1 1 0',
                                        padding: '0.6rem 0.3rem',
                                        background: d.isToday ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${d.isToday ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)'}`,
                                        borderRadius: '13px', textAlign: 'center', minWidth: '52px'
                                    }}>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: d.isToday ? 'var(--cyan)' : 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                                            {d.isToday ? 'Hoy' : d.day}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginBottom: '0.3rem' }}>{d.num}</div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{d.hrv || '—'}</div>
                                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>HRV</div>
                                        {d.tss > 0 && (
                                            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--cyan)', marginTop: '0.3rem' }}>{d.tss} TSS</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interpretación */}
                    <div className="card-glass" style={{ padding: '1.1rem 1.3rem', borderRadius: '22px' }}>
                        <div className="ia-section-label">🔎 Interpretación</div>
                        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                            {data.interpretation}
                        </p>
                        {data.yesterdayImpact && (
                            <p style={{
                                fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
                                margin: '0.8rem 0 0', fontWeight: 500, fontStyle: 'italic',
                                paddingLeft: '0.9rem', borderLeft: '2px solid rgba(255,255,255,0.1)'
                            }}>
                                ↩ {data.yesterdayImpact}
                            </p>
                        )}
                    </div>

                    {/* Análisis técnico expandible */}
                    {data.technicalDeepDive && (
                        <div className="card-glass" style={{ padding: '0', borderRadius: '22px', overflow: 'hidden' }}>
                            <button onClick={() => setShowDeepDive(!showDeepDive)} className="ia-expand-btn">
                                <Activity size={16} style={{ color: 'var(--cyan)', opacity: 0.6 }} />
                                <span>{showDeepDive ? 'Ocultar análisis técnico' : 'Ver análisis técnico detallado'}</span>
                                {showDeepDive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {showDeepDive && (
                                <div className="animate-fade-in" style={{ padding: '0 1.3rem 1rem' }}>
                                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                                        {data.technicalDeepDive}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: PRESCRIPCIÓN ── */}
            {activeTab === 'prescripcion' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                    {/* Bloque prescripción principal */}
                    {data.prescription && (
                        <div className="ia-prescription" style={{
                            borderColor: theme.border,
                            boxShadow: `0 0 30px ${theme.accent}10`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' }}>
                                <div className="ia-rx-icon" style={{ background: `${theme.accent}18` }}>
                                    <Zap size={18} style={{ color: theme.accent }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Prescripción
                                </span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                                {data.prescription.title}
                            </div>
                            {data.prescription.details && (
                                <div className="ia-rx-details">
                                    {data.prescription.details}
                                </div>
                            )}
                            <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.5)', margin: '0.7rem 0 0', lineHeight: 1.55, fontWeight: 500 }}>
                                {data.prescription.reason}
                            </p>
                        </div>
                    )}

                    {/* Mañana en el plan */}
                    {data.tomorrowPlan && (
                        <div className="card-glass" style={{
                            padding: '1rem',
                            borderRadius: '22px',
                            background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(0,0,0,0))',
                            border: '1px solid rgba(6,182,212,0.12)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.55rem' }}>
                                <Calendar size={16} style={{ color: 'var(--cyan)' }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Mañana en el Plan
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'rgba(6,182,212,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {data.tomorrowPlan.type === 'Gym' ? <Dumbbell size={22} style={{ color: 'var(--cyan)' }} /> :
                                        data.tomorrowPlan.type === 'Bici' ? <Bike size={22} style={{ color: 'var(--cyan)' }} /> :
                                            <Moon size={22} style={{ color: 'var(--cyan)' }} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                                        {data.tomorrowPlan.title}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>
                                        {data.tomorrowPlan.details}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nota motivacional */}
                    {data.motivationalNote && (
                        <div className="ia-motivation" style={{ borderColor: `${theme.accent}20` }}>
                            <Award size={20} style={{ color: theme.accent, opacity: 0.6, flexShrink: 0 }} />
                            <p style={{ fontSize: '0.98rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                                {data.motivationalNote}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 3: PLAN ── */}
            {activeTab === 'plan' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                    {/* Pasos de acción */}
                    {data.actionSteps?.length > 0 && (
                        <div className="card-glass" style={{ padding: '1.1rem 1rem', borderRadius: '22px' }}>
                            <div className="ia-section-label">✅ Plan de Acción</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {data.actionSteps.map((step, i) => (
                                    <div key={i} className="ia-action-step">
                                        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{step.icon}</span>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                                            {step.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preguntas rápidas */}
                    {data.quickQuestions?.length > 0 && (
                        <div className="card-glass" style={{ padding: '1.1rem 1rem', borderRadius: '22px' }}>
                            <div className="ia-section-label">
                                <HelpCircle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px', opacity: 0.5 }} />
                                Preguntas Rápidas
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {data.quickQuestions.map((q, i) => (
                                    <div key={i}>
                                        <button
                                            onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                            className="ia-question-btn"
                                            style={{
                                                background: expandedQ === i ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
                                                borderColor: expandedQ === i ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            <MessageCircle size={15} style={{ color: 'var(--cyan)', opacity: 0.5, flexShrink: 0 }} />
                                            <span style={{ flex: 1, textAlign: 'left' }}>{q.question}</span>
                                            {expandedQ === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>
                                        {expandedQ === i && (
                                            <div className="animate-fade-in" style={{
                                                padding: '0.75rem 1rem 0.75rem 1.9rem',
                                                fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)',
                                                lineHeight: 1.6, fontWeight: 500
                                            }}>
                                                {q.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback + Regenerar */}
                    <div style={{
                        padding: '1rem', background: 'rgba(255,255,255,0.02)',
                        borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', display: 'block', marginBottom: '0.15rem' }}>
                                        ¿Qué te parece?
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                                        Tu opinión mejora el análisis
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => { setFeedback('up'); setFeedbackDetail(null); }} className="ia-fb-btn" data-active={feedback === 'up'} style={{ padding: '0.7rem', borderRadius: '14px' }}>
                                        <ThumbsUp size={22} />
                                    </button>
                                    <button onClick={() => { setFeedback('down'); setFeedbackDetail(null); }} className="ia-fb-btn" data-active={feedback === 'down'} style={{ padding: '0.7rem', borderRadius: '14px' }}>
                                        <ThumbsDown size={22} />
                                    </button>
                                </div>
                            </div>

                            {feedback && !feedbackDetail && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', width: '100%' }}>¿Qué sección fue más útil?</span>
                                    {['Interpretación', 'Prescripción', 'Plan'].map(opt => (
                                        <button key={opt} onClick={() => setFeedbackDetail(opt)} className="ia-fb-detail-btn" style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', borderRadius: '10px' }}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {feedbackDetail && (
                                <span className="animate-fade-in" style={{
                                    fontSize: '0.82rem', fontWeight: 700,
                                    color: feedback === 'up' ? '#22c55e' : '#ef4444',
                                    textAlign: 'center', display: 'block',
                                    background: feedback === 'up' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                    padding: '0.55rem', borderRadius: '10px'
                                }}>
                                    ¡Gracias! Nos fijamos más en {feedbackDetail.toLowerCase()}.
                                </span>
                            )}

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                            <button onClick={onRequestAnalysis} className="ia-refresh-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '14px' }}>
                                <RefreshCw size={17} />
                                <span style={{ fontSize: '0.85rem' }}>Regenerar Análisis Completo</span>
                            </button>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};

export default AIAnalysis;

/**
 * VIVO — AI Analysis v4.0
 * Layout de 3 pestañas internas: Interpretación / Prescripción / Plan
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import {
    Brain, Loader2, RefreshCw, Moon, Zap, Droplets, Activity,
    ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus,
    ChevronDown, ChevronUp, HelpCircle, Flame, Award, MessageCircle,
    Calendar, Dumbbell, Bike, Search, Clipboard, CheckSquare, Send
} from 'lucide-react';
import { chatWithCoach } from '../services/geminiService';
import { PLAN, MESOCYCLE_START_DATE, MESOCYCLE_END_DATE, getWeekForDate, getPlannedSession } from '../services/mesocycleService';

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
const AIAnalysis = ({ analysis, isLoading, onRequestAnalysis, iea, intervalsData, error, activeMesocycleData }) => {
    const [activeTab, setActiveTab] = useState('interpretacion');
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [expandedQ, setExpandedQ] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [feedbackDetail, setFeedbackDetail] = useState(null);
    
    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        
        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
        setIsChatLoading(true);

        // ── Build FULL VIVO context for the Coach ──
        const buildFullContext = () => {
            if (!intervalsData || intervalsData.length === 0) return {};

            // ── Mesocycle / Training Plan context ──
            const todayStr = new Date().toLocaleDateString('sv');
            const customStart = activeMesocycleData?.startDate || MESOCYCLE_START_DATE;
            
            const getWeekForDateDynamic = (dStr) => {
                const d = new Date(dStr);
                const s = new Date(customStart);
                return Math.floor((d - s) / (1000 * 60 * 60 * 24 * 7)) + 1;
            };

            const currentWeek = getWeekForDateDynamic(todayStr);
            const todayPlanned = activeMesocycleData?.sessions?.[todayStr] || getPlannedSession(todayStr);
            
            const weekLabel = activeMesocycleData?.weekLabels?.[currentWeek - 1] || 'Fuera de mesociclo';

            // Build this week's plan summary
            const weekStart = new Date(todayStr);
            const dow = weekStart.getDay();
            weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1)); // Monday
            const thisWeekPlan = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + i);
                const dateStr = d.toLocaleDateString('sv');
                const session = getPlannedSession(dateStr);
                const dayName = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i];
                const isToday = dateStr === todayStr;
                return `${isToday ? '→ ' : '  '}${dayName} ${dateStr}: ${session.type} - ${session.title}`;
            });

            const now = Date.now();
            const todayData = intervalsData[0] || {};
            const todayActivity = todayData.activities?.[0];

            // ── Athlete Profile ──
            let bestNP = null, totalTSS7 = 0, totalTSS28 = 0;
            intervalsData.forEach(day => {
                const daysAgo = (now - new Date(day.id).getTime()) / 86400000;
                const tss = day.dailyTSS || 0;
                if (daysAgo <= 7) totalTSS7 += tss;
                if (daysAgo <= 28) totalTSS28 += tss;
                (day.activities || []).forEach(a => {
                    if (['Ride','VirtualRide','Cycling'].includes(a.type)) {
                        const np = a.icu_weighted_avg_watts;
                        if (np && np > (bestNP || 0)) bestNP = Math.round(np);
                    }
                });
            });

            // ── Last 7 days history (what you see in Métricas tab) ──
            const last7 = intervalsData.slice(0, 7).map(d => {
                const acts = (d.activities || []).map(a =>
                    `${a.name || a.type} (${Math.round((a.moving_time||0)/60)}'` +
                    `${a.icu_weighted_avg_watts ? ` NP:${Math.round(a.icu_weighted_avg_watts)}W` : ''}` +
                    `${a.average_heartrate ? ` FC:${Math.round(a.average_heartrate)}` : ''}` +
                    `${a.icu_training_load ? ` TSS:${Math.round(a.icu_training_load)}` : ''})`
                ).join(' + ') || 'Descanso';
                return `${d.id}: HRV=${d.hrv||'-'} RHR=${d.restingHR||d.rhr||'-'} Sueño=${d.sleepScore||'-'} TSS=${d.dailyTSS||0} → ${acts}`;
            });

            // ── Today's workout details ──
            const workout = todayActivity ? {
                name: todayActivity.name,
                type: todayActivity.type,
                moving_time: Math.round((todayActivity.moving_time||0)/60) + ' min',
                elapsed_time: Math.round((todayActivity.elapsed_time||0)/60) + ' min',
                distance_km: todayActivity.distance ? (todayActivity.distance/1000).toFixed(1) : null,
                elevation_gain: todayActivity.total_elevation_gain ? Math.round(todayActivity.total_elevation_gain)+'m' : null,
                avg_hr: todayActivity.average_heartrate,
                max_hr: todayActivity.max_heartrate,
                avg_watts: todayActivity.average_watts ? Math.round(todayActivity.average_watts) : null,
                np: todayActivity.icu_weighted_avg_watts ? Math.round(todayActivity.icu_weighted_avg_watts) : null,
                if_ratio: todayActivity.icu_intensity_factor?.toFixed(2),
                vi: todayActivity.icu_variability_index?.toFixed(2),
                tss: todayActivity.icu_training_load ? Math.round(todayActivity.icu_training_load) : null,
                decoupling: todayActivity.icu_aerobic_decoupling ? (todayActivity.icu_aerobic_decoupling*100).toFixed(1)+'%' : null,
                avg_cadence: todayActivity.average_cadence ? Math.round(todayActivity.average_cadence) : null,
                start_time: todayActivity.start_date_local ? new Date(todayActivity.start_date_local).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : null,
            } : null;

            // ── IEA details (what you see in Hoy tab) ──
            const ieaDetails = iea ? {
                score: iea.score,
                label: iea.label,
                hrvZScore: iea.details?.hrv?.zScore,
                rhrDeviation: iea.details?.rhr?.deviation,
                rhrBaseline: iea.details?.rhr?.baseline,
                sleepPenalty: iea.details?.sleep?.penalty,
                loadTSB: iea.details?.load?.tsb,
                bands: iea.bands,
            } : null;

            return {
                athleteProfile: {
                    ftp: 235, ftp_target: 260, weight: 70, height: 184, age: 54,
                    best_np_90d: bestNP,
                    ctl: Math.round(todayData.ctl || 0),
                    atl: Math.round(todayData.atl || 0),
                    tsb: iea?.details?.load?.tsb,
                    max_ctl: Math.round(Math.max(...intervalsData.filter(d=>d.ctl).map(d=>d.ctl)) || 0),
                    tss_7d: Math.round(totalTSS7),
                    tss_28d: Math.round(totalTSS28),
                    avg_weekly_tss: Math.round(totalTSS28 / 4),
                },
                morning: {
                    hrv: todayData.hrv,
                    restingHR: todayData.rhr || todayData.restingHR,
                    sleep: todayData.sleepScore,
                    sleepHours: todayData.sleepSecs ? (todayData.sleepSecs/3600).toFixed(1) : null,
                },
                ieaDetails,
                todayWorkout: workout,
                recentHistory: last7,
                todayPlan: data?.prescription?.title || 'No definido',
                // 📋 Mesocycle / Training Plan
                mesocycle: {
                    startDate: MESOCYCLE_START_DATE,
                    endDate: MESOCYCLE_END_DATE,
                    currentWeek,
                    weekLabel,
                    todayPlanned: todayPlanned ? `${todayPlanned.type} - ${todayPlanned.title}: ${todayPlanned.desc}` : 'Sin sesión planificada',
                    thisWeekPlan,
                },
            };
        };

        const ctx = buildFullContext();

        try {
            const response = await chatWithCoach(userMsg, chatMessages, ctx);
            setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
        } catch (e) {
            console.error('[Chat] Error:', e);
        } finally {
            setIsChatLoading(false);
        }
    };

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
        { id: 'chat', label: 'Coach Chat', icon: <MessageCircle size={15} /> },
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
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        marginTop: '0.4rem',
                        position: 'relative', zIndex: 1
                    }}>
                        <Flame size={14} style={{ color: '#f97316', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
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
                            {/* Regenerar */}
                            <button onClick={onRequestAnalysis} className="ia-refresh-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '14px' }}>
                                <RefreshCw size={17} />
                                <span style={{ fontSize: '0.85rem' }}>Regenerar Análisis Completo</span>
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* ── TAB 4: CHAT CON EL COACH ── */}
            {activeTab === 'chat' && (
                <CoachChatView 
                    chatMessages={chatMessages}
                    isChatLoading={isChatLoading}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleSendMessage={handleSendMessage}
                />
            )}


        </div>
    );
};

/* ── TAB 4: CHAT CON EL COACH ── */
const CoachChatView = ({ chatMessages, isChatLoading, chatInput, setChatInput, handleSendMessage }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isChatLoading]);

    const QUICK_QUESTIONS = [
        "¿Cómo ves mi HRV hoy?",
        "¿Está bien el entreno que acabo de hacer?",
        "¿Cuándo toca deload?",
        "¿Subo el volumen esta semana?",
    ];

    return (
        <div className="animate-fade-in" style={{ 
            display: 'flex', flexDirection: 'column',
            height: '70vh', minHeight: '520px',
            borderRadius: '24px', overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(6,182,212,0.04) 0%, rgba(0,0,0,0.3) 100%)',
            border: '1px solid rgba(6,182,212,0.15)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
        }}>
            {/* Header */}
            <div style={{
                padding: '0.9rem 1.2rem',
                background: 'rgba(6,182,212,0.08)',
                borderBottom: '1px solid rgba(6,182,212,0.15)',
                display: 'flex', alignItems: 'center', gap: '0.8rem'
            }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--cyan), #0ea5e9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', boxShadow: '0 0 16px rgba(6,182,212,0.4)'
                }}>🧠</div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Coach VIVO</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
                        En línea · Tengo tus datos a la vista
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{ 
                flex: 1, padding: '1.2rem 1rem', overflowY: 'auto', 
                display: 'flex', flexDirection: 'column', gap: '1rem',
                scrollbarWidth: 'thin', scrollbarColor: 'rgba(6,182,212,0.2) transparent'
            }}>
                {/* Welcome State */}
                {chatMessages.length === 0 && (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👋</div>
                        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: '0.4rem' }}>
                            ¡Hola Jose! Soy tu Coach.
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                            Tengo tus biométricos y tu historial de entreno a la vista. Pregúntame lo que quieras.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                            {QUICK_QUESTIONS.map((q, i) => (
                                <button key={i} onClick={() => setChatInput(q)} style={{
                                    padding: '0.5rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem',
                                    background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)',
                                    color: 'var(--cyan)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(6,182,212,0.18)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(6,182,212,0.08)'}
                                >{q}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-end', gap: '0.6rem'
                    }}>
                        {/* Avatar */}
                        {msg.role === 'model' && (
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, var(--cyan), #0ea5e9)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem'
                            }}>🧠</div>
                        )}

                        {/* Bubble */}
                        <div style={{
                            maxWidth: '82%',
                            padding: '0.85rem 1.1rem',
                            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background: msg.role === 'user'
                                ? 'linear-gradient(135deg, var(--cyan), #0ea5e9)'
                                : 'rgba(255,255,255,0.06)',
                            color: msg.role === 'user' ? '#000' : '#fff',
                            fontSize: '0.9rem',
                            fontWeight: msg.role === 'user' ? 700 : 500,
                            lineHeight: 1.6,
                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: msg.role === 'user' ? '0 4px 20px rgba(6,182,212,0.3)' : 'none',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                        }}>
                            {msg.role === 'model' 
                                ? msg.parts[0].text
                                    .replace(/\*\*(.*?)\*\*/g, '$1')
                                    .replace(/\*(.*?)\*/g, '$1')
                                    .replace(/^#+\s/gm, '')
                                    .replace(/^\*\s/gm, '• ')
                                    .replace(/^-\s/gm, '• ')
                                : msg.parts[0].text
                            }
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isChatLoading && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--cyan), #0ea5e9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
                        }}>🧠</div>
                        <div style={{
                            padding: '0.85rem 1.1rem', borderRadius: '20px 20px 20px 4px',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', gap: '0.3rem', alignItems: 'center'
                        }}>
                            {[0, 1, 2].map(d => (
                                <div key={d} style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    background: 'var(--cyan)',
                                    animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`
                                }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ 
                padding: '0.9rem 1rem',
                background: 'rgba(0,0,0,0.3)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', gap: '0.6rem', alignItems: 'center'
            }}>
                <input 
                    type="text" 
                    placeholder="Pregunta a tu Coach... (Enter para enviar)"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        borderRadius: '14px',
                        padding: '0.8rem 1.1rem',
                        color: '#fff',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit'
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(6,182,212,0.2)'}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                    style={{
                        width: '46px', height: '46px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: chatInput.trim() ? 'linear-gradient(135deg, var(--cyan), #0ea5e9)' : 'rgba(255,255,255,0.05)',
                        border: 'none', cursor: chatInput.trim() ? 'pointer' : 'default',
                        opacity: isChatLoading ? 0.4 : 1,
                        transition: 'all 0.25s',
                        boxShadow: chatInput.trim() ? '0 4px 16px rgba(6,182,212,0.4)' : 'none',
                        flexShrink: 0
                    }}
                >
                    <Send size={18} color={chatInput.trim() ? '#000' : 'rgba(255,255,255,0.3)'} />
                </button>
            </div>
        </div>
    );
};

export default AIAnalysis;


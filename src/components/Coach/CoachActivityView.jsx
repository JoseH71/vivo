import React, { useState, useMemo } from 'react';
import {
    Activity, Calendar, Clock, Zap, Dumbbell, Bike, Moon,
    ChevronRight, Info, Check, ChevronLeft, ChevronDown, ChevronUp, FileText, X, Brain, RotateCcw
} from 'lucide-react';
import { getPlannedSession, PLAN, getColorForType, MESOCYCLE_START_DATE, MESOCYCLE_END_DATE } from '../../services/mesocycleService';
import { getRecentWeights, sendToEsqueleto } from '../../services/esqueletoService';
import CoachPostWorkoutView from './CoachPostWorkoutView';

// --- Subcomponente: MasterPlanModal ---
const MasterPlanModal = ({ isOpen, onClose, activeMesocycleData, allMesocycles = [] }) => {
    const [viewedMesoId, setViewedMesoId] = useState(null);
    
    // Default to active on first open
    React.useEffect(() => {
        if (isOpen && activeMesocycleData && !viewedMesoId) {
            setViewedMesoId(activeMesocycleData.id);
        }
    }, [isOpen, activeMesocycleData]);

    if (!isOpen) return null;

    const currentMeso = allMesocycles.find(m => m.id === viewedMesoId) || activeMesocycleData;
    const mesoName = currentMeso?.name || 'Plan Maestro v4.0';
    const mesoRange = currentMeso ? `${currentMeso.startDate} — ${currentMeso.endDate}` : '16 FEB — 15 MAR 2026';
    
    // Generate sections dynamically from currentMeso
    let sections = [];
    if (currentMeso && currentMeso.sessions) {
        for (let wk = 0; wk < currentMeso.weeks; wk++) {
            const start = new Date(currentMeso.startDate);
            const days = [];
            for (let i = wk * 7; i < (wk + 1) * 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                days.push(d.toLocaleDateString('sv'));
            }
            sections.push({
                title: `SEMANA ${wk + 1}: ${currentMeso.weekLabels?.[wk] || 'TRABAJO'}`,
                color: currentMeso.weekColors?.[wk] || '#3b82f6',
                days: days
            });
        }
    } else {
        // Fallback or Legacy view logic if no dynamic sessions
        sections = [
            { title: 'SEMANA 1', color: '#3B82F6', days: ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22'] },
            { title: 'SEMANA 2', color: '#10B981', days: ['2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01'] },
            { title: 'SEMANA 3', color: '#F59E0B', days: ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08'] },
            { title: 'SEMANA 4', color: '#EF4444', days: ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15'] }
        ];
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 8, 12, 0.95)',
            zIndex: 1000,
            padding: '1.5rem',
            overflowY: 'auto'
        }} className="animate-fade-in">
            <div className="flex-between mb-6">
                <div className="flex-col">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">🏆 {mesoName}</h2>
                    <span className="text-xs text-muted font-bold opacity-60">{mesoRange}</span>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '14px', color: '#fff' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Selector de Plan */}
            {allMesocycles.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {allMesocycles.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setViewedMesoId(m.id)}
                            style={{
                                padding: '0.6rem 1rem', borderRadius: '12px',
                                background: viewedMesoId === m.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${viewedMesoId === m.id ? 'var(--cyan)' : 'rgba(255,255,255,0.05)'}`,
                                color: viewedMesoId === m.id ? 'var(--cyan)' : 'var(--text-muted)',
                                fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer'
                            }}
                        >
                            {m.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-col gap-xl">
                {sections.map(section => (
                    <div key={section.title} style={{ borderLeft: `4px solid ${section.color}`, paddingLeft: '1.25rem' }}>
                        <h3 style={{ color: section.color, fontSize: '0.8rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '0.1em' }} className="uppercase">
                            {section.title}
                        </h3>
                        <div className="flex-col gap-lg">
                            {section.days.map(date => {
                                const p = (currentMeso?.sessions?.[date]) || getPlannedSession(date);
                                const d = new Date(date);
                                const dayName = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'][d.getDay() === 0 ? 6 : d.getDay() - 1];
                                return (
                                    <div key={date}>
                                        <div className="flex-between mb-2">
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>{dayName} {d.getDate()}-{d.getMonth() + 1} | {p.title}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--cyan)' }}>{p.tss > 0 ? `${p.tss} TSS` : ''}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, margin: 0 }}>{p.desc}</p>
                                        {p.exercises && (
                                            <div style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                                                {p.exercises.map((ex, i) => (
                                                    <div key={i} style={{ fontSize: '0.8rem', color: '#BFC7D5', padding: '2px 0' }}>• {ex}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    Este plan es tu guía, pero la app VIVO es el juez.
                    Si un día amaneces en rojo, el plan se adapta.
                </p>
            </div>
        </div>
    );
};

const TrainIcon = ({ type, size = 16, color = "currentColor" }) => {
    switch (type) {
        case 'Dumbbell': return <Dumbbell size={size} style={{ color, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})` }} />;
        case 'Zap': return <Zap size={size} style={{ color, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})` }} />;
        case 'Bike': return <Bike size={size} style={{ color, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})` }} />;
        case 'Moon': return <Moon size={size} style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 12px #60a5fa) drop-shadow(0 0 6px #93c5fd)' }} />;
        default: return <Activity size={size} style={{ color }} />;
    }
};

const CoachActivityView = ({ intervalsData, dailyRecommendation, activeMesocycleData, weeklyPlan = {}, allMesocycles = [] }) => {
    const todayStr = new Date().toLocaleDateString('sv');
    
    // Helper local for lookups
    const getPlannedSessionLocal = (dateStr) => {
        return weeklyPlan[dateStr] || { type: 'Descanso', title: 'Fuera de Plan', desc: '-', tss: 0, icon: 'Moon' };
    };

    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [manualOverride, setManualOverride] = useState(null);
    const [showFullMesocycle, setShowFullMesocycle] = useState(false);
    const [showMasterPlan, setShowMasterPlan] = useState(false);
    const [showPlanBelowAnalysis, setShowPlanBelowAnalysis] = useState(false);

    const plannedToday = manualOverride || getPlannedSessionLocal(todayStr);
    const selectedSession = getPlannedSessionLocal(selectedDate);

    // Detect if today has a completed activity
    const todayData = useMemo(() => {
        if (!intervalsData || !Array.isArray(intervalsData)) return null;
        return intervalsData.find(d => d.id === todayStr || d.date === todayStr) || null;
    }, [intervalsData, todayStr]);

    const hasCompletedActivity = useMemo(() => {
        return todayData?.activities?.length > 0 && todayData.activities.some(a => (a.icu_training_load || a.tss || 0) > 0);
    }, [todayData]);

    // Detect if selected (past) day has a completed activity
    const selectedDayData = useMemo(() => {
        if (!intervalsData || !Array.isArray(intervalsData) || selectedDate === todayStr) return null;
        return intervalsData.find(d => d.id === selectedDate || d.date === selectedDate) || null;
    }, [intervalsData, selectedDate, todayStr]);

    const selectedDayHasActivity = useMemo(() => {
        return selectedDayData?.activities?.length > 0 && selectedDayData.activities.some(a => (a.icu_training_load || a.tss || 0) > 0);
    }, [selectedDayData]);
    const [sendingEsqueleto, setSendingEsqueleto] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [sessionWeights, setSessionWeights] = useState({});

    // Fetch weights when a gym session is selected
    React.useEffect(() => {
        if (selectedSession?.type === 'Gym' && selectedSession.exercises) {
            const names = selectedSession.exercises.map(ex => {
                const match = ex.match(/^([^:]+):/);
                return match ? match[1].trim() : ex;
            });
            getRecentWeights(names).then(setSessionWeights);
        } else {
            setSessionWeights({});
        }
    }, [selectedSession, selectedDate]);

    // Helpers to parse exercise strings
    const parseExercise = (exStr) => {
        try {
            // "Prensa Matrix: 4×8 (RIR 2)" or "Prensa Matrix: 4x8 (RIR 2)"
            const nameMatch = exStr.match(/^([^:]+):/);
            const setsRepsMatch = exStr.match(/(\d+)[×x](\d+)/);
            const rirMatch = exStr.match(/\(RIR\s*(\d+)\)/);

            return {
                name: nameMatch ? nameMatch[1].trim() : exStr,
                sets: setsRepsMatch ? setsRepsMatch[1] : '3', // Default to 3 if not found
                reps: setsRepsMatch ? setsRepsMatch[2] : '10', // Default to 10 if not found
                rir: rirMatch ? rirMatch[1] : '2'
            };
        } catch {
            return { name: exStr, sets: '3', reps: '10', rir: '2' };
        }
    };

    const handleSendToEsqueleto = async () => {
        if (!selectedSession || selectedSession.type !== 'Gym') return;

        setSendingEsqueleto(true);
        try {
            const parsedExercises = selectedSession.exercises.map(parseExercise);
            const names = parsedExercises.map(ex => ex.name);

            // 1. Fetch recent weights from Esqueleto History
            const recentData = await getRecentWeights(names);

            // 2. Build workout with fetched weights
            const workoutToSend = {
                title: selectedSession.title,
                date: selectedDate,
                exercises: parsedExercises.map(ex => ({
                    ...ex,
                    load: recentData[ex.name]?.load || '0 kg',
                    rir: recentData[ex.name]?.rir || ex.rir
                }))
            };

            // 3. Send to Esqueleto Active Tab
            const success = await sendToEsqueleto(workoutToSend);
            if (success) {
                setSentSuccess(true);
                setTimeout(() => setSentSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error sending to Esqueleto:', error);
        } finally {
            setSendingEsqueleto(false);
        }
    };

    // Get IEA Score (0-100)
    const ieaScore = dailyRecommendation?.iea || 70;

    // Generate Calendar Days
    const calendarDays = useMemo(() => {
        const days = [];
        // Start calendar from Jan 26th (Monday) to align with headers [L, M, X, J, V, S, D]
        const start = new Date('2026-01-26'); 

        // Show 70 days (10 weeks) to cover February, March and early April
        for (let i = 0; i < 70; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dStr = d.toLocaleDateString('sv');
            const p = getPlannedSessionLocal(dStr);

            const isPast = dStr <= todayStr;

            // Check if the day has a completed activity in intervalsData
            const dayData = intervalsData?.find(d => d.id === dStr || d.date === dStr);
            const isDone = !!(dayData && dayData.activities?.some(a => (a.icu_training_load || a.tss || 0) > 0));

            days.push({
                date: dStr,
                dayNum: d.getDate(),
                session: p,
                isToday: dStr === todayStr,
                isSelected: dStr === selectedDate,
                isPast,
                isDone,
                hasPlannedActivity: p.type !== 'Descanso' && p.type !== null
            });
        }
        return days;
    }, [todayStr, selectedDate, intervalsData, weeklyPlan]);

    // Derived Suggestion
    const suggestion = dailyRecommendation || {
        title: plannedToday.title,
        workout: plannedToday.desc,
        color: 'cyan'
    };

    return (
        <div className="copilot-container stagger">
            <MasterPlanModal isOpen={showMasterPlan} onClose={() => setShowMasterPlan(false)} activeMesocycleData={activeMesocycleData} allMesocycles={allMesocycles} />

            {/* POST-WORKOUT ANALYSIS — today or selected past day */}
            {(hasCompletedActivity && selectedDate === todayStr) && (
                <div style={{ marginBottom: '1rem' }}>
                    <CoachPostWorkoutView todayData={todayData} dateStr={todayStr} />
                    <button
                        onClick={() => setShowPlanBelowAnalysis(!showPlanBelowAnalysis)}
                        style={{
                            width: '100%', marginTop: '0.75rem', padding: '0.6rem',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
                            cursor: 'pointer', fontFamily: 'var(--font-mono)'
                        }}
                    >
                        {showPlanBelowAnalysis ? 'Ocultar planificación' : 'Ver planificación del día'}
                    </button>
                </div>
            )}

            {/* POST-WORKOUT ANALYSIS — selected PAST day */}
            {selectedDayHasActivity && selectedDate !== todayStr && (
                <div style={{ marginBottom: '1rem' }}>
                    <CoachPostWorkoutView todayData={selectedDayData} dateStr={selectedDate} />
                    <button
                        onClick={() => setShowPlanBelowAnalysis(!showPlanBelowAnalysis)}
                        style={{
                            width: '100%', marginTop: '0.75rem', padding: '0.6rem',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
                            cursor: 'pointer', fontFamily: 'var(--font-mono)'
                        }}
                    >
                        {showPlanBelowAnalysis ? 'Ocultar planificación' : 'Ver planificación del día'}
                    </button>
                </div>
            )}

            {/* CAPA 1: ENTRENADOR CONTEXTUAL (hidden when post-workout is active, unless toggled) */}
            {(!(hasCompletedActivity && selectedDate === todayStr) && !selectedDayHasActivity || showPlanBelowAnalysis) && (
                <div>
                    <div className="copilot-card copilot-main" style={{ padding: '1.5rem' }}>
                        <div className="flex-col gap-md">
                            {/* Header: Coach | Ajuste | IEA */}
                            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                                <div style={{ margin: 0, color: 'var(--cyan)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrenador</div>

                                <div className="flex-row gap-md items-center">
                                    {suggestion.color !== 'cyan' && (
                                        <button
                                            onClick={() => {
                                                if (manualOverride?.isSuggested) {
                                                    setManualOverride(null);
                                                } else {
                                                    setManualOverride({
                                                        ...plannedToday,
                                                        title: suggestion.title,
                                                        desc: suggestion.workout,
                                                        isSuggested: true
                                                    });
                                                }
                                            }}
                                            className="btn-copilot-primary"
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '9px',
                                                borderRadius: '8px',
                                                background: manualOverride?.isSuggested ? 'rgba(16, 185, 129, 0.15)' : (suggestion.color === 'red' ? 'var(--red)' : 'var(--yellow)'),
                                                border: manualOverride?.isSuggested ? '1px solid var(--green)' : 'none',
                                                color: manualOverride?.isSuggested ? 'var(--green)' : '#fff',
                                                boxShadow: 'none',
                                                letterSpacing: '0.05em',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {manualOverride?.isSuggested ? (
                                                <>
                                                    <RotateCcw size={10} />
                                                    REVERTIR AL PLAN
                                                </>
                                            ) : (
                                                'APLICAR AJUSTE'
                                            )}
                                        </button>
                                    )}
                                    <div className="text-micro-motive" style={{ color: 'var(--cyan)', fontWeight: 800 }}>IEA {ieaScore}</div>
                                </div>
                            </div>

                            {/* Explicación Detallada Plan vs Ajuste */}
                            <div className="flex-col gap-lg">
                                <div className="flex-row items-start gap-md">
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                                        <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 900 }}>Tu Plan Hoy</div>
                                        <h2 className="font-black" style={{ fontSize: '1.2rem', color: 'var(--cyan)', margin: 0 }}>{plannedToday.title}</h2>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0', lineHeight: 1.3 }}>{plannedToday.desc}</p>
                                    </div>

                                    <div style={{ alignSelf: 'center', opacity: 0.3 }}>
                                        <ChevronRight size={20} />
                                    </div>

                                    <div style={{
                                        background: suggestion.color === 'cyan' ? 'rgba(6, 182, 212, 0.05)' : suggestion.color === 'yellow' ? 'rgba(234, 179, 8, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        border: `1px solid ${suggestion.color === 'cyan' ? 'rgba(6, 182, 212, 0.2)' : suggestion.color === 'yellow' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                        flex: 1.2
                                    }}>
                                        <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 900 }}>Sugerencia IA</div>
                                        <h2 className="font-black" style={{ fontSize: '1.2rem', color: 'var(--cyan)', margin: 0 }}>{suggestion.title}</h2>
                                        <p style={{ fontSize: '0.8rem', color: '#fff', opacity: 0.9, margin: '4px 0 0 0', lineHeight: 1.3, fontWeight: 500 }}>{suggestion.workout}</p>
                                    </div>
                                </div>

                                {/* El "Por qué" - Rationale (solo si hay ajuste real, no en Descanso) */}
                                {plannedToday.type !== 'Descanso' && (
                                    <div style={{ padding: '0 0.5rem' }}>
                                        <div className="flex-row gap-sm items-center mb-3">
                                            <Brain size={12} style={{ color: 'var(--cyan)' }} />
                                            <span className="text-xs font-black uppercase tracking-widest" style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 900 }}>Análisis del Ajuste</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {/* Comparativa RIR/Intensidad — solo si el ajuste difiere del plan */}
                                            {suggestion.color !== 'cyan' && (
                                                <div className="flex-row gap-md" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Dosis Plan</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                                                            {plannedToday.type === 'Gym' ? 'RIR 2 (Intenso)'
                                                                : plannedToday.type === 'Bike' ? 'SST / Z4 (Umbral)'
                                                                    : plannedToday.type === 'Run' ? 'Ritmo Umbral'
                                                                        : 'Alta intensidad'}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--yellow)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Dosis Ajustada</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                                                            {plannedToday.type === 'Gym' ? 'RIR 4 (Salud)'
                                                                : plannedToday.type === 'Bike' ? 'Z2 (Recuperación)'
                                                                    : plannedToday.type === 'Run' ? 'Trote Suave Z2'
                                                                        : 'Baja intensidad'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
                                                {suggestion.color === 'cyan'
                                                    ? 'Tu sistema está en equilibrio. Sigue el plan original para asegurar la progresión técnica.'
                                                    : 'El ajuste reduce la presión interna y el estrés del sistema nervioso. Pasamos de un entreno que "agota" a uno que "recupera", protegiendo tu reserva autonómica.'
                                                }
                                            </p>

                                            {suggestion.msg && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontStyle: 'italic', opacity: 0.8 }}>
                                                    • {suggestion.msg}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CAPA 2: CALENDARIO INTERACTIVO */}
                    <div className="copilot-secondary">
                        <div className="flex-between mb-4 px-1" style={{ alignItems: 'center' }}>
                            <div className="flex-col">
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 900, margin: 0 }}>Calendario</h3>
                                <div style={{ color: '#fff', fontSize: '10px', opacity: 0.6, fontWeight: 400, marginTop: '2px' }}>VIVO Active Plans</div>
                            </div>

                            <button
                                onClick={() => setShowMasterPlan(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    transform: 'translateX(5px)'
                                }}
                            >
                                <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--cyan)' }}>VER PLAN</span>
                            </button>

                            <button
                                onClick={() => setShowFullMesocycle(!showFullMesocycle)}
                                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {showFullMesocycle ? <ChevronUp size={14} color="var(--cyan)" /> : <ChevronDown size={14} color="var(--cyan)" />}
                                <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--cyan)' }}>{showFullMesocycle ? 'VER HOY' : 'VER TODO'}</span>
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '6px',
                            padding: '4px'
                        }}>
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(h => (
                                <div key={h} className="text-center" style={{ fontSize: '10px', color: '#fff', fontWeight: 400, marginBottom: '4px', opacity: 0.5 }}>{h}</div>
                            ))}

                            {calendarDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(day.date)}
                                    style={{
                                        aspectRatio: '1',
                                        background: day.isSelected ? 'rgba(59, 130, 246, 0.2)' : day.isToday ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                        border: day.isSelected ? '1px solid var(--blue)' : day.isToday ? '1px solid rgba(255,255,255,0.2)' : (day.isDone ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.05)'),
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '4px',
                                        left: '4px',
                                        fontSize: '8px',
                                        fontWeight: 400,
                                        opacity: day.isSelected ? 1 : 0.6,
                                        color: day.isToday ? 'var(--cyan)' : '#fff'
                                    }}>
                                        {day.dayNum}
                                    </span>
                                    <TrainIcon
                                        type={day.session.icon}
                                        size={14}
                                        color={day.isSelected ? 'var(--blue)' : day.isToday ? 'var(--cyan)' : getColorForType(day.session.type)}
                                    />
                                    {/* Status badge: green check or red X for past planned days */}
                                    {day.isPast && day.hasPlannedActivity && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            background: day.isDone ? '#16a34a' : '#dc2626',
                                            borderRadius: '50%',
                                            width: '12px',
                                            height: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: day.isDone ? '0 0 8px rgba(34,197,94,0.7)' : '0 0 8px rgba(239,68,68,0.7)',
                                            zIndex: 2
                                        }}>
                                            {day.isDone
                                                ? <Check size={8} color="#fff" strokeWidth={3.5} />
                                                : <X size={8} color="#fff" strokeWidth={3.5} />
                                            }
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '8px', textAlign: 'center' }}>
                             <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0 }}>Desliza o haz scroll para ver las 10 semanas de planificación histórica y futura.</p>
                        </div>
                    </div>

                    {/* CAPA 3: DESGLOSE DETALLADO */}
                    {selectedSession && (
                        <div className="copilot-secondary animate-fade-in" style={{
                            marginTop: '3rem',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            padding: '1.5rem'
                        }}>
                            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                                <div className="flex-row gap-md items-center">
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '14px' }}>
                                        <TrainIcon type={selectedSession.icon} size={24} color={getColorForType(selectedSession.type)} />
                                    </div>
                                    <div>
                                        <h4 className="font-black" style={{ color: 'var(--cyan)', fontSize: '1.2rem', margin: 0, letterSpacing: '-0.01em' }}>{selectedSession.title}</h4>
                                        <div style={{ color: 'var(--cyan)', fontSize: '13px', fontWeight: 900, marginTop: '4px', textTransform: 'uppercase', opacity: 0.9 }}>
                                            {selectedDate.split('-').reverse().join('-')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="flex-row gap-xs items-center mb-3">
                                    <Info size={14} style={{ color: 'var(--cyan)' }} />
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Objetivo de Sesión</div>
                                </div>

                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.7)',
                                    lineHeight: '1.5',
                                    margin: '0 0 1rem 0',
                                    fontWeight: 400
                                }}>
                                    {selectedSession.desc}
                                </p>

                                {/* Lista de Ejercicios Detallada */}
                                {selectedSession.exercises && selectedSession.exercises.length > 0 && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: 'rgba(0,0,0,0.15)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        <div className="text-xs font-black uppercase tracking-widest text-muted mb-3" style={{ fontSize: '0.65rem', opacity: 0.5 }}>Ejercicios a Realizar</div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {selectedSession.exercises.map((ex, i) => {
                                                const parsed = parseExercise(ex);
                                                const weightRef = sessionWeights[parsed.name]?.load;
                                                return (
                                                    <li key={i} className="flex-row gap-sm items-start" style={{ fontSize: '0.85rem', color: '#EAF2F9' }}>
                                                        <div style={{ marginTop: '5px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }} />
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span>{ex}</span>
                                                            {weightRef && (
                                                                <span style={{ fontSize: '10px', color: 'var(--purple)', fontWeight: 800, marginTop: '2px' }}>
                                                                    REF: {weightRef} {sessionWeights[parsed.name]?.rir ? `(RIR ${sessionWeights[parsed.name].rir})` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {selectedSession.type !== 'Descanso' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex-between">
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>FOCO TÉCNICO</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 900 }}>
                                                {selectedSession.type === 'Gym' ? 'RIR 2 (Control)'
                                                    : selectedSession.type === 'Bike' ? 'Cadencia Estable'
                                                        : selectedSession.type === 'Run' ? 'Ritmo Controlado'
                                                            : 'Técnica'}
                                            </span>
                                        </div>
                                        <div className="flex-between">
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>ESTÍMULO</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700 }}>{selectedSession.tss} TSS Previstos</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-between mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="flex-row gap-sm">
                                    {(selectedDate !== todayStr || manualOverride) && (
                                        <button
                                            onClick={() => setManualOverride(selectedSession)}
                                            className="btn-copilot-outline"
                                            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--cyan)', color: 'var(--cyan)' }}
                                        >
                                            Fijar como hoy
                                        </button>
                                    )}
                                    {manualOverride && (
                                        <button
                                            onClick={() => setManualOverride(null)}
                                            className="btn-copilot-outline"
                                            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', borderColor: 'var(--red)', color: 'var(--red)' }}
                                        >
                                            Reset Plan
                                        </button>
                                    )}

                                    {selectedSession.type === 'Gym' && (
                                        <button
                                            onClick={handleSendToEsqueleto}
                                            disabled={sendingEsqueleto || sentSuccess}
                                            className="btn-copilot-primary"
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                background: sentSuccess ? 'var(--green)' : 'var(--cyan)',
                                                border: 'none',
                                                color: sentSuccess ? '#fff' : '#000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontWeight: 900,
                                                opacity: sendingEsqueleto ? 0.6 : 1,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {sendingEsqueleto ? (
                                                <>
                                                    <RotateCcw size={14} className="animate-spin" />
                                                    ENVIANDO...
                                                </>
                                            ) : sentSuccess ? (
                                                <>
                                                    <Check size={14} />
                                                    LISTO EN ESQUELETO
                                                </>
                                            ) : (
                                                <>
                                                    <Dumbbell size={14} />
                                                    MANDAR A ESQUELETO
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {selectedDate === todayStr && !manualOverride && (
                                    <div className="flex-row gap-xs items-center">
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase' }}>Sesión de Hoy</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>)}
        </div>
    );
};

export default CoachActivityView;

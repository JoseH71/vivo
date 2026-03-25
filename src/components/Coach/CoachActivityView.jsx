import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Dumbbell, Bike, Moon, Zap, RotateCcw, Check, RefreshCcw, Trash2 } from 'lucide-react';
import { getPlannedSession, getColorForType } from '../../services/mesocycleService';
import { getRecentWeights, sendToEsqueleto } from '../../services/esqueletoService';

const TrainIcon = ({ type, size = 16, color = "currentColor" }) => {
    switch (type) {
        case 'Dumbbell': return <Dumbbell size={size} style={{ color, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})` }} />;
        case 'Zap': return <Zap size={size} style={{ color, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})` }} />;
        case 'Bike': return <Bike size={size} style={{ color, filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})` }} />;
        case 'Moon': return <Moon size={size} style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 12px #60a5fa) drop-shadow(0 0 6px #93c5fd)' }} />;
        default: return <Activity size={size} style={{ color }} />;
    }
};

const getBiciTotalTime = (sessionData) => {
    if (sessionData?.durationStr && sessionData.durationStr !== '—') return sessionData.durationStr;
    const desc = sessionData?.desc;
    if (!desc) return null;
    const matches = desc.match(/\b\d+'(?!')/g);
    if (!matches) return null;
    
    // Si contiene "Resto Z", ej. "90' ... Resto Z2", normalmente el primer valor es el total
    if (desc.toLowerCase().includes('resto z') || desc.toLowerCase().includes('resto en z')) {
        const total = parseInt(matches[0]);
        const h = Math.floor(total / 60);
        const m = total % 60;
        return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    }

    // Sumar todos los minutos encontrados
    const totalMinutes = matches.reduce((acc, match) => acc + parseInt(match.replace("'", "")), 0);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const CoachActivityView = ({ intervalsData, weeklyPlan = {}, onSwapSessions = () => {}, onResetWeek = () => {}, onUpdatePlan = () => {}, activeMesocycleData }) => {
    const todayStr = new Date().toLocaleDateString('sv');
    
    // 1. Obtener la semana actual (Lunes a Domingo)
    const weekDays = useMemo(() => {
        const d = new Date(todayStr);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
        const startOfWeek = new Date(d.setDate(diff));
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const cur = new Date(startOfWeek);
            cur.setDate(startOfWeek.getDate() + i);
            days.push(cur.toLocaleDateString('sv'));
        }
        return days;
    }, [todayStr]);

    const getPlannedSessionLocal = (dateStr) => {
        // Usa el weeklyPlan inyectado, que tiene los swaps y el meso activo,
        // o hace fallback a getPlannedSession genérico si no lo encuentra.
        return weeklyPlan[dateStr] || getPlannedSession(dateStr);
    };

    // 2. Estado del Modo Intercambio (Swap)
    const [swapMode, setSwapMode] = useState(false);
    const [swapFirstDate, setSwapFirstDate] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});

    const handleDayClick = (dateStr) => {
        if (!swapMode) return;
        
        if (!swapFirstDate) {
            setSwapFirstDate(dateStr);
        } else {
            if (swapFirstDate !== dateStr) {
                // Ejecutar swap
                onSwapSessions(swapFirstDate, dateStr);
            }
            // Resetear
            setSwapFirstDate(null);
            setSwapMode(false);
        }
    };

    // 3. Lógica para mandar a Esqueleto
    const [sendingEsqueleto, setSendingEsqueleto] = useState(false);
    const [sentDateSuccess, setSentDateSuccess] = useState(null); // String con fecha para saber cuál se envió

    // Parse exercise string for Esqueleto
    const parseExercise = (exStr) => {
        try {
            const nameMatch = exStr.match(/^([^:]+):/);
            const setsRepsMatch = exStr.match(/(\d+)[×x](\d+)/);
            const rirMatch = exStr.match(/\(RIR\s*(\d+)\)/);
            // Capturar peso si existe (ej: "30 kg" o "@ 30kg")
            const loadMatch = exStr.match(/\(([^)]+kg[^)]*)\)/i) || exStr.match(/@\s*([^(\s]+)/);

            return {
                name: nameMatch ? nameMatch[1].trim() : exStr,
                sets: setsRepsMatch ? setsRepsMatch[1] : '3',
                reps: setsRepsMatch ? setsRepsMatch[2] : '10',
                rir: rirMatch ? rirMatch[1] : null,
                load: loadMatch ? loadMatch[1].trim() : null
            };
        } catch {
            return { name: exStr, sets: '3', reps: '10', rir: null, load: null };
        }
    };

    const handleSendToEsqueleto = async (dateStr, sessionData) => {
        if (sessionData.type !== 'Gym') return;
        setSendingEsqueleto(true);
        try {
            const parsedExercises = (sessionData.exercises || []).map(parseExercise);
            const names = parsedExercises.map(ex => ex.name);

            // Fetch recent weights
            const recentData = await getRecentWeights(names);

            const workoutToSend = {
                title: sessionData.title,
                date: dateStr,
                exercises: parsedExercises.map(ex => ({
                    ...ex,
                    load: ex.load || recentData[ex.name]?.load || '0 kg',
                    rir: ex.rir || recentData[ex.name]?.rir || '2'
                }))
            };

            const success = await sendToEsqueleto(workoutToSend);
            if (success) {
                setSentDateSuccess(dateStr);
                setTimeout(() => setSentDateSuccess(null), 3000);
            }
        } catch (error) {
            console.error('Error enviando a Esqueleto:', error);
        } finally {
            setSendingEsqueleto(false);
        }
    };

    return (
        <div className="copilot-container flex-col gap-lg animate-fade-in" style={{ paddingBottom: '2rem' }}>
            
            {/* Cabecera del Dashboard */}
            <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight m-0" style={{ color: 'var(--cyan)' }}>Centro de Mando</h2>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>VISTA SEMANAL DE ENTRENAMIENTOS</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                    {/* Botón Reset (Solo si hay cambios) */}
                    <button
                        onClick={() => { if(window.confirm('¿Quieres resetear todos los cambios de esta semana?')) onResetWeek(); }}
                        style={{
                            padding: '0.8rem 1.2rem', borderRadius: '16px', border: 'none',
                            background: '#ef4444', 
                            color: '#fff',
                            fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <Trash2 size={14} /> RESETEAR PLAN
                    </button>

                    {/* Botón Switch Modo Swap */}
                    <button
                        onClick={() => {
                            setSwapMode(!swapMode);
                            setSwapFirstDate(null);
                        }}
                        style={{
                            padding: '0.8rem 1.2rem', borderRadius: '16px', border: 'none',
                            background: swapMode ? 'var(--purple)' : 'rgba(255,255,255,0.05)',
                            color: swapMode ? '#fff' : 'rgba(255,255,255,0.5)',
                            fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            boxShadow: swapMode ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none'
                        }}
                    >
                        <RefreshCcw size={14} className={swapMode ? "animate-spin-slow" : ""} />
                        {swapMode ? 'ACTIVO' : 'SWAP'}
                    </button>
                </div>
            </div>

            {/* Aviso Flotante Modo Swap */}
            {swapMode && (
                <div className="animate-fade-in" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid var(--purple)', padding: '1rem', borderRadius: '16px', textAlign: 'center', color: '#fff' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                        {!swapFirstDate 
                            ? 'Paso 1: Toca el primer día que quieres cambiar.' 
                            : 'Paso 2: Toca el día de destino para intercambiarlos.'}
                    </p>
                </div>
            )}

            {/* Lista Vertical de la Semana */}
            <div className="flex-col gap-sm">
                {weekDays.map((dateStr, idx) => {
                    const sessionData = getPlannedSessionLocal(dateStr);
                    const d = new Date(dateStr);
                    const dayName = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'][idx];
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;
                    
                    const isSwapHovered = swapMode && swapFirstDate === dateStr;
                    const isGym = sessionData.type === 'Gym';

                    return (
                        <div 
                            key={dateStr}
                            onClick={() => handleDayClick(dateStr)}
                            className={swapMode ? "tap-active" : ""}
                            style={{
                                background: isSwapHovered ? 'rgba(168, 85, 247, 0.2)' : isToday ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isSwapHovered ? 'var(--purple)' : isToday ? 'var(--cyan)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '20px',
                                padding: '1.25rem',
                                transition: 'all 0.2s',
                                cursor: swapMode ? 'pointer' : 'default',
                                position: 'relative',
                                overflow: 'hidden',
                                opacity: (!swapMode && isPast) ? 0.6 : 1,
                                transform: isSwapHovered ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div className="flex-between items-start">
                                {/* Info Izquierda */}
                                <div className="flex-row gap-md">
                                    <div className="flex-col items-center justify-center" style={{ width: '48px', height: '56px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: isToday ? 'var(--cyan)' : 'rgba(255,255,255,0.5)' }}>{dayName.slice(0,3)}</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: isToday ? 'var(--cyan)' : '#fff' }}>{d.getDate()}</span>
                                    </div>
                                    
                                    <div className="flex-col justify-center">
                                            <div className="flex-row gap-xs items-center" style={{ marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <TrainIcon type={sessionData.icon} size={14} color={getColorForType(sessionData.type)} />
                                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: getColorForType(sessionData.type) }}>{sessionData.title}</h3>
                                                
                                                {/* Etiqueta de tiempo total para Bici */}
                                                {sessionData.type === 'Bici' && getBiciTotalTime(sessionData) && (
                                                    <span style={{ 
                                                        marginLeft: '4px', padding: '2px 6px', borderRadius: '4px', 
                                                        background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', 
                                                        fontSize: '0.65rem', fontWeight: 900 
                                                    }}>
                                                        ⏱ {getBiciTotalTime(sessionData)}
                                                    </span>
                                                )}
                                                {/* Etiqueta de tiempo total para Gym */}
                                                {sessionData.type === 'Gym' && getBiciTotalTime(sessionData) && (
                                                    <span style={{ 
                                                        marginLeft: '4px', padding: '2px 6px', borderRadius: '4px', 
                                                        background: 'rgba(6, 182, 212, 0.2)', color: 'var(--cyan)', 
                                                        fontSize: '0.65rem', fontWeight: 900 
                                                    }}>
                                                        ⏱ {getBiciTotalTime(sessionData)}
                                                    </span>
                                                )}
                                                
                                                {/* Botón rápido para cambiar tipo */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const types = ['Gym', 'Bici', 'Descanso'];
                                                        const currentIdx = types.indexOf(sessionData.type);
                                                        const nextType = types[(currentIdx + 1) % types.length];
                                                        const iconMap = { Gym: 'Dumbbell', Bici: 'Zap', Descanso: 'Moon' };
                                                        onUpdatePlan(dateStr, { 
                                                            ...sessionData, 
                                                            type: nextType,
                                                            icon: iconMap[nextType],
                                                            title: nextType.toUpperCase() + (nextType === 'Descanso' ? ' TOTAL' : '')
                                                        });
                                                    }}
                                                    style={{
                                                        marginLeft: '8px', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.3)',
                                                        background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)', fontSize: '0.55rem', fontWeight: 900, cursor: 'pointer'
                                                    }}
                                                >
                                                    CAMBIAR
                                                </button>
                                            </div>
                                        <p 
                                            onClick={(e) => {
                                                if (!isGym) return;
                                                e.stopPropagation();
                                                setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
                                            }}
                                            style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, cursor: isGym ? 'pointer' : 'default' }}
                                        >
                                            {sessionData.desc} 
                                            {isGym && (
                                                <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--cyan)', fontWeight: 800 }}>
                                                    {expandedDays[dateStr] ? '(OCULTAR EJERCICIOS)' : '(VER EJERCICIOS)'}
                                                </span>
                                            )}
                                        </p>

                                        {/* Lista Completa de Ejercicios Desplegable */}
                                        {expandedDays[dateStr] && isGym && sessionData.exercises && (
                                            <div className="animate-fade-in" style={{ 
                                                marginTop: '0.75rem', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '0.4rem', 
                                                borderLeft: '2px solid rgba(6,182,212,0.3)', 
                                                paddingLeft: '0.5rem' 
                                            }}>
                                                {sessionData.exercises.map((ex, i) => (
                                                    <div key={i} style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.85, fontWeight: 500 }}>
                                                        • {ex}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* TSS o Info Extra (Derecha) */}
                                {sessionData.tss > 0 && (
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>CARGA</span>
                                        <div style={{ fontSize: '1rem', color: 'var(--cyan)', fontWeight: 900 }}>{sessionData.tss} <span style={{ fontSize: '0.6rem' }}>TSS</span></div>
                                    </div>
                                )}
                            </div>

                            {/* Puente a Esqueleto (Solo para Gym) - No se muestra si estamos en modo Swap para no interferir con los clics */}
                            {!swapMode && isGym && !isPast && (
                                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    
                                    {/* Mini vista de la rutina */}
                                    {sessionData.exercises && (
                                         <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', opacity: 0.8 }}>
                                            {sessionData.exercises.slice(0, 3).map((ex, i) => {
                                                const weightMatch = ex.match(/\((\d+)\s*kg\)/i) || ex.match(/(\d+)\s*kg/i);
                                                const name = ex.split(':')[0];
                                                const weight = weightMatch ? ` (${weightMatch[1]}kg)` : '';
                                                return (
                                                    <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: weight ? 'var(--cyan)' : '#fff' }}>
                                                        {name}{weight}
                                                    </span>
                                                );
                                            })}
                                            {sessionData.exercises.length > 3 && (
                                                <span style={{ fontSize: '0.65rem', background: 'transparent', color: 'rgba(255,255,255,0.4)', padding: '0.2rem' }}>+{sessionData.exercises.length - 3} más</span>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSendToEsqueleto(dateStr, sessionData); }}
                                        disabled={sendingEsqueleto || sentDateSuccess === dateStr}
                                        style={{
                                            width: '100%', padding: '0.85rem', borderRadius: '12px', border: 'none',
                                            background: sentDateSuccess === dateStr ? 'var(--green)' : 'var(--cyan)',
                                            color: sentDateSuccess === dateStr ? '#fff' : '#000',
                                            fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                                            boxShadow: sentDateSuccess === dateStr ? '0 0 15px rgba(34, 197, 94, 0.4)' : 'none'
                                        }}
                                    >
                                        {sendingEsqueleto ? (
                                            <><RotateCcw size={16} className="animate-spin" /> PROCESANDO PESOS...</>
                                        ) : sentDateSuccess === dateStr ? (
                                            <><Check size={16} /> ¡ENVIADO A ESQUELETO!</>
                                        ) : (
                                            <><Dumbbell size={16} /> ENVIAR RUTINA A ESQUELETO</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default CoachActivityView;

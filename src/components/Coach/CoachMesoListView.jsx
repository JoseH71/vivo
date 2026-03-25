import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Moon, Bike, Dumbbell, Zap, Activity, Clock, Layers, FileText, X } from 'lucide-react';

const RAW_MESO_TEXT = `MESOCICLO
Mesociclo — 16 MAR → 12 ABR 2026
Objetivo del bloque:
FTP ↑
motor aeróbico ↑
estética verano ↑
FTP referencia: 235 W

SEMANA 1 — REACTIVACIÓN
TSS objetivo ≈ 305

LUNES 16 MAR | GYM A (Pierna + Espalda)
Duración: 65 min
 TSS: 55
Prensa Matrix: 4x8 30 kg
Cuádriceps máquina: 3x10 14 kg
Femoral máquina: 3x10 43 kg
Adductor: 2x12 36 kg
Jalón al pecho: 4x8 36 kg
Remo máquina: 3x10 29 kg
Gemelo prensa: 4x12 30 kg
Core: 3x15 5 kg
Objetivo: reactivar fuerza de piernas.

MARTES 17 MAR | DESCANSO TOTAL
Duración: —
 TSS: 0
Movilidad opcional.
Objetivo: estabilidad autonómica.

MIÉRCOLES 18 MAR | BICI SST PROGRESIVO
Duración: 1h25
 TSS: 75
10’ calentar
15’ 210 W
5’ recuperación
15’ 212 W
5’ recuperación
12’ 215 W
15’ Z2 160 W
5’ enfriar
Objetivo: tolerancia al sub-umbral.

JUEVES 19 MAR | GYM B (Torso + Brazos)
Duración: 60 min
 TSS: 45
Press banca: 3x8 30 kg
Press inclinado: 3x10 30 kg
Jalón agarre neutro: 3x10 36 kg
Elevaciones laterales: 4x12 7 kg
Curl bíceps: 3x12 9 kg
Tríceps máquina: 3x12 43 kg
Gemelo sentado: 4x12 30 kg
Core: 3x15
Objetivo: hipertrofia hombros.

VIERNES 20 MAR | BICI Z2 + SPRINTS
Duración: 1h05
 TSS: 40
65’ @ 155 W
Durante sesión: 6x8'' sprints
Objetivo: activación neuromuscular.

SÁBADO 21 MAR | GYM C (Cadena Posterior)
Duración: 60 min
 TSS: 40
Hip thrust máquina: 3x10 10 kg
Femoral máquina: 3x10 43 kg
Abductor: 3x12 36 kg
Adductor: 2x12 36 kg
Remo sentado agarre ancho: 3x12 23 kg
Gemelo máquina: 4x15 30 kg
Core: 3x15
Objetivo: estabilidad posterior.

DOMINGO 22 MAR | BICI Z2 LARGA
Duración: 2h30
 TSS: 95
90’ @ 155 W
Puerto: 20’ 170 W
Resto Z2.
Objetivo: expansión aeróbica.

TOTAL SEMANA: 305 TSS

SEMANA 2 — EXPANSIÓN AERÓBICA
TSS objetivo ≈ 335

LUNES 23 MAR | GYM A
Duración: 65 min
 TSS: 60
Prensa: 5x8 32 kg
Cuádriceps máquina: 3x10 14 kg
Femoral: 3x10 45 kg
Adductor: 2x12 36 kg
Jalón: 4x8 38 kg
Remo máquina: 3x10 30 kg
Gemelo prensa: 4x12 32 kg
Core.
Objetivo: progresión de fuerza.

MARTES 24 MAR | DESCANSO
TSS: 0

MIÉRCOLES 25 MAR | BICI SST LARGO
Duración: 1h30
 TSS: 85
10’ calentamiento
22’ 212 W
6’ recuperación
22’ 218 W
15’ Z2
5’ enfriar
Objetivo: aumentar tiempo cercano al FTP.

JUEVES 26 MAR | GYM B
Duración: 60 min
 TSS: 45
Press banca: 3x8 32 kg
Press inclinado: 3x10 30 kg
Jalón: 3x10 38 kg
Elevaciones laterales: 5x12 7 kg
Curl bíceps: 3x12 9 kg
Tríceps máquina: 3x12 45 kg
Gemelo sentado: 4x12 32 kg
Objetivo: hipertrofia hombro lateral.

VIERNES 27 MAR | BICI Z2 CADENCIA
Duración: 1h15
 TSS: 45
75’ @ 155 W
6x1’ 110 rpm
Objetivo: eficiencia neuromuscular.

SÁBADO 28 MAR | GYM C
Duración: 60 min
 TSS: 40
Hip thrust: 3x10 12 kg
Femoral: 3x10 45 kg
Abductor: 3x12 36 kg
Remo sentado ancho: 3x12 23 kg
Gemelo máquina: 4x15 32 kg
Objetivo: estabilidad posterior.

DOMINGO 29 MAR | BICI Z2 LARGA
Duración: 2h50
 TSS: 110
Z2 155-165 W
Puerto: 25’ 175 W
Objetivo: eficiencia metabólica.

TOTAL SEMANA: 335 TSS

SEMANA 3 — PICO CONTROLADO
TSS objetivo ≈ 365

LUNES 30 MAR | GYM A
Duración: 65 min
 TSS: 60

MARTES 31 MAR | DESCANSO
TSS: 0

MIÉRCOLES 1 ABR | BICI SST 3x18
Duración: 1h35
 TSS: 95
10’ calentar
18’ 215 W
5’ rec
18’ 218 W
5’ rec
18’ 220 W
10’ enfriar
Objetivo: máximo tiempo SST.

JUEVES 2 ABR | GYM B
Duración: 60 min
 TSS: 45

VIERNES 3 ABR | BICI Z2
Duración: 1h15
 TSS: 45
75’ @ 160 W
Objetivo: volumen aeróbico.

SÁBADO 4 ABR | GYM C
Duración: 60 min
 TSS: 40

DOMINGO 5 ABR | BICI Z2 ULTRA LARGA
Duración: 3h10
 TSS: 125
Z2 155-165 W
2 puertos:
20’ 175 W
15’ 170 W
Objetivo: estímulo mitocondrial fuerte.

TOTAL SEMANA: 365 TSS

SEMANA 4 — DESCARGA
TSS objetivo ≈ 220

LUNES 6 ABR | GYM A DESCARGA
Duración: 50 min
 TSS: 35

MARTES 7 ABR | DESCANSO
TSS: 0

MIÉRCOLES 8 ABR | BICI Z2
Duración: 1h
 TSS: 45
60’ @ 150 W

JUEVES 9 ABR | GYM B DESCARGA
Duración: 45 min
 TSS: 30

VIERNES 10 ABR | DESCANSO
TSS: 0

SÁBADO 11 ABR | GYM C DESCARGA
Duración: 45 min
 TSS: 30

DOMINGO 12 ABR | BICI Z2 SUAVE
Duración: 2h
 TSS: 80
Z2 150 W

TOTAL SEMANA: 220 TSS

📊 RESUMEN DEL BLOQUE
Semana | TSS
1 | 305
2 | 335
3 | 365
4 | 220`;

const getSessionTime = (sessionData) => {
    if (sessionData?.durationStr && sessionData.durationStr !== '—') return sessionData.durationStr;
    const desc = sessionData?.desc;
    if (!desc) return null;
    const matches = desc.match(/\b\d+'(?!')/g);
    if (!matches) return null;
    
    if (desc.toLowerCase().includes('resto z') || desc.toLowerCase().includes('resto en z')) {
        const total = parseInt(matches[0]);
        const h = Math.floor(total / 60);
        const m = total % 60;
        return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    }

    const totalMinutes = matches.reduce((acc, match) => acc + parseInt(match.replace("'", "")), 0);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

/**
 * CoachMesoListView — REESCRITURA TOTAL v7.0
 * Vista robusta y premium para visualizar el mesociclo vigente y anteriores.
 */
const CoachMesoListView = ({ activeMesocycleData, allMesocycles = [], onSwapSessions, onUpdatePlan }) => {
    // 1. Estados de Navegación
    const [viewMode, setViewMode] = useState('current'); // 'current' o 'history'
    const [selectedMesoId, setSelectedMesoId] = useState(null);
    const [showRawModal, setShowRawModal] = useState(false);
    
    const todayStr = new Date().toLocaleDateString('sv');

    const safeMesos = Array.isArray(allMesocycles) ? allMesocycles : [];

    // 2. Selección Inteligente del Mesociclo a mostrar
    const currentMeso = useMemo(() => {
        if (viewMode === 'current') {
            if (activeMesocycleData) return activeMesocycleData;
            
            if (safeMesos.length === 0) return null;
            const sorted = [...safeMesos].sort((a, b) => {
                const dateA = new Date(a.endDate || 0);
                const dateB = new Date(b.endDate || 0);
                return dateB - dateA;
            });
            return sorted[0] || null;
        } else {
            return safeMesos.find(m => m.id === selectedMesoId) || safeMesos[0] || null;
        }
    }, [viewMode, selectedMesoId, activeMesocycleData, safeMesos]);

    // 3. Efecto para inicializar el ID seleccionado cuando entra en modo historia
    useEffect(() => {
        if (viewMode === 'history' && !selectedMesoId && safeMesos.length > 0) {
            const sorted = [...safeMesos].sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0));
            const activeIndex = sorted.findIndex(m => m.id === activeMesocycleData?.id);
            const target = activeIndex !== -1 && sorted[activeIndex + 1] ? sorted[activeIndex + 1] : sorted[0];
            setSelectedMesoId(target?.id);
        }
    }, [viewMode, safeMesos, activeMesocycleData, selectedMesoId]);

    // 4. Helper para iconos y colores
    const getSessionInfo = (type) => {
        switch (type) {
            case 'Gym': return { icon: <Dumbbell size={16} />, color: 'var(--cyan)' };
            case 'Bici': return { icon: <Bike size={16} />, color: '#22d3ee' };
            case 'Descanso': return { icon: <Moon size={16} />, color: 'rgba(255,255,255,0.2)' };
            case 'SST': return { icon: <Zap size={16} />, color: 'var(--yellow)' };
            default: return { icon: <Activity size={16} />, color: 'var(--cyan)' };
        }
    };

    // 5. Renderizado de las Semanas
    const renderMesoGrid = (meso) => {
        if (!meso || !meso.startDate) return null;

        const weeks = [];
        const start = new Date(meso.startDate);
        
        for (let w = 0; w < (meso.weeks || 4); w++) {
            const days = [];
            for (let d = 0; d < 7; d++) {
                const dayDate = new Date(start);
                dayDate.setDate(start.getDate() + (w * 7) + d);
                const isoDate = dayDate.toLocaleDateString('sv');
                const session = meso.sessions?.[isoDate] || { type: 'Descanso', title: 'Descanso', desc: 'Recuperación', tss: 0 };
                days.push({ date: isoDate, session, dayNum: dayDate.getDate() });
            }
            weeks.push({
                num: w + 1,
                label: meso.weekLabels?.[w] || `Semana ${w + 1}`,
                days
            });
        }

        return (
            <div className="flex-col gap-xl animate-fade-in" style={{ paddingBottom: '2rem' }}>
                {weeks.map(week => (
                    <div key={week.num} className="stagger">
                        <div className="flex-between mb-4" style={{ padding: '0 0.5rem' }}>
                            <div className="flex-row gap-sm items-center">
                                <div style={{ 
                                    width: '24px', height: '24px', borderRadius: '6px', 
                                    background: 'var(--cyan)', color: '#000', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 900 
                                }}>{week.num}</div>
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#fff', margin: 0 }}>{week.label}</h3>
                            </div>
                            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', margin: '0 1rem' }} />
                        </div>

                        <div className="flex-col gap-sm">
                            {week.days.map((day, idx) => {
                                const info = getSessionInfo(day.session.type);
                                const isToday = day.date === todayStr;
                                const isRest = day.session.type === 'Descanso';

                                return (
                                    <div 
                                        key={day.date}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            background: isToday ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isToday ? 'var(--cyan)' : 'rgba(255,255,255,0.05)'}`,
                                            display: 'flex',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            transition: 'transform 0.2s ease'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                            opacity: isToday ? 1 : 0.4, borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: isToday ? 'var(--cyan)' : '#fff' }}>
                                                {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'][idx]}
                                            </span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: isToday ? 'var(--cyan)' : '#fff' }}>{day.dayNum}</span>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '4px' }}>
                                                <h4 style={{ 
                                                    margin: 0, fontSize: '0.85rem', fontWeight: 800, 
                                                    color: isToday ? 'var(--cyan)' : (isRest ? 'rgba(255,255,255,0.3)' : '#fff'),
                                                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px'
                                                }}>
                                                    {day.session.title}
                                                    {day.session.type === 'Bici' && getSessionTime(day.session) && (
                                                        <span style={{ 
                                                            padding: '2px 6px', borderRadius: '4px', 
                                                            background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', 
                                                            fontSize: '0.65rem', fontWeight: 900 
                                                        }}>
                                                            ⏱ {getSessionTime(day.session)}
                                                        </span>
                                                    )}
                                                    {day.session.type === 'Gym' && getSessionTime(day.session) && (
                                                        <span style={{ 
                                                            padding: '2px 6px', borderRadius: '4px', 
                                                            background: 'rgba(6, 182, 212, 0.2)', color: 'var(--cyan)', 
                                                            fontSize: '0.65rem', fontWeight: 900 
                                                        }}>
                                                            ⏱ {getSessionTime(day.session)}
                                                        </span>
                                                    )}
                                                </h4>
                                                <div style={{ color: info.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {info.icon}
                                                    {day.session.tss > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 900 }}>{day.session.tss} TSS</span>}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{day.session.desc}</p>
                                            
                                            {/* Exercises List for Gym */}
                                            {day.session.type === 'Gym' && day.session.exercises && day.session.exercises.length > 0 && (
                                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    {day.session.exercises.map((ex, i) => (
                                                        <span key={i} style={{ 
                                                            fontSize: '0.65rem', 
                                                            color: isToday ? 'var(--cyan)' : 'rgba(255,255,255,0.5)', 
                                                            background: isToday ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)', 
                                                            padding: '0.2rem 0.5rem', 
                                                            borderRadius: '6px', 
                                                            border: `1px solid ${isToday ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)'}`
                                                        }}>
                                                            {ex}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // 6. Vista cuando no hay mesociclos
    if (allMesocycles.length === 0 && !activeMesocycleData) {
        return (
            <div className="card-glass flex-center" style={{ padding: '4rem 2rem', borderRadius: '32px', textAlign: 'center', flexDirection: 'column', gap: '1.5rem' }}>
                <Calendar size={48} strokeWidth={1} style={{ color: 'var(--cyan)', opacity: 0.2 }} />
                <div>
                    <h3 className="text-lg font-black mb-1">Sin mesociclos</h3>
                    <p className="text-xs text-muted">No hemos encontrado planes de entrenamiento guardados en este PC.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-col gap-lg" style={{ padding: '0 0.25rem' }}>
            {/* Header Switcher */}
            <div className="card-glass" style={{ padding: '0.5rem', borderRadius: '20px', display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => setViewMode('current')}
                    style={{
                        flex: 1, padding: '0.75rem', borderRadius: '14px', border: 'none',
                        background: viewMode === 'current' ? 'var(--cyan)' : 'transparent',
                        color: viewMode === 'current' ? '#000' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <Layers size={16} />
                    MESOCICLO VIGENTE
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    style={{
                        flex: 1, padding: '0.75rem', borderRadius: '14px', border: 'none',
                        background: viewMode === 'history' ? 'var(--purple)' : 'transparent',
                        color: viewMode === 'history' ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <Clock size={16} />
                    VER ANTERIORES
                </button>
            </div>

            {/* Selector de Historia (solo en modo history) */}
            {viewMode === 'history' && allMesocycles.length > 0 && (
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {[...allMesocycles].sort((a,b) => new Date(b.endDate) - new Date(a.endDate)).map(m => {
                        const isActive = selectedMesoId === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMesoId(m.id)}
                                style={{
                                    padding: '0.6rem 1rem', borderRadius: '12px',
                                    background: isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isActive ? 'var(--purple)' : 'rgba(255,255,255,0.05)'}`,
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                    fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer'
                                }}
                            >
                                {m.startDate ? `${new Date(m.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${new Date(m.endDate || m.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : m.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Info del Mesociclo actual en vista */}
            {currentMeso && (
                <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="flex-col gap-xs mb-4">
                        <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: viewMode === 'current' ? 'var(--cyan)' : 'var(--purple)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {viewMode === 'current' ? 'MESOCICLO VIVO' : `${new Date(currentMeso.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${new Date(currentMeso.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                        </h2>
                        {viewMode === 'current' && (
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>
                                {new Date(currentMeso.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {new Date(currentMeso.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        )}
                    </div>

                    {viewMode === 'current' && (
                        <button
                            onClick={() => setShowRawModal(true)}
                            style={{
                                padding: '0.5rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.5)',
                                background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)',
                                fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s ease',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 0 10px rgba(6,182,212,0.2)'
                            }}
                        >
                            <FileText size={14} /> CONSULTA RAW
                        </button>
                    )}
                </div>
            )}

            {/* Grid de Contenido */}
            {renderMesoGrid(currentMeso)}

            {/* Modal de Texto Crudo (Consulta) */}
            {showRawModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4rem', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem'
                }}>
                    <div className="card-glass animate-scale-up" style={{
                        width: '100%', maxWidth: '600px', maxHeight: '85vh',
                        borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(6, 182, 212, 0.15)'
                    }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} /> VISTA DE CONSULTA DEL BLOQUE
                            </h3>
                            <button onClick={() => setShowRawModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', padding: '0.4rem', display: 'flex' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hide-scrollbar" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.85rem', color: '#e5e7eb', lineHeight: 1.6, background: '#090a0f' }}>
                            {RAW_MESO_TEXT.split('\n').map((line, idx) => {
                                if (!line.trim()) return <div key={idx} style={{ height: '0.75rem' }} />;
                                
                                if (line.startsWith('MESOCICLO') || line.startsWith('SEMANA') || line.startsWith('📊')) {
                                    return <h4 key={idx} style={{ color: 'var(--cyan)', marginTop: '1.5rem', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(6,182,212,0.2)', paddingBottom: '0.5rem' }}>{line}</h4>;
                                }
                                if (line.includes('|')) {
                                    const [datePart, titlePart] = line.split('|');
                                    return <div key={idx} style={{ marginTop: '1.2rem', marginBottom: '0.4rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '4px solid var(--cyan)' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--cyan)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>{datePart.trim()}</div>
                                        <div style={{ fontWeight: 900, color: '#fff', fontSize: '1.05rem', marginTop: '2px' }}>{titlePart.trim()}</div>
                                    </div>;
                                }
                                if (line.startsWith('Duración:') || line.startsWith(' Duración:')) {
                                    return <div key={idx} style={{ display: 'inline-block', background: 'rgba(234, 179, 8, 0.1)', color: '#facc15', fontSize: '0.75rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', marginRight: '8px', marginBottom: '8px' }}>⏱ {line.replace('Duración:', '').trim()}</div>;
                                }
                                if (line.includes('TSS:')) {
                                    return <div key={idx} style={{ display: 'inline-block', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--purple)', fontSize: '0.75rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', marginBottom: '8px' }}>⚡ {line.replace('TSS:', 'TSS:').trim()}</div>;
                                }
                                if (line.startsWith('Objetivo:') || line.startsWith(' Objetivo:')) {
                                    return <div key={idx} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>🎯 {line.replace('Objetivo:', '').trim()}</div>;
                                }
                                if (line.startsWith('TOTAL SEMANA')) {
                                    return <div key={idx} style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}>{line}</div>;
                                }
                                return <div key={idx} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', paddingLeft: '1rem', display: 'flex', gap: '6px' }}><span style={{ color: 'var(--cyan)' }}>•</span> <span>{line.trim()}</span></div>;
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Si estamos en modo history y no hay seleccionado uno, mensaje */}
            {viewMode === 'history' && !selectedMesoId && allMesocycles.length > 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                    <p className="text-xs">Selecciona un mesociclo de la lista superior para visualizarlo.</p>
                </div>
            )}
        </div>
    );
};

export default CoachMesoListView;

/**
 * VIVO — Mesocycle Editor v1.0
 * Editor visual de mesociclos con guardado en Firestore.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, Calendar, Bike, Moon, Dumbbell, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import {
    getAllMesocycles, saveMesocycle, deleteMesocycle,
    createBlankMesocycle, migrateLegacyPlan, SESSION_TYPES
} from '../../services/mesocycleFirestoreService';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sáb'];

const MesocycleEditor = () => {
    const [mesocycles, setMesocycles] = useState([]);
    const [activeMeso, setActiveMeso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newStart, setNewStart] = useState('');
    const [newWeeks, setNewWeeks] = useState(4);
    const [expandedWeek, setExpandedWeek] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        // Auto-migrate legacy plan if first time
        await migrateLegacyPlan();
        const all = await getAllMesocycles();
        setMesocycles(all);
        if (all.length > 0 && !activeMeso) {
            setActiveMeso(all[0]);
        }
        setLoading(false);
    }, [activeMeso]); // Added activeMeso to satisfy deps although it might not be strictly needed for this logic

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreateMesocycle = async () => {
        if (!newName || !newStart) return;
        const blank = createBlankMesocycle(newName, newStart, newWeeks);
        await saveMesocycle(blank);
        setShowCreate(false);
        setNewName('');
        setNewStart('');
        await loadData();
        setActiveMeso(blank);
    };

    const handleDeleteMesocycle = async (id) => {
        if (!window.confirm('¿Eliminar este mesociclo?')) return;
        await deleteMesocycle(id);
        if (activeMeso?.id === id) setActiveMeso(null);
        await loadData();
    };

    const handleUpdateSession = (dateStr, field, value) => {
        if (!activeMeso) return;
        const updated = {
            ...activeMeso,
            sessions: {
                ...activeMeso.sessions,
                [dateStr]: {
                    ...activeMeso.sessions[dateStr],
                    [field]: value,
                },
            },
        };
        setActiveMeso(updated);
        setSaved(false);
    };

    const handleSetSessionType = (dateStr, sessionType) => {
        if (!activeMeso) return;
        const current = activeMeso.sessions[dateStr] || {};
        const updated = {
            ...activeMeso,
            sessions: {
                ...activeMeso.sessions,
                [dateStr]: {
                    ...current,
                    type: sessionType.type,
                    icon: sessionType.icon,
                    title: sessionType.type === 'Descanso' ? 'DESCANSO TOTAL' : current.title || '',
                    tss: sessionType.type === 'Descanso' ? 0 : current.tss || 0,
                },
            },
        };
        setActiveMeso(updated);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!activeMeso) return;
        setSaving(true);
        await saveMesocycle(activeMeso);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        await loadData();
    };

    const getWeekDays = (meso, weekIndex) => {
        if (!meso?.sessions) return [];
        const start = new Date(meso.startDate);
        const days = [];
        for (let i = weekIndex * 7; i < (weekIndex + 1) * 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const iso = d.toLocaleDateString('sv');
            const dayOfWeek = d.getDay();
            days.push({
                date: iso,
                dayName: DAY_NAMES[dayOfWeek],
                session: meso.sessions[iso] || { type: 'Descanso', title: 'Sin asignar', desc: '', tss: 0 },
            });
        }
        return days;
    };

    const typeIcon = (type) => {
        switch (type) {
            case 'Bici': return <Bike size={14} />;
            case 'Gym': return <Dumbbell size={14} />;
            default: return <Moon size={14} />;
        }
    };

    const typeColor = (type) => {
        switch (type) {
            case 'Bici': return '#22d3ee';
            case 'Gym': return '#06b6d4';
            default: return '#60a5fa';
        }
    };

    if (loading) {
        return (
            <div className="card flex-center animate-fade-in" style={{ padding: '3rem', borderRadius: '24px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--purple)' }} />
                <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Cargando mesociclos…</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Selector de mesociclo */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {mesocycles.map(m => {
                    const isActive = activeMeso?.id === m.id;
                    const today = new Date().toLocaleDateString('sv');
                    // Mesociclo actual es el que incluye el día de hoy
                    const isCurrent = today >= m.startDate && today <= m.endDate;
                    // Mesociclo pasado es el que ya terminó
                    const isPast = today > m.endDate;

                    // Formatear fechas para el botón: DD-MM
                    const fmtDate = (iso) => {
                        if (!iso) return '';
                        const parts = iso.split('-');
                        return `${parts[2]}-${parts[1]}`;
                    };
                    const dateRange = `${fmtDate(m.startDate)} al ${fmtDate(m.endDate)}`;
                    
                    // Lógica solicitada: si el nombre es "Plan Maestro" o "Semana de Oro", mostrar solo fechas
                    const displayName = (m.name.includes('Plan Maestro') || m.name.includes('Semana de Oro')) 
                        ? dateRange 
                        : m.name;

                    // Colores solicitados: Verde para el mesociclo activo (current), Rojo para el pasado
                    let borderColor = isActive ? 'var(--cyan)' : 'var(--border)';
                    let dotColor = 'transparent';
                    let bgColor = isActive ? 'var(--bg-elevated)' : 'rgba(255,255,255,0.03)';
                    let textColor = isActive ? 'var(--cyan)' : 'var(--text-secondary)';

                    if (isCurrent) {
                        borderColor = 'var(--green)';
                        dotColor = 'var(--green)';
                        if (isActive) textColor = 'var(--green)';
                    } else if (isPast) {
                        borderColor = 'rgba(239, 68, 68, 0.4)';
                        dotColor = 'var(--red)';
                        if (isActive) textColor = 'var(--red)';
                    }

                    return (
                        <button
                            key={m.id}
                            onClick={() => setActiveMeso(m)}
                            className="tap-active"
                            style={{
                                padding: '0.6rem 0.85rem', borderRadius: '14px',
                                background: bgColor,
                                border: `1px solid ${borderColor}`,
                                color: textColor,
                                fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                                whiteSpace: 'nowrap', flexShrink: 0,
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, boxShadow: dotColor !== 'transparent' ? `0 0 6px ${dotColor}` : 'none' }} />
                            {displayName}
                        </button>
                    );
                })}
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="tap-active"
                    style={{
                        padding: '0.6rem 1rem', borderRadius: '14px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: 'var(--green)', fontSize: '0.7rem', fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}
                >
                    <Plus size={14} /> Nuevo
                </button>
            </div>

            {/* Formulario crear nuevo */}
            {showCreate && (
                <div className="card animate-scale-in" style={{ padding: '1rem', borderRadius: '20px' }}>
                    <p className="text-xs uppercase tracking-widest font-black" style={{ marginBottom: '0.75rem', color: 'var(--green)' }}>
                        Nuevo Mesociclo
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <input
                            type="text"
                            placeholder="Nombre (ej: Semana de Oro 2)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            style={{
                                padding: '0.6rem 0.8rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="date"
                                value={newStart}
                                onChange={(e) => setNewStart(e.target.value)}
                                style={{
                                    flex: 1, padding: '0.6rem 0.8rem', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                    color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none',
                                }}
                            />
                            <select
                                value={newWeeks}
                                onChange={(e) => setNewWeeks(Number(e.target.value))}
                                style={{
                                    padding: '0.6rem 0.8rem', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                    color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none',
                                }}
                            >
                                <option value={3}>3 sem</option>
                                <option value={4}>4 sem</option>
                                <option value={5}>5 sem</option>
                                <option value={6}>6 sem</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCreateMesocycle}
                            disabled={!newName || !newStart}
                            style={{
                                padding: '0.7rem', borderRadius: '12px',
                                background: newName && newStart ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                                border: 'none', color: newName && newStart ? '#000' : 'var(--text-muted)',
                                fontWeight: 800, fontSize: '0.75rem', cursor: newName && newStart ? 'pointer' : 'not-allowed',
                            }}
                        >
                            Crear Mesociclo
                        </button>
                    </div>
                </div>
            )}

            {/* Editor del mesociclo activo */}
            {activeMeso && (
                <>
                    {/* Header del meso */}
                    <div className="card" style={{ padding: '1rem', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p className="font-black" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                                    {activeMeso.name}
                                </p>
                                <p className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>
                                    {activeMeso.startDate} → {activeMeso.endDate} · {activeMeso.weeks} semanas
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="tap-active"
                                    style={{
                                        padding: '0.5rem 0.8rem', borderRadius: '10px',
                                        background: saved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                                        border: `1px solid ${saved ? 'var(--green)' : 'var(--cyan)'}`,
                                        color: saved ? 'var(--green)' : 'var(--cyan)',
                                        fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                    }}
                                >
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
                                    {saving ? '…' : saved ? 'OK' : 'Guardar'}
                                </button>
                                {activeMeso.id !== 'legacy_semana_oro' && (
                                    <button
                                        onClick={() => handleDeleteMesocycle(activeMeso.id)}
                                        className="tap-active"
                                        style={{
                                            padding: '0.5rem', borderRadius: '10px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: 'var(--red)', cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Semanas */}
                    {Array.from({ length: activeMeso.weeks }, (_, wk) => {
                        const weekDays = getWeekDays(activeMeso, wk);
                        const weekTSS = weekDays.reduce((s, d) => s + (d.session.tss || 0), 0);
                        const isExpanded = expandedWeek === wk;
                        const weekColor = activeMeso.weekColors?.[wk] || 'var(--text-secondary)';

                        return (
                            <div key={wk} className="card animate-scale-in" style={{ padding: 0, borderRadius: '20px', overflow: 'hidden' }}>
                                {/* Week header */}
                                <button
                                    onClick={() => setExpandedWeek(isExpanded ? null : wk)}
                                    className="tap-active"
                                    style={{
                                        width: '100%', padding: '0.8rem 1rem',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'inherit',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: weekColor }} />
                                        <span className="font-bold text-sm">{activeMeso.weekLabels?.[wk] || `Semana ${wk + 1}`}</span>
                                        <span className="text-xs text-muted font-mono">{weekTSS} TSS</span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                </button>

                                {/* Compact view */}
                                {!isExpanded && (
                                    <div style={{ display: 'flex', gap: '3px', padding: '0 0.75rem 0.75rem' }}>
                                        {weekDays.map(d => (
                                            <div key={d.date} style={{
                                                flex: 1, padding: '0.4rem 0', borderRadius: '8px',
                                                background: typeColor(d.session.type) + '18',
                                                textAlign: 'center',
                                            }}>
                                                <div className="text-xs" style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                                                    {d.dayName}
                                                </div>
                                                <div style={{ color: typeColor(d.session.type) }}>
                                                    {typeIcon(d.session.type)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Expanded edit view */}
                                {isExpanded && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 0.75rem 0.75rem' }}>
                                        {weekDays.map(d => {
                                            const today = new Date().toLocaleDateString('sv');
                                            const isToday = d.date === today;
                                            return (
                                                <div key={d.date} style={{
                                                    padding: '0.75rem', borderRadius: '14px',
                                                    background: isToday ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${isToday ? 'rgba(6, 182, 212, 0.3)' : 'var(--border)'}`,
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                        <span className="text-xs font-bold" style={{ color: isToday ? 'var(--cyan)' : 'var(--text-primary)' }}>
                                                            {d.dayName} {d.date.slice(5)}
                                                            {isToday && <span style={{ marginLeft: '0.3rem', fontSize: '0.55rem', color: 'var(--cyan)' }}>HOY</span>}
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                            {SESSION_TYPES.map(st => (
                                                                <button
                                                                    key={st.type}
                                                                    onClick={() => handleSetSessionType(d.date, st)}
                                                                    className="tap-active"
                                                                    style={{
                                                                        padding: '0.3rem 0.5rem', borderRadius: '8px',
                                                                        background: d.session.type === st.type ? `${st.color}25` : 'transparent',
                                                                        border: `1px solid ${d.session.type === st.type ? st.color : 'transparent'}`,
                                                                        color: d.session.type === st.type ? st.color : 'var(--text-muted)',
                                                                        fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    {st.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={d.session.title || ''}
                                                        onChange={(e) => handleUpdateSession(d.date, 'title', e.target.value)}
                                                        placeholder="Título de la sesión"
                                                        style={{
                                                            width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px',
                                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                                            color: 'var(--text-primary)', fontSize: '0.7rem', outline: 'none',
                                                            marginBottom: '0.3rem',
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        <input
                                                            type="text"
                                                            value={d.session.desc || ''}
                                                            onChange={(e) => handleUpdateSession(d.date, 'desc', e.target.value)}
                                                            placeholder="Descripción"
                                                            style={{
                                                                flex: 1, padding: '0.35rem 0.6rem', borderRadius: '8px',
                                                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                                                color: 'var(--text-secondary)', fontSize: '0.65rem', outline: 'none',
                                                            }}
                                                        />
                                                        <input
                                                            type="number"
                                                            value={d.session.tss || 0}
                                                            onChange={(e) => handleUpdateSession(d.date, 'tss', Number(e.target.value))}
                                                            placeholder="TSS"
                                                            style={{
                                                                width: '60px', padding: '0.35rem 0.5rem', borderRadius: '8px',
                                                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                                                color: 'var(--cyan)', fontSize: '0.65rem', outline: 'none',
                                                                textAlign: 'center', fontWeight: 700,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default MesocycleEditor;

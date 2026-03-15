/**
 * VIVO — Symptom History Timeline v1.0
 * Muestra el historial de check-ins con tendencias de DOMS, motivación y frecuencia de síntomas.
 */
import { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSymptomHistory, getSymptomStats, SYMPTOM_LABELS } from '../services/symptomHistoryService';

const SymptomHistoryView = () => {
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(14);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getSymptomHistory(days);
            setHistory(data);
            setStats(getSymptomStats(data));
            setLoading(false);
        };
        load();
    }, [days]);

    if (loading) {
        return (
            <div className="card flex-center animate-fade-in" style={{ padding: '3rem', borderRadius: '24px' }}>
                <p className="text-xs font-black text-muted uppercase tracking-widest">Cargando historial…</p>
            </div>
        );
    }

    if (!stats || stats.totalDays === 0) {
        return (
            <div className="card flex-center animate-fade-in" style={{ padding: '3rem', borderRadius: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</span>
                <p className="text-xs text-muted">No hay check-ins registrados aún</p>
            </div>
        );
    }

    const domsColors = ['var(--green)', 'var(--yellow)', '#f97316', 'var(--red)'];
    const motColors = { 1: 'var(--red)', 2: '#f97316', 3: 'var(--yellow)', 4: 'var(--green)', 5: 'var(--cyan)' };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={16} style={{ color: 'var(--purple)' }} />
                    <span className="text-xs uppercase tracking-widest font-black" style={{ color: 'var(--text-secondary)' }}>
                        Historial de Check-ins
                    </span>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    style={{
                        fontSize: '0.65rem', padding: '0.4rem 0.8rem',
                        background: 'var(--bg-elevated)', borderRadius: '10px',
                        border: '1px solid var(--border)', color: 'var(--text-primary)',
                        fontWeight: 500, cursor: 'pointer', outline: 'none'
                    }}
                >
                    <option value={7}>7 días</option>
                    <option value={14}>14 días</option>
                    <option value={30}>30 días</option>
                </select>
            </div>

            {/* Resumen rápido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="card-glass" style={{ padding: '0.75rem', borderRadius: '16px', textAlign: 'center' }}>
                    <div className="font-mono font-bold" style={{ fontSize: '1.4rem', color: 'var(--cyan)' }}>
                        {stats.totalDays}
                    </div>
                    <div className="text-xs text-muted" style={{ fontSize: '0.5rem', textTransform: 'uppercase' }}>Días registrados</div>
                </div>
                <div className="card-glass" style={{ padding: '0.75rem', borderRadius: '16px', textAlign: 'center' }}>
                    <div className="font-mono font-bold" style={{ fontSize: '1.4rem', color: 'var(--purple)' }}>
                        {stats.avgMotivation || '—'}
                    </div>
                    <div className="text-xs text-muted" style={{ fontSize: '0.5rem', textTransform: 'uppercase' }}>Motivación Media</div>
                </div>
                <div className="card-glass" style={{ padding: '0.75rem', borderRadius: '16px', textAlign: 'center' }}>
                    <div className="font-mono font-bold" style={{ fontSize: '1.4rem', color: 'var(--green)' }}>
                        {stats.topSymptoms.length}
                    </div>
                    <div className="text-xs text-muted" style={{ fontSize: '0.5rem', textTransform: 'uppercase' }}>Síntomas únicos</div>
                </div>
            </div>

            {/* DOMS Timeline */}
            {stats.domsTrend.length > 0 && (
                <div className="card" style={{ padding: '1rem', borderRadius: '20px' }}>
                    <p className="text-xs uppercase tracking-widest font-black" style={{ marginBottom: '0.75rem', color: '#f97316' }}>
                        🦵 Tendencia DOMS
                    </p>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '50px' }}>
                        {stats.domsTrend.map((d, i) => (
                            <div
                                key={d.date}
                                title={`${d.date}: DOMS ${d.level}`}
                                style={{
                                    flex: 1,
                                    height: `${Math.max(12, (d.level / 3) * 100)}%`,
                                    background: domsColors[d.level],
                                    borderRadius: '4px 4px 0 0',
                                    opacity: 0.8,
                                    transition: 'height 0.3s ease',
                                    minWidth: '4px',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span className="text-xs text-muted" style={{ fontSize: '0.5rem' }}>
                            {stats.domsTrend[0]?.date?.slice(5)}
                        </span>
                        <span className="text-xs text-muted" style={{ fontSize: '0.5rem' }}>
                            {stats.domsTrend[stats.domsTrend.length - 1]?.date?.slice(5)}
                        </span>
                    </div>
                </div>
            )}

            {/* Motivation Timeline */}
            {stats.motivationTrend.length > 0 && (
                <div className="card" style={{ padding: '1rem', borderRadius: '20px' }}>
                    <p className="text-xs uppercase tracking-widest font-black" style={{ marginBottom: '0.75rem', color: 'var(--purple)' }}>
                        🔋 Tendencia Motivación
                    </p>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '50px' }}>
                        {stats.motivationTrend.map((d, i) => (
                            <div
                                key={d.date}
                                title={`${d.date}: Motivación ${d.value}/5`}
                                style={{
                                    flex: 1,
                                    height: `${(d.value / 5) * 100}%`,
                                    background: motColors[d.value] || 'var(--text-muted)',
                                    borderRadius: '4px 4px 0 0',
                                    opacity: 0.8,
                                    transition: 'height 0.3s ease',
                                    minWidth: '4px',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span className="text-xs text-muted" style={{ fontSize: '0.5rem' }}>
                            {stats.motivationTrend[0]?.date?.slice(5)}
                        </span>
                        <span className="text-xs text-muted" style={{ fontSize: '0.5rem' }}>
                            {stats.motivationTrend[stats.motivationTrend.length - 1]?.date?.slice(5)}
                        </span>
                    </div>
                </div>
            )}

            {/* Top Síntomas */}
            {stats.topSymptoms.length > 0 && (
                <div className="card" style={{ padding: '1rem', borderRadius: '20px' }}>
                    <p className="text-xs uppercase tracking-widest font-black" style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                        📊 Síntomas más frecuentes
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stats.topSymptoms.slice(0, 6).map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {SYMPTOM_LABELS[s.id] || s.id}
                                        </span>
                                        <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                                            {s.count}× ({s.pct}%)
                                        </span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${s.pct}%`,
                                            borderRadius: '9999px',
                                            background: s.id === 'bien' || s.id === 'descansado' || s.id === 'motivado'
                                                ? 'var(--green)' : 'var(--red)',
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline diario */}
            <div className="card" style={{ padding: '1rem', borderRadius: '20px' }}>
                <p className="text-xs uppercase tracking-widest font-black" style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    📅 Detalle por día
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {history.map(day => {
                        const domsTag = day.symptoms?.find(s => s?.startsWith?.('doms_'));
                        const domsLvl = domsTag ? parseInt(domsTag.split('_')[1], 10) : 0;
                        const regularSymptoms = (day.symptoms || []).filter(s => s && !s.startsWith('doms_'));

                        return (
                            <div key={day.date} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 0.6rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.02)',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}>
                                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)', minWidth: '3.5rem', fontSize: '0.6rem' }}>
                                    {day.date.slice(5)}
                                </span>
                                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                    {regularSymptoms.map(s => (
                                        <span key={s} style={{
                                            fontSize: '0.55rem', padding: '0.15rem 0.4rem',
                                            borderRadius: '6px',
                                            background: s === 'bien' || s === 'descansado' || s === 'motivado'
                                                ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: s === 'bien' || s === 'descansado' || s === 'motivado'
                                                ? 'var(--green)' : 'var(--red)',
                                            fontWeight: 600,
                                        }}>
                                            {SYMPTOM_LABELS[s]?.split(' ').slice(1).join(' ') || s}
                                        </span>
                                    ))}
                                    {regularSymptoms.length === 0 && (
                                        <span className="text-xs text-muted" style={{ fontSize: '0.55rem', opacity: 0.4 }}>—</span>
                                    )}
                                </div>
                                {domsLvl > 0 && (
                                    <span style={{
                                        fontSize: '0.55rem', fontWeight: 800,
                                        color: domsColors[domsLvl],
                                        minWidth: '2rem', textAlign: 'right',
                                    }}>
                                        D{domsLvl}
                                    </span>
                                )}
                                {day.motivation != null && (
                                    <span style={{
                                        fontSize: '0.55rem', fontWeight: 800,
                                        color: motColors[day.motivation] || 'var(--text-muted)',
                                        minWidth: '1.5rem', textAlign: 'right',
                                    }}>
                                        M{day.motivation}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SymptomHistoryView;

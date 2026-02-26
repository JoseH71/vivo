import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, History, Microscope, Loader2, AlertTriangle, Zap, CalendarDays, Bike, Moon, Dumbbell, Check, X, Search } from 'lucide-react';
import CoachActivityView from './CoachActivityView';
import CoachHistoryView from './CoachHistoryView';
import CoachCorrelationsView from './CoachCorrelationsView';
import CoachLabView from './CoachLabView';
import CoachAnalysisView from './CoachAnalysisView';
import { fetchIntervalsData } from '../../services/intervalsService';

// --- WeeklyIntentions Helper Component ---
const WeeklyIntentions = ({ weeklyPlan, onUpdatePlan, historyData }) => {
    const weekDays = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
        const diff = today.getDate() - (currentDay === 0 ? 6 : currentDay - 1); // get Monday
        const monday = new Date(today.setDate(diff));

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const iso = d.toLocaleDateString('sv');
            const dayName = ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i];

            // Check if day is past, today or future
            const todayStr = new Date().toLocaleDateString('sv');
            const status = iso < todayStr ? 'past' : (iso === todayStr ? 'today' : 'future');

            return { iso, dayName, isToday: iso === todayStr, status };
        });
    }, []);

    const intentions = [
        { id: null, label: 'Vacío', icon: <Activity size={18} style={{ opacity: 0.2 }} /> },
        { id: 'sst', label: 'Bici', icon: <Bike size={18} style={{ color: 'var(--green)', filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))' }} /> },
        { id: 'gym_pierna', label: 'Pierna', icon: <Dumbbell size={18} style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' }} /> },
        { id: 'gym_upper', label: 'Upper', icon: <Dumbbell size={18} style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' }} /> },
        { id: 'gym_estetica', label: 'Estética', icon: <Dumbbell size={18} style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' }} /> },
        { id: 'rest', label: 'Descanso', icon: <Moon size={18} style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.6))' }} /> },
    ];

    const getDayDone = (iso) => {
        if (!historyData) return false;
        const dayData = historyData.find(d => d.id === iso);
        // Consider done if there's load or at least one activity recorded
        return dayData && (dayData.icu_training_load > 0 || (dayData.activities && dayData.activities.length > 0));
    };

    return (
        <div className="card-glass" style={{
            padding: '1rem', borderRadius: '24px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '0.5rem'
        }}>
            <div className="flex-between mb-3" style={{ padding: '0 0.5rem' }}>
                <div className="flex-row gap-xs">
                    <CalendarDays size={16} style={{ color: 'var(--cyan)' }} />
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Plan de Intenciones</span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.15rem' }}>
                {weekDays.map(day => {
                    const planId = (weeklyPlan && weeklyPlan[day.iso]) || null;
                    const intention = intentions.find(it => it.id === planId) || intentions[0];
                    const active = day.isToday;
                    const isDone = getDayDone(day.iso);

                    return (
                        <button
                            key={day.iso}
                            onClick={() => {
                                const currentIdx = intentions.findIndex(it => it.id === planId);
                                const nextIdx = (currentIdx + 1) % intentions.length;
                                onUpdatePlan(day.iso, intentions[nextIdx].id);
                            }}
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                padding: '0.8rem 0.1rem', borderRadius: '16px',
                                background: active ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${active ? 'rgba(6, 182, 212, 0.3)' : (isDone ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)')}`,
                                cursor: 'pointer', transition: 'all 0.2s', outline: 'none', position: 'relative'
                            }}
                        >
                            {/* Status Indicator (Vise Verde o Red) */}
                            {planId && planId !== 'rest' && day.status !== 'future' && (
                                <div style={{
                                    position: 'absolute', top: '-4px', right: '-4px',
                                    background: isDone ? 'var(--green)' : 'var(--red)',
                                    borderRadius: '50%', width: '14px', height: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 10px ${isDone ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                                    zIndex: 2
                                }}>
                                    {isDone ? <Check size={10} color="#fff" strokeWidth={4} /> : <X size={10} color="#fff" strokeWidth={4} />}
                                </div>
                            )}

                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: active ? 'var(--cyan)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                                {day.dayName}
                            </span>
                            <div style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {intention.icon}
                            </div>
                            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff', opacity: planId ? 0.8 : 0.2, textTransform: 'uppercase', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {intention.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const CoachHub = ({ intervalsData, dailyRecommendation, weeklyPlan = {}, onUpdatePlan = () => { } }) => {
    const [subTab, setSubTab] = useState('activity'); // activity, history, correlations
    const [historyData, setHistoryData] = useState(intervalsData || []);
    const [loading, setLoading] = useState(false); // No need for heavy loading if we have initial data
    const [error, setError] = useState(null);

    // Subtle source indicator component
    const SourceIndicator = () => {
        if (!historyData || historyData.length === 0) return null;
        const source = historyData[0]._source;
        return (
            <div className="flex-row gap-xs" style={{ opacity: 0.6 }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: source === 'network' ? 'var(--green)' : 'var(--yellow)', boxShadow: `0 0 6px ${source === 'network' ? 'var(--green)' : 'var(--yellow)'}` }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ fontSize: '0.45rem' }}>{source === 'network' ? 'Live Data' : 'Cached'}</span>
            </div>
        );
    };

    // Fetch historical data (Wellness + Activities)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const days = 180;
                const data = await fetchIntervalsData(days);
                if (data) {
                    setHistoryData(data.sort((a, b) => a.id.localeCompare(b.id)));
                } else {
                    throw new Error('No se pudo obtener datos de Intervals');
                }
            } catch (e) {
                console.error("Coach data fetch error:", e);
                setError("Error al cargar datos de Intervals.icu");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const renderSubView = () => {
        if (loading && subTab !== 'activity') {
            return (
                <div className="card flex-center" style={{ padding: '4rem 0', borderRadius: '24px' }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--purple)', marginBottom: '1rem' }} />
                    <p className="text-xs font-black text-muted uppercase tracking-widest">Sincronizando Coach...</p>
                </div>
            );
        }

        switch (subTab) {
            case 'activity': return <CoachActivityView intervalsData={historyData} dailyRecommendation={dailyRecommendation} />;
            case 'analysis': return <CoachAnalysisView historyData={historyData} />;
            case 'history': return <CoachHistoryView historyData={historyData} />;
            case 'correlations': return <CoachCorrelationsView historyData={historyData} />;
            case 'lab': return <CoachLabView historyData={historyData} />;
            default: return <CoachActivityView />;
        }
    };

    return (
        <div className="animate-fade-in stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>

            {/* Strategic Navigation */}
            <nav className="card-glass" style={{
                padding: '0.4rem', borderRadius: '24px', display: 'flex', gap: '0.4rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                marginTop: '1rem'
            }}>
                {[
                    { id: 'activity', label: 'Dashboard', icon: <Activity size={18} /> },
                    { id: 'analysis', label: 'Análisis', icon: <Search size={18} /> },
                    { id: 'history', label: 'Evolución', icon: <History size={18} /> },
                    { id: 'correlations', label: 'Matriz', icon: <Microscope size={18} /> },
                    { id: 'lab', label: 'Lab', icon: <Microscope size={18} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        style={{
                            flex: 1, padding: '1rem 0.5rem', borderRadius: '18px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            background: subTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                            color: subTab === tab.id ? 'var(--cyan)' : 'var(--text-muted)',
                            border: subTab === tab.id ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                            boxShadow: subTab === tab.id ? '0 10px 20px rgba(0,0,0,0.3)' : 'none',
                            transition: 'all 0.4s cubic-bezier(0.2, 1, 0.3, 1)',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ transform: subTab === tab.id ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.4s' }}>{tab.icon}</div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ fontSize: '0.55rem', opacity: subTab === tab.id ? 1 : 0.6 }}>{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Main Content Area */}
            <div className="stagger" style={{ minHeight: '400px' }}>
                {error && subTab !== 'activity' ? (
                    <div className="card-glass flex-center" style={{
                        padding: '3rem', textAlign: 'center', borderRadius: '32px',
                        border: '1px solid var(--red-glow)', background: 'var(--red-soft)'
                    }}>
                        <AlertTriangle size={32} style={{ color: 'var(--red)', marginBottom: '1rem' }} />
                        <p className="text-sm font-black text-red uppercase tracking-widest">{error}</p>
                    </div>
                ) : null}
                <div className="animate-fade-in">
                    {renderSubView()}
                </div>
            </div>
        </div>
    );
};

export default CoachHub;

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Activity, HeartPulse, Moon, Zap, TrendingUp, Scale, Clock,
    Copy, SlidersHorizontal, Check, Fingerprint, Battery, Loader2
} from 'lucide-react';
import { calculateIEA } from '../engine/ieaEngine';
import { fetchIntervalsData as fetchFromIntervals } from '../services/intervalsService';

const METRICS_CONFIG = {
    iea: { label: 'IEA Score', icon: <Fingerprint size={14} />, color: '#ffffff', unit: 'pts' },
    type: { label: 'Tipo Act.', icon: <MapPin size={14} />, color: 'var(--cyan)', unit: '' },
    hrv: { label: 'VFC (rmssd)', icon: <Activity size={14} />, color: '#06b6d4', unit: 'ms' },
    rhr: { label: 'Frec. Cardíaca', icon: <HeartPulse size={14} />, color: '#f43f5e', unit: 'bpm' },
    sleepScore: { label: 'Punt. Sueño', icon: <Moon size={14} />, color: '#8b5cf6', unit: '%' },
    sleepSecs: { label: 'Horas Sueño', icon: <Clock size={14} />, color: '#3b82f6', unit: 'h' },
    dailyTSS: { label: 'Carga (TSS)', icon: <Zap size={14} />, color: '#eab308', unit: '' },
    ctl: { label: 'Fitness (CTL)', icon: <TrendingUp size={14} />, color: '#22c55e', unit: '' },
    atl: { label: 'Fatiga (ATL)', icon: <Battery size={14} />, color: '#ef4444', unit: '' },
    tsb: { label: 'Forma (TSB)', icon: <Scale size={14} />, color: '#a855f7', unit: '' },
};

import { MapPin } from 'lucide-react';


const MetricsHistory = ({ intervalsData }) => {
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    const [showFilters, setShowFilters] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState([
        'iea', 'type', 'hrv', 'rhr', 'sleepScore', 'dailyTSS'
    ]);
    const [copied, setCopied] = useState(false);
    const [extraData, setExtraData] = useState(null);
    const [extraLoading, setExtraLoading] = useState(false);

    // Check if selected range needs more data than what App provides
    useEffect(() => {
        if (!intervalsData || intervalsData.length === 0) return;

        // Determine the oldest date available in the prop data
        const sortedDates = intervalsData.map(d => d.id || d.date).filter(Boolean).sort();
        const oldestAvailable = sortedDates[0];

        // If user's dateFrom is older than what we have, fetch that range
        if (dateFrom < oldestAvailable) {
            setExtraLoading(true);
            fetchFromIntervals(null, dateFrom, dateTo, true)
                .then(data => {
                    if (data && data.length > 0) {
                        setExtraData(data);
                    }
                })
                .catch(err => console.warn('[MetricsHistory] Extra fetch error:', err))
                .finally(() => setExtraLoading(false));
        } else {
            setExtraData(null); // No need for extra data
        }
    }, [dateFrom, dateTo, intervalsData]);

    // Merge prop data + any extra fetched data
    const mergedData = useMemo(() => {
        if (!extraData) return intervalsData;
        if (!intervalsData) return extraData;

        const map = new Map();
        // Add prop data first
        intervalsData.forEach(d => {
            const id = d.id || d.date;
            if (id) map.set(id, d);
        });
        // Merge extra data (fills gaps)
        extraData.forEach(d => {
            const id = d.id || d.date;
            if (id && !map.has(id)) map.set(id, d);
        });

        return Array.from(map.values()).sort((a, b) => (b.id || b.date || '').localeCompare(a.id || a.date || ''));
    }, [intervalsData, extraData]);

    // Process Data — use mergedData which includes extra fetched data for extended ranges
    const dailyData = useMemo(() => {
        if (!mergedData) return [];
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        // Ensure comparison spans full days in local time
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const data = [];

        // Iterate day by day using local components to avoid UTC shifts
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Find data matching this exact YYYY-MM-DD string
            const dataIndex = mergedData.findIndex(i => (i.id || i.date) === dateStr);
            const dayData = dataIndex !== -1 ? mergedData[dataIndex] : {};

            // Calculate IEA if missing
            let ieaScore = dayData.ieaScore || dayData.iea;
            if ((ieaScore === undefined || ieaScore === null) && dataIndex !== -1) {
                const historicalSlice = mergedData.slice(dataIndex);
                if (historicalSlice.length > 7) {
                    const calculated = calculateIEA(historicalSlice);
                    if (calculated && calculated.score !== null) {
                        ieaScore = calculated.score;
                    }
                }
            }

            const sleepHours = dayData.sleepSecs ? dayData.sleepSecs / 3600 : null;

            // Derive Activity Type
            let activityType = 'Descanso';
            if (dayData.activities && dayData.activities.length > 0) {
                const mainAct = dayData.activities.reduce((prev, current) =>
                    (prev.icu_training_load || 0) > (current.icu_training_load || 0) ? prev : current
                );

                if (mainAct.type === 'WeightTraining') activityType = 'Gym';
                else if (mainAct.type === 'VirtualRide' || mainAct.trainer) activityType = 'Interior';
                else activityType = 'Exterior';
            }

            data.push({
                date: dateStr,
                displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
                dayName: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()],
                type: activityType,
                iea: ieaScore || null,
                hrv: dayData.hrv || null,
                rhr: dayData.restingHR || dayData.rhr || null,
                sleepScore: dayData.sleepScore || null,
                sleepSecs: sleepHours,
                dailyTSS: dayData.dailyTSS || 0,
                ctl: dayData.ctl || null,
                atl: dayData.atl || null,
                tsb: (dayData.ctl !== undefined && dayData.atl !== undefined) ? (dayData.ctl - dayData.atl) : null,
            });
        }
        return data;
    }, [dateFrom, dateTo, mergedData]);

    const averages = useMemo(() => {
        const avgs = {};
        Object.keys(METRICS_CONFIG).forEach(key => {
            if (key === 'type') {
                avgs[key] = null;
                return;
            }
            const values = dailyData.map(d => d[key]);
            const validValues = values.filter(v => typeof v === 'number' && v !== null && !isNaN(v) && v !== 0);
            avgs[key] = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
        });
        return avgs;
    }, [dailyData]);

    const copyAnalysis = () => {
        let text = `📊 HISTORIAL (${dateFrom} a ${dateTo})\n\n`;
        text += `📈 PROMEDIOS:\n`;
        selectedMetrics.forEach(key => {
            const cfg = METRICS_CONFIG[key];
            if (averages[key]) text += `• ${cfg.label}: ${Math.round(averages[key] * 10) / 10} ${cfg.unit}\n`;
        });

        text += `\n📋 DETALLE:\n`;
        const W_FECHA = 12;
        const W_METRIC = 14;

        const pad = (s, w) => String(s).padEnd(w);

        let header = pad('FECHA', W_FECHA);
        selectedMetrics.forEach(k => header += pad(METRICS_CONFIG[k].label.substring(0, 10), W_METRIC));
        text += header + '\n';

        dailyData.slice().reverse().forEach(d => {
            let row = pad(d.date, W_FECHA);
            selectedMetrics.forEach(k => {
                const val = d[k] !== null ? (typeof d[k] === 'number' ? Math.round(d[k] * 10) / 10 : d[k]) : '-';
                row += pad(val, W_METRIC);
            });
            text += row + '\n';
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Loading indicator for extended date ranges */}
            {extraLoading && (
                <div className="card-glass animate-fade-in" style={{
                    padding: '0.75rem 1rem', borderRadius: '16px',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)'
                }}>
                    <Loader2 size={16} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan)' }}>
                        Descargando datos extendidos de Intervals.icu…
                    </span>
                </div>
            )}

            {/* Header / Controls */}
            <div className="card" style={{ padding: '1rem', borderRadius: '32px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Date Inputs Row */}
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <span className="text-xs uppercase opacity-40 font-black mb-1 block" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Desde</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', width: '100%',
                                    outline: 'none', fontWeight: '900', fontFamily: 'var(--font-mono)', colorScheme: 'dark'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <span className="text-xs uppercase opacity-40 font-black mb-1 block" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Hasta</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', width: '100%',
                                    outline: 'none', fontWeight: '900', fontFamily: 'var(--font-mono)', colorScheme: 'dark'
                                }}
                            />
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn"
                            style={{
                                background: showFilters ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                                color: showFilters ? '#000' : '#fff',
                                padding: '0.8rem 1.2rem', borderRadius: '14px', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center'
                            }}
                        >
                            <SlidersHorizontal size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Ajustar Métricas</span>
                        </button>

                        <button
                            onClick={copyAnalysis}
                            className="btn"
                            style={{
                                background: copied ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                                color: copied ? '#fff' : '#fff',
                                padding: '0.8rem 1.2rem', borderRadius: '14px', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center'
                            }}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            <span className="text-xs font-black uppercase tracking-widest">{copied ? 'Copiado' : 'Copiar Reporte'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Filter */}
            {showFilters && (
                <div className="card animate-fade-in" style={{ padding: '1rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Object.entries(METRICS_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedMetrics(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
                                className="btn"
                                style={{
                                    fontSize: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '10px',
                                    background: selectedMetrics.includes(key) ? config.color : 'rgba(255,255,255,0.05)',
                                    color: selectedMetrics.includes(key) ? '#000000' : '#ffffff',
                                    border: selectedMetrics.includes(key) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    fontWeight: '900', textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s',
                                    boxShadow: selectedMetrics.includes(key) ? `0 0 10px 2px ${config.color}40` : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Averages Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                {selectedMetrics.map(key => (
                    <div key={key} style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.75rem',
                        borderRadius: '16px',
                        textAlign: 'center',
                        border: '1px solid var(--border)'
                    }}>
                        <div className="text-xs uppercase opacity-40 font-black mb-1 truncate" style={{ fontSize: '0.5rem' }}>{METRICS_CONFIG[key].label}</div>
                        <div className="font-mono" style={{ fontSize: '1rem', fontWeight: key === 'type' ? 'bold' : 'normal', color: key === 'type' ? 'var(--cyan)' : '#fff' }}>
                            {key === 'type' ? (dailyData.length > 0 ? dailyData[dailyData.length - 1].type : '-') : Math.round(averages[key] * 10) / 10}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 20 }}>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 30, borderRight: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.7 }}>FECHA</span>
                                </th>
                                {selectedMetrics.map(key => (
                                    <th key={key} style={{ padding: '1rem', textAlign: 'center', color: METRICS_CONFIG[key].color, fontWeight: '900', textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                        {METRICS_CONFIG[key].label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dailyData.slice().reverse().map(day => (
                                <tr key={day.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 10, borderRight: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.75rem' }}>{day.displayDate}</div>
                                        <div style={{ fontSize: '0.5rem', opacity: 0.4, textTransform: 'uppercase', fontWeight: 'bold' }}>{day.dayName}</div>
                                    </td>
                                    {selectedMetrics.map(key => (
                                        <td key={key} style={{ padding: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                                            {day[key] !== null ? (
                                                <span style={{
                                                    fontWeight: key === 'type' ? 'bold' : 'normal',
                                                    fontSize: '0.8rem',
                                                    color: key === 'type' ? (
                                                        day[key] === 'Interior' ? 'var(--cyan)' :
                                                            day[key] === 'Exterior' ? 'var(--green)' :
                                                                day[key] === 'Gym' ? 'var(--purple)' :
                                                                    'var(--text-muted)'
                                                    ) : 'inherit'
                                                }}>
                                                    {typeof day[key] === 'number' ? Math.round(day[key] * 10) / 10 : day[key]}
                                                </span>
                                            ) : <span style={{ opacity: 0.2 }}>-</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MetricsHistory;

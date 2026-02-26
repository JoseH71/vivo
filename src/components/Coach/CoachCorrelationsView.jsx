import React, { useState, useMemo } from 'react';
import { Copy, Check, Info } from 'lucide-react';

const CoachCorrelationsView = ({ historyData = [] }) => {
    const [copied, setCopied] = useState(false);
    const [weeks, setWeeks] = useState(12);

    const weeklyData = useMemo(() => {
        if (historyData.length === 0) return [];
        const endDate = new Date();
        const summaries = [];
        for (let i = 0; i < weeks; i++) {
            const weekEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
            const weekData = historyData.filter(d => {
                const date = new Date(d.id);
                return date >= weekStart && date <= weekEnd;
            });
            if (weekData.length === 0) continue;
            const avg = (arr, key) => {
                const valid = arr.filter(d => d[key] != null);
                return valid.length ? valid.reduce((s, d) => s + d[key], 0) / valid.length : null;
            };
            summaries.push({
                label: `${weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
                tss: weekData.reduce((s, d) => s + (d.dailyTSS || 0), 0),
                atl: avg(weekData, 'atl'),
                ctl: avg(weekData, 'ctl'),
                rhr: avg(weekData, 'restingHR'),
                hrv: avg(weekData, 'hrv'),
                sleep: avg(weekData, 'sleepScore')
            });
        }
        return summaries.reverse();
    }, [historyData, weeks]);

    const correlationMatrix = useMemo(() => {
        if (weeklyData.length < 3) return null;
        const metrics = ['tss', 'atl', 'ctl', 'rhr', 'hrv', 'sleep'];
        const labels = ['TSS', 'ATL', 'CTL', 'RHR', 'HRV', 'Sueño'];
        const pearson = (x, y) => {
            const validPairs = x.map((xi, i) => [xi, y[i]]).filter(([a, b]) => a != null && b != null);
            if (validPairs.length < 3) return null;
            const xs = validPairs.map(p => p[0]);
            const ys = validPairs.map(p => p[1]);
            const n = xs.length;
            const sumX = xs.reduce((a, b) => a + b, 0); const sumY = ys.reduce((a, b) => a + b, 0);
            const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
            const sumX2 = xs.reduce((s, x) => s + x * x, 0); const sumY2 = ys.reduce((s, y) => s + y * y, 0);
            const num = n * sumXY - sumX * sumY;
            const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            return den === 0 ? 0 : num / den;
        };
        const matrix = metrics.map(m1 => metrics.map(m2 => pearson(weeklyData.map(w => w[m1]), weeklyData.map(w => w[m2]))));
        return { matrix, labels };
    }, [weeklyData]);

    const baselines = useMemo(() => {
        if (weeklyData.length < 4) return null;
        const avg = (arr, key) => {
            const valid = arr.filter(w => w[key] != null);
            return valid.length ? valid.reduce((s, w) => s + w[key], 0) / valid.length : null;
        };
        const avgATL = avg(weeklyData, 'atl');
        const lowLoadWeeks = weeklyData.filter(w => w.atl != null && w.atl <= avgATL);
        return {
            recovery: { rhr: avg(lowLoadWeeks, 'rhr'), hrv: avg(lowLoadWeeks, 'hrv') },
            chronic: { rhr: avg(weeklyData.slice(-4), 'rhr'), hrv: avg(weeklyData.slice(-4), 'hrv') }
        };
    }, [weeklyData]);

    const getCorrColor = (v) => {
        if (v === null) return 'rgba(255,255,255,0.05)';
        if (v >= 0.6) return 'rgba(34, 197, 94, 0.4)';
        if (v >= 0.2) return 'rgba(34, 197, 94, 0.15)';
        if (v <= -0.6) return 'rgba(244, 63, 94, 0.4)';
        if (v <= -0.2) return 'rgba(244, 63, 94, 0.15)';
        return 'rgba(255,255,255,0.08)';
    };

    if (weeklyData.length < 3) return (
        <div className="card flex-center" style={{ padding: '4rem 0', borderRadius: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</span>
            <p className="font-normal text-muted uppercase tracking-widest text-xs">Datos insuficientes (min 3 semanas)</p>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                    Análisis de Correlación
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        value={weeks}
                        onChange={(e) => setWeeks(Number(e.target.value))}
                        className="btn"
                        style={{
                            fontSize: '0.65rem', padding: '0.4rem 0.8rem',
                            background: 'var(--bg-elevated)', borderRadius: '10px',
                            border: '1px solid var(--border)', color: 'var(--text-primary)',
                            fontWeight: 500, cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <option value={8} style={{ background: 'var(--bg-card)', color: '#fff' }}>8 Sem</option>
                        <option value={12} style={{ background: 'var(--bg-card)', color: '#fff' }}>12 Sem</option>
                        <option value={16} style={{ background: 'var(--bg-card)', color: '#fff' }}>16 Sem</option>
                    </select>
                </div>
            </div>

            {/* Baselines */}
            {baselines && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="card-glass" style={{
                        padding: '1.25rem', borderRadius: '24px',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), transparent)',
                        border: '1px solid var(--green-soft)'
                    }}>
                        <div className="flex-between mb-2">
                            <p style={{ fontSize: '0.55rem', fontWeight: 500, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recuperación</p>
                            <span style={{ fontSize: '0.8rem' }}>🛌</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{baselines.recovery.rhr?.toFixed(0)}</p>
                                <p style={{ fontSize: '0.5rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RHR</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--green)' }}>{baselines.recovery.hrv?.toFixed(0)}</p>
                                <p style={{ fontSize: '0.5rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HRV</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-glass" style={{
                        padding: '1.25rem', borderRadius: '24px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)',
                        border: '1px solid var(--purple-glow)'
                    }}>
                        <div className="flex-between mb-2">
                            <p style={{ fontSize: '0.55rem', fontWeight: 500, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Crónica 28d</p>
                            <span style={{ fontSize: '0.8rem' }}>🗓️</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{baselines.chronic.rhr?.toFixed(0)}</p>
                                <p style={{ fontSize: '0.5rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RHR</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--purple)' }}>{baselines.chronic.hrv?.toFixed(0)}</p>
                                <p style={{ fontSize: '0.5rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HRV</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Matrix */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: '24px', overflowX: 'auto' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', textAlign: 'center', marginBottom: '1rem', opacity: 0.5 }}>Matriz Pearson</p>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
                    <thead>
                        <tr>
                            <th></th>
                            {correlationMatrix?.labels.map(l => <th key={l} style={{ fontSize: '0.5rem', fontWeight: 500, opacity: 0.5 }}>{l}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {correlationMatrix?.labels.map((label, i) => (
                            <tr key={label}>
                                <td style={{ fontSize: '0.5rem', fontWeight: 500, opacity: 0.5 }}>{label}</td>
                                {correlationMatrix.matrix[i].map((val, j) => (
                                    <td key={j} style={{
                                        padding: '0.5rem', textAlign: 'center', borderRadius: '6px',
                                        fontSize: '0.65rem', fontWeight: 500,
                                        background: getCorrColor(val),
                                        color: val === null ? 'transparent' : '#fff'
                                    }}>
                                        {val != null ? val.toFixed(2) : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', opacity: 0.5 }}>Datos Crudos para Exportar</p>
                        <button onClick={() => {
                            let text = 'Métrica\t' + correlationMatrix.labels.join('\t') + '\n';
                            correlationMatrix.labels.forEach((label, i) => {
                                text += label + '\t' + correlationMatrix.matrix[i].map(v => v != null ? v.toFixed(2).replace('.', ',') : '').join('\t') + '\n';
                            });
                            navigator.clipboard.writeText(text).then(() => {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            });
                        }} className="btn" style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: copied ? 'var(--green)' : 'rgba(255,255,255,0.05)', color: copied ? '#000' : '#fff', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 500 }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copiado' : 'Copiar Matriz'}
                        </button>
                    </div>
                    <textarea
                        readOnly
                        value={(() => {
                            if (!correlationMatrix) return '';
                            let text = 'Métrica\t' + correlationMatrix.labels.join('\t') + '\n';
                            correlationMatrix.labels.forEach((label, i) => {
                                text += label + '\t' + correlationMatrix.matrix[i].map(v => v != null ? v.toFixed(2).replace('.', ',') : '').join('\t') + '\n';
                            });
                            return text;
                        })()}
                        style={{ width: '100%', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', outline: 'none', color: 'var(--text-secondary)', resize: 'none' }}
                        rows={7}
                        onClick={(e) => e.target.select()}
                    />
                </div>
            </div>

            {/* Weekly Summary */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>Resumen Semanal</p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem', textAlign: 'left', opacity: 0.5 }}>SEM</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', opacity: 0.5 }}>TSS</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', opacity: 0.5 }}>CTL</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', opacity: 0.5 }}>RHR</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', opacity: 0.5 }}>HRV</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyData.slice().reverse().map((w, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{w.label}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 500 }}>{Math.round(w.tss)}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 500 }}>{w.ctl?.toFixed(0)}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 500, color: 'var(--red)' }}>{w.rhr?.toFixed(0)}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 500, color: 'var(--green)' }}>{w.hrv?.toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CoachCorrelationsView;






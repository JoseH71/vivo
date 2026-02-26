import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Copy, Check, Calendar, HeartPulse, Activity, Zap, Moon, TrendingUp } from 'lucide-react';

const CoachHistoryView = ({ historyData = [] }) => {
    const [dateRange, setDateRange] = useState(14);
    const [copied, setCopied] = useState(false);

    const filteredData = [...historyData].slice(-dateRange).reverse();
    const chartData = [...historyData].slice(-dateRange);

    const getAvg = (key) => {
        const valid = filteredData.filter(d => d[key] != null);
        return valid.length ? (valid.reduce((s, d) => s + d[key], 0) / valid.length).toFixed(0) : '-';
    };

    const getAvgTSB = () => {
        const valid = filteredData.filter(d => d.ctl != null && d.atl != null);
        return valid.length ? (valid.reduce((s, d) => s + (d.ctl - d.atl), 0) / valid.length).toFixed(1) : '-';
    };

    const copyMetrics = () => {
        if (filteredData.length === 0) return;
        let text = `📊 HISTORIAL VIVO (${dateRange} días)\n\n`;
        text += `Fecha\t\tRHR\tHRV\tSueño\tTSS\tTSB\n`;
        filteredData.forEach(d => {
            const date = new Date(d.id).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            const tsb = ((d.ctl || 0) - (d.atl || 0)).toFixed(0);
            text += `${date}\t\t${d.restingHR || '-'}\t${d.hrv || '-'}\t${d.sleepScore || '-'}\t${d.dailyTSS || 0}\t${tsb}\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                    Tendencias Biométricas
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={copyMetrics} className="btn" style={{ padding: '0.4rem', background: copied ? 'var(--green)' : 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[7, 14, 30].map(r => (
                            <button
                                key={r}
                                onClick={() => setDateRange(r)}
                                className="btn"
                                style={{
                                    fontSize: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '8px',
                                    background: dateRange === r ? 'var(--purple)' : 'rgba(255,255,255,0.03)',
                                    color: dateRange === r ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: 900, border: 'none'
                                }}
                            >
                                {r}D
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                {[
                    { label: 'RHR', val: getAvg('restingHR'), color: 'var(--red)', icon: <HeartPulse size={10} /> },
                    { label: 'HRV', val: getAvg('hrv'), color: 'var(--green)', icon: <Activity size={10} /> },
                    { label: 'Sueño', val: getAvg('sleepScore'), color: 'var(--blue)', icon: <Moon size={10} /> },
                    { label: 'TSS/D', val: getAvg('dailyTSS'), color: 'var(--purple)', icon: <Zap size={10} /> },
                    { label: 'TSB', val: getAvgTSB(), color: parseFloat(getAvgTSB()) >= 0 ? 'var(--green)' : 'var(--red)', icon: <TrendingUp size={10} /> },
                ].map((card, i) => (
                    <div key={i} className="card" style={{ padding: '0.6rem', borderRadius: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{card.label}</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 900, color: card.color }}>{card.val}</p>
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '28px', height: '280px', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRhr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="id"
                            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }}
                            tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                            itemStyle={{ fontWeight: 800, padding: '2px 0' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="hrv" stroke="var(--green)" strokeWidth={3} fillOpacity={1} fill="url(#colorHrv)" animationDuration={1500} />
                        <Area type="monotone" dataKey="restingHR" stroke="var(--red)" strokeWidth={2} fillOpacity={1} fill="url(#colorRhr)" animationDuration={1500} />
                        <Area type="monotone" dataKey="sleepScore" stroke="var(--purple)" strokeWidth={2} fillOpacity={1} fill="url(#colorSleep)" animationDuration={1500} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 900, opacity: 0.5 }}>FECHA</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 900, opacity: 0.5 }}>RHR</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 900, opacity: 0.5 }}>HRV</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 900, opacity: 0.5 }}>SUEÑO</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 900, opacity: 0.5 }}>TSS</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 900, opacity: 0.5 }}>TSB</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 900 }}>
                                        {new Date(d.id).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: 'var(--red)' }}>{d.restingHR || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: 'var(--green)' }}>{d.hrv || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: 'var(--purple)' }}>{d.sleepScore || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800 }}>{d.dailyTSS || 0}</td>
                                    <td style={{
                                        padding: '0.75rem', textAlign: 'center', fontWeight: 900,
                                        color: (d.ctl - d.atl) >= 0 ? 'var(--green)' : 'var(--red)'
                                    }}>
                                        {((d.ctl || 0) - (d.atl || 0)).toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CoachHistoryView;

/**
 * VIVO — Trend Charts Component
 * HRV trend line overlaid on TSS bars with normality bands
 */
import { useMemo } from 'react';
import {
    ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import { calculateBands } from '../engine/ieaEngine';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(22, 22, 31, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '0.6rem 0.8rem',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6
        }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color, fontWeight: 600 }}>
                    {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.name === 'HRV' ? 0 : 0) : '—'}
                </div>
            ))}
        </div>
    );
};

const TrendCharts = ({ intervalsData }) => {
    const chartData = useMemo(() => {
        if (!intervalsData?.length) return [];
        return intervalsData
            .slice(0, 30)
            .reverse()
            .map(d => ({
                date: d.id?.slice(5) || '',
                hrv: d.hrv || null,
                rhr: d.restingHR || null,
                tss: d.dailyTSS || 0,
                sleep: d.sleepScore || null,
            }));
    }, [intervalsData]);

    const bands = useMemo(() => {
        if (!intervalsData?.length) return {};
        return calculateBands(intervalsData.slice(1, 61));
    }, [intervalsData]);

    if (!chartData.length) return null;

    return (
        <div className="animate-fade-in">
            <div className="text-xs uppercase tracking-widest text-muted font-bold" style={{ marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
                Tendencia 30 días
            </div>

            {/* HRV + TSS Chart */}
            <div className="card" style={{ padding: '0.75rem 0.5rem 0.5rem' }}>
                <div className="flex-between" style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>● HRV</span>
                        <span className="text-xs font-bold" style={{ color: 'rgba(139, 92, 246, 0.4)' }}>▮ TSS</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        {/* HRV band zone */}
                        {bands.hrvLower && bands.hrvUpper && (
                            <ReferenceArea
                                y1={bands.hrvLower}
                                y2={bands.hrvUpper}
                                fill="rgba(6, 182, 212, 0.06)"
                                strokeOpacity={0}
                            />
                        )}
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#55556a' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis yAxisId="hrv" tick={{ fontSize: 9, fill: '#55556a' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <YAxis yAxisId="tss" orientation="right" tick={{ fontSize: 9, fill: '#55556a' }} tickLine={false} axisLine={false} domain={[0, 'auto']} hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="tss" dataKey="tss" name="TSS" fill="rgba(139, 92, 246, 0.2)" radius={[4, 4, 0, 0]} barSize={8} />
                        <Area
                            yAxisId="hrv"
                            type="monotone"
                            dataKey="hrv"
                            name="HRV"
                            stroke="var(--cyan)"
                            strokeWidth={2}
                            fill="rgba(6, 182, 212, 0.08)"
                            dot={{ r: 2, fill: 'var(--cyan)', strokeWidth: 0 }}
                            activeDot={{ r: 4, fill: 'var(--cyan)' }}
                            connectNulls
                        />
                        {bands.hrvMean && (
                            <ReferenceLine yAxisId="hrv" y={bands.hrvMean} stroke="rgba(6, 182, 212, 0.3)" strokeDasharray="4 4" />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* RHR Chart */}
            <div className="card" style={{ padding: '0.75rem 0.5rem 0.5rem', marginTop: '0.75rem' }}>
                <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--red)' }}>● RHR</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        {bands.rhrLower && bands.rhrUpper && (
                            <ReferenceArea
                                y1={bands.rhrLower}
                                y2={bands.rhrUpper}
                                fill="rgba(239, 68, 68, 0.04)"
                                strokeOpacity={0}
                            />
                        )}
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#55556a' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: '#55556a' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="rhr"
                            name="RHR"
                            stroke="var(--red)"
                            strokeWidth={2}
                            dot={{ r: 2, fill: 'var(--red)', strokeWidth: 0 }}
                            activeDot={{ r: 4, fill: 'var(--red)' }}
                            connectNulls
                        />
                        {bands.rhrMean && (
                            <ReferenceLine y={bands.rhrMean} stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="4 4" />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendCharts;

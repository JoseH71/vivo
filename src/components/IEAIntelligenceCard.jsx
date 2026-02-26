/**
 * VIVO — IEA Intelligence Card v4.0
 * Formato visual idéntico al DiaryView de NutriMinerals (Macros + Minerales)
 */
import { useState } from 'react';
import { Activity, Lock } from 'lucide-react';

// Leyendas expandibles
const legends = {
    hrv: {
        title: 'VFC — Variabilidad Cardíaca',
        source: 'Z-Score vs media 60 días',
        scale: [
            { pts: 100, label: 'Excelente', desc: 'Muy por encima de tu media (Z ≥ +0.5)' },
            { pts: 95, label: 'Buena', desc: 'En tu media o ligeramente arriba (Z ≥ 0)' },
            { pts: 85, label: 'Normal', desc: 'Ligeramente por debajo (Z ≥ -0.5)' },
            { pts: 70, label: 'Baja', desc: 'Descenso notable (Z ≥ -1)' },
            { pts: 50, label: 'Alerta', desc: 'Muy por debajo de baseline (Z < -1)' },
        ],
    },
    rhr: {
        title: 'FC — Frecuencia Cardíaca en Reposo',
        source: 'Z-Score inverso vs media 60 días',
        scale: [
            { pts: 100, label: 'Óptimo', desc: 'Pulso muy bajo vs baseline (Z ≤ -0.5)' },
            { pts: 95, label: 'Bueno', desc: 'Pulso en media o ligeramente bajo (Z ≤ 0)' },
            { pts: 85, label: 'Normal', desc: 'Ligeramente elevado (Z ≤ +0.5)' },
            { pts: 70, label: 'Elevado', desc: 'Pulso elevado (Z ≤ +1)' },
            { pts: 50, label: 'Alto', desc: 'Pulso muy elevado vs baseline (Z > +1)' },
        ],
    },
    sleep: {
        title: 'Sueño — Calidad de Descanso',
        source: 'Nota de anoche vs media 28 días',
        scale: [
            { pts: 100, label: 'Excelente', desc: 'Igual o mejor que tu media mensual' },
            { pts: '~85', label: 'Proporcional', desc: 'Baja proporcionalmente si duermes peor' },
        ],
    },
    load: {
        title: 'Carga — Training Stress Balance',
        source: 'CTL (forma) − ATL (fatiga)',
        scale: [
            { pts: 100, label: 'Fresco', desc: 'TSB positivo o neutro (≥ 0)' },
            { pts: 85, label: 'Cargado', desc: 'TSB moderado (0 a -10)' },
            { pts: 65, label: 'Fatigado', desc: 'TSB alto (-10 a -20)' },
            { pts: 40, label: 'Sobrecarga', desc: 'TSB crítico (< -20)' },
        ],
    },
    stability: {
        title: 'cv-VFC — Coeficiente de Variación',
        source: 'Desviación estándar / Media (7 días)',
        scale: [
            { pts: 'STABLE', label: '< 12%', desc: 'Sistema estable. Sin riesgo eléctrico.' },
            { pts: 'VIGILANCE', label: '12-20%', desc: 'Vigilancia. Inicio de inestabilidad.' },
            { pts: 'UNSTABLE', label: '> 20%', desc: 'Desregulación Autonómica Severa (Caos).' },
            { pts: 'SATURATED', label: '< 3%', desc: 'ZONA FANTASMA: Saturación (Estancado).' },
        ],
    },
    penalty: {
        title: 'Penalización por Inestabilidad',
        source: 'Deducción directa al Score Final',
        scale: [
            { pts: '0', label: 'Estable', desc: 'Sin reducción de puntos.' },
            { pts: '-2 a -10', label: 'Moderada', desc: 'Reducción por zona Vigilancia.' },
            { pts: '-12', label: 'Máxima', desc: 'Reducción por desregulación severa.' },
            { pts: '-10', label: 'Saturación', desc: 'Penalización por falta de adaptabilidad.' },
        ],
    },
};

const IEAIntelligenceCard = ({ iea }) => {
    const [expandedMetric, setExpandedMetric] = useState(null);

    if (!iea?.details) return null;

    const cvValue = iea.details.stability?.cv || '—';
    const cvZone = iea.details.stability?.zone || 'stable';

    let cvLabel = 'ESTABLE';
    let cvColor = 'var(--green)';

    if (cvZone === 'unstable') {
        cvLabel = '⚠ CAOS';
        cvColor = 'var(--red)';
    } else if (cvZone === 'vigilance') {
        cvLabel = 'VIGILANCIA';
        cvColor = 'var(--yellow)';
    } else if (cvZone === 'saturated') {
        cvLabel = '☠ SATURADO';
        cvColor = 'var(--purple)';
    }

    const metrics = [
        { key: 'hrv', label: 'VFC', points: iea.details.hrv?.points, weight: iea.details.hrv?.weight, target: 100 },
        { key: 'rhr', label: 'FCR', points: iea.details.rhr?.points, weight: iea.details.rhr?.weight, target: 100 },
        { key: 'sleep', label: 'Sueño', points: iea.details.sleep?.points, weight: iea.details.sleep?.weight, target: 100 },
        { key: 'load', label: 'Carga', points: iea.details.load?.points, weight: iea.details.load?.weight, target: 100 },
    ];

    const renderLegend = (key, currentVal) => {
        const legend = legends[key];
        if (!legend) return null;
        return (
            <div style={{
                marginTop: '0.4rem',
                padding: '0.65rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '0.75rem',
                animation: 'fadeIn 0.2s ease',
            }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginBottom: '0.2rem' }}>{legend.title}</p>
                <p style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.5, marginBottom: '0.6rem' }}>Fuente: {legend.source}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {legend.scale.map(level => {
                        const isActive = String(currentVal).toUpperCase() === String(level.pts).toUpperCase();
                        return (
                            <div key={level.pts} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '8px',
                                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 400, fontFamily: 'monospace',
                                    color: '#fff', minWidth: '3.5rem',
                                }}>{level.pts}</span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 400,
                                    color: '#fff',
                                }}>{level.label} — {level.desc}</span>
                                {isActive && <span style={{ fontSize: '0.6rem', color: '#22c55e', marginLeft: 'auto', fontWeight: 900 }}>● ACTIVO</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* ── MÉTRICAS IEA (formato Macros NutriMinerals) ── */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        Inteligencia IEA v4.0
                    </p>
                    <p style={{ fontSize: '0.55rem', fontWeight: 900, color: '#fff', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        60d · Suelos
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {metrics.map(m => {
                        const pts = typeof m.points === 'number' ? m.points : 0;
                        const pct = Math.min(Math.round((pts / m.target) * 100), 100);
                        const diff = pts - m.target;
                        const isOver = diff >= 0;
                        const diffPct = Math.round(Math.abs(diff / m.target) * 100);
                        const barColor = pts >= 85 ? '#3d7a5a' : pts >= 70 ? '#8a7a3d' : '#b35a66';
                        const isExpanded = expandedMetric === m.key;

                        return (
                            <div key={m.key}>
                                <button
                                    onClick={() => setExpandedMetric(isExpanded ? null : m.key)}
                                    style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{m.label}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: isOver ? '#22c55e' : '#ef4444' }}>
                                                {isOver ? `+${diffPct}%` : `-${diffPct}%`}
                                            </span>
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {pts}pts <span style={{ opacity: 0.3 }}>/</span> {m.target}pts
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginLeft: '0.3rem' }}>({m.weight}%)</span>
                                        </span>
                                    </div>

                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            borderRadius: '9999px',
                                            width: `${pct}%`,
                                            backgroundColor: barColor,
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                </button>

                                {isExpanded && renderLegend(m.key, pts)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── ESTABILIDAD (formato Minerales NutriMinerals) ── */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                    Estabilidad Eléctrica
                </p>

                {/* cv-HRV */}
                <div key="stability-row">
                    <button
                        onClick={() => setExpandedMetric(expandedMetric === 'stability' ? null : 'stability')}
                        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>cv-VFC</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: cvColor, textTransform: 'uppercase' }}>{cvLabel}</span>
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                                {cvValue}<span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>%</span>
                            </span>
                        </div>
                    </button>
                    {expandedMetric === 'stability' && renderLegend('stability', cvZone)}
                </div>

                {/* Penalty */}
                <div key="penalty-row">
                    <button
                        onClick={() => setExpandedMetric(expandedMetric === 'penalty' ? null : 'penalty')}
                        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Penalización</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: (iea.details.stability?.penalty ?? 0) < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                {iea.details.stability?.penalty ?? 0}pts
                            </span>
                        </div>
                    </button>
                    {expandedMetric === 'penalty' && renderLegend('penalty', (iea.details.stability?.penalty || 0) === 0 ? '0' : (iea.details.stability?.penalty === -10 ? '-10' : '-2 a -8'))}
                </div>

                {/* Desacople */}
                {iea.details.safety?.autonomicConflict && (
                    <div style={{
                        marginTop: '0.5rem', padding: '0.5rem 0.65rem',
                        background: 'rgba(234, 179, 8, 0.08)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        borderRadius: '0.75rem',
                        display: 'flex', gap: '0.5rem', alignItems: 'center',
                    }}>
                        <Activity size={14} style={{ color: 'var(--yellow)' }} />
                        <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--yellow)', textTransform: 'uppercase' }}>
                                Desacople Autonómico {iea.details.safety.decoupleType1 ? '(Tipo 1: VFC↓ FC↑)' : '(Tipo 2: Saturación)'}
                            </p>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                {iea.details.safety.decoupleType1
                                    ? 'VFC baja + FC elevada. Posible estrés simpático.'
                                    : 'VFC y FC extremadamente bajas. Saturación parasimpática.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Cap activo */}
                {iea.details.safety?.capActive && (
                    <div style={{
                        marginTop: '0.5rem', padding: '0.5rem 0.65rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '0.75rem',
                        display: 'flex', gap: '0.5rem', alignItems: 'center',
                    }}>
                        <Lock size={14} style={{ color: iea.details.safety.capValue === 55 ? 'var(--red)' : 'var(--yellow)' }} />
                        <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: iea.details.safety.capValue === 55 ? 'var(--red)' : 'var(--yellow)', textTransform: 'uppercase' }}>
                                Cap {iea.details.safety.capValue} Activo
                            </p>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                {iea.details.safety.capReason}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IEAIntelligenceCard;

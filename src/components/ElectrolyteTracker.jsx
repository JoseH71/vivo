/**
 * VIVO — Electrolyte Tracker Component
 * Quick-action registration for key supplements
 */
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const ELECTROLYTES = [
    { id: 'mg', label: 'Magnesio', emoji: '💊', unit: 'mg', step: 100, color: 'var(--purple)', target: 600 },
    { id: 'na', label: 'Sodio', emoji: '🧂', unit: 'mg', step: 250, color: 'var(--blue)', target: 2000 },
    { id: 'k', label: 'Potasio', emoji: '🍌', unit: 'mg', step: 200, color: 'var(--green)', target: 3500 },
    { id: 'taurina', label: 'Taurina', emoji: '⚡', unit: 'mg', step: 500, color: 'var(--cyan)', target: 2000 },
];

const ElectrolyteTracker = ({ electrolytes, onElectrolytesChange }) => {
    const [expanded, setExpanded] = useState(false);

    const updateValue = (id, delta) => {
        const current = electrolytes[id] || 0;
        const next = Math.max(0, current + delta);
        onElectrolytesChange({ ...electrolytes, [id]: next });
    };

    // Quick summary
    const filledCount = ELECTROLYTES.filter(e => (electrolytes[e.id] || 0) > 0).length;

    return (
        <div className="card animate-fade-in">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex-between"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💧</span>
                    <div>
                        <div className="text-xs uppercase tracking-widest text-muted font-bold">Electrolitos</div>
                        <div className="text-sm font-medium" style={{ marginTop: '0.15rem' }}>
                            {filledCount === 0 ? 'Registra tu suplementación' : `${filledCount}/4 registrados`}
                        </div>
                    </div>
                </div>
                <span className="text-muted" style={{ fontSize: '1rem', transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▾
                </span>
            </button>

            {expanded && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="animate-fade-in stagger">
                    {ELECTROLYTES.map(e => {
                        const val = electrolytes[e.id] || 0;
                        const pct = Math.min(100, (val / e.target) * 100);

                        return (
                            <div key={e.id} style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border)'
                            }}>
                                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span>{e.emoji}</span>
                                        <span className="text-sm font-bold">{e.label}</span>
                                    </div>
                                    <span className="font-mono font-bold text-sm" style={{ color: e.color }}>
                                        {val}{e.unit}
                                    </span>
                                </div>

                                {/* Progress to target */}
                                <div className="progress-track" style={{ marginBottom: '0.5rem' }}>
                                    <div className="progress-fill" style={{
                                        width: `${pct}%`,
                                        background: e.color
                                    }} />
                                </div>
                                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                    <span className="text-xs text-muted">0</span>
                                    <span className="text-xs text-muted">Target: {e.target}{e.unit}</span>
                                </div>

                                {/* Quick buttons */}
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => updateValue(e.id, -e.step)}
                                        disabled={val === 0}
                                        style={{
                                            width: '36px', height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border)',
                                            background: 'rgba(255,255,255,0.03)',
                                            color: val === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                                            cursor: val === 0 ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <button
                                        onClick={() => updateValue(e.id, e.step)}
                                        style={{
                                            flex: 1,
                                            height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: `1px solid ${e.color}33`,
                                            background: `${e.color}12`,
                                            color: e.color,
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                        }}
                                    >
                                        <Plus size={14} /> {e.step}{e.unit}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ElectrolyteTracker;

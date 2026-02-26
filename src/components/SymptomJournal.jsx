/**
 * VIVO — Symptom Journal Component
 * Quick daily check-in for autonomic symptoms
 */
import { useState } from 'react';
import { Check } from 'lucide-react';

const SYMPTOMS = [
    { id: 'bien', label: 'Me siento bien', emoji: '✨', positive: true },
    { id: 'descansado', label: 'Descansado', emoji: '😴', positive: true },
    { id: 'motivado', label: 'Motivado', emoji: '🔥', positive: true },
    { id: 'estres_alto', label: 'Estrés alto', emoji: '😤', positive: false },
    { id: 'digestion_pesada', label: 'Digestión pesada', emoji: '🫃', positive: false },
    { id: 'cena_copiosa', label: 'Cena copiosa ayer', emoji: '🍽️', positive: false },
    { id: 'insomnio', label: 'Dormí mal', emoji: '😵', positive: false },
];

const DOMS_LEVELS = [
    { value: 0, label: 'Sin dolor', emoji: '✅', color: 'var(--green)' },
    { value: 1, label: 'Leve', emoji: '🟡', color: 'var(--yellow)' },
    { value: 2, label: 'Moderado', emoji: '🟠', color: '#f97316' },
    { value: 3, label: 'Limitante', emoji: '🔴', color: 'var(--red)' },
];

// Helper: extrae el nivel de DOMS del array de síntomas
export const getDomsLevel = (symptoms = []) => {
    const tag = symptoms.find(s => s?.startsWith?.('doms_'));
    return tag ? parseInt(tag.split('_')[1], 10) : 0;
};

const SymptomJournal = ({ symptoms, onSymptomsChange, motivation = 3, onMotivationChange, saved }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleSymptom = (id) => {
        const next = symptoms.includes(id)
            ? symptoms.filter(s => s !== id)
            : [...symptoms, id];
        onSymptomsChange(next);
    };

    const domsLevel = getDomsLevel(symptoms);

    const setDomsLevel = (level) => {
        const withoutDoms = symptoms.filter(s => !s?.startsWith?.('doms_'));
        const next = level === 0 ? withoutDoms : [...withoutDoms, `doms_${level}`];
        onSymptomsChange(next);
    };

    const positiveSymptoms = SYMPTOMS.filter(s => s.positive);
    const negativeSymptoms = SYMPTOMS.filter(s => !s.positive);

    return (
        <div className="card animate-fade-in">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex-between"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🧠</span>
                    <div>
                        <div className="text-xs uppercase tracking-widest text-muted font-bold">Diario Sintomático</div>
                        <div className="text-sm font-medium" style={{ marginTop: '0.15rem' }}>
                            {symptoms.length === 0 ? '¿Cómo te sientes hoy?' : `${symptoms.length} síntoma${symptoms.length > 1 ? 's' : ''} registrado${symptoms.length > 1 ? 's' : ''}`}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {saved && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.6rem', fontWeight: 700, color: 'var(--green)',
                            textTransform: 'uppercase', letterSpacing: '0.1em'
                        }}>
                            <Check size={12} /> Guardado
                        </span>
                    )}
                    <span className="text-muted" style={{ fontSize: '1rem', transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                        ▾
                    </span>
                </div>
            </button>

            {expanded && (
                <div style={{ marginTop: '1rem' }} className="animate-fade-in">
                    {/* Positive */}
                    <div className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>
                        Señales positivas
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                        {positiveSymptoms.map(s => {
                            const active = symptoms.includes(s.id);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => toggleSymptom(s.id)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: active ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border)',
                                        background: active ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.03)',
                                        color: active ? 'var(--green)' : 'var(--text-secondary)',
                                    }}
                                >
                                    {s.emoji} {s.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Negative */}
                    <div className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--red)', marginBottom: '0.5rem' }}>
                        Señales de alerta
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {negativeSymptoms.map(s => {
                            const active = symptoms.includes(s.id);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => toggleSymptom(s.id)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: active ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                                        background: active ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.03)',
                                        color: active ? 'var(--red)' : 'var(--text-secondary)',
                                    }}
                                >
                                    {s.emoji} {s.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* DOMS Modulator — Capa mecánica separada del IEA */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
                            <div>
                                <div className="text-xs uppercase tracking-widest font-black" style={{ color: '#f97316' }}>
                                    🦵 Dolor Muscular (DOMS)
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                    Modulador mecánico · No afecta al IEA
                                </div>
                            </div>
                            <div className="text-sm font-black" style={{ color: DOMS_LEVELS[domsLevel].color }}>
                                {DOMS_LEVELS[domsLevel].emoji} {DOMS_LEVELS[domsLevel].label}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {DOMS_LEVELS.map(d => (
                                <button
                                    key={d.value}
                                    onClick={() => setDomsLevel(d.value)}
                                    style={{
                                        flex: 1, padding: '0.6rem', borderRadius: '12px',
                                        background: domsLevel === d.value ? `${d.color}22` : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${domsLevel === d.value ? d.color : 'var(--border)'}`,
                                        color: domsLevel === d.value ? d.color : 'var(--text-muted)',
                                        fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {d.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Motivation Selector */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                            <div className="text-xs uppercase tracking-widest font-black" style={{ color: 'var(--purple)' }}>
                                Nivel de Motivación
                            </div>
                            <div className="text-sm font-black" style={{ color: '#fff' }}>
                                {motivation === 1 ? '😑 Nulo' : motivation === 2 ? '🔋 Bajo' : motivation === 3 ? '✅ Normal' : motivation === 4 ? '🔥 Alto' : '🚀 Máximo'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {[1, 2, 3, 4, 5].map(m => (
                                <button
                                    key={m}
                                    onClick={() => onMotivationChange?.(m)}
                                    style={{
                                        flex: 1, padding: '0.6rem', borderRadius: '12px',
                                        background: motivation === m ? 'var(--purple)' : 'rgba(255,255,255,0.03)',
                                        border: '1px solid ' + (motivation === m ? 'var(--purple)' : 'var(--border)'),
                                        color: motivation === m ? '#fff' : 'var(--text-muted)',
                                        fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SymptomJournal;

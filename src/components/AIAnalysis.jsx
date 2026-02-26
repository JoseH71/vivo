import { useState, useMemo } from 'react';
import { Brain, Loader2, RefreshCw, Activity, MessageSquare } from 'lucide-react';

const AIAnalysis = ({ analysis, isLoading, onRequestAnalysis }) => {
    const [showFull, setShowFull] = useState(false);

    // Ultra-refined parsing logic
    const parts = useMemo(() => {
        if (!analysis) return null;

        let stateText = '';
        let adjustmentText = '';
        let prescriptionText = '';

        // Extract sections using 1️⃣, 2️⃣, 3️⃣/📌 markers
        const stateMatch = analysis.match(/1️⃣(.*?)(?=2️⃣|3️⃣|📌|$)/s);
        const adjMatch = analysis.match(/2️⃣(.*?)(?=3️⃣|📌|$)/s);
        const presMatch = analysis.match(/(?:3️⃣|📌)(.*)/s);

        stateText = stateMatch ? stateMatch[1].trim() : '';
        adjustmentText = adjMatch ? adjMatch[1].trim() : '';
        prescriptionText = presMatch ? presMatch[1].trim() : '';

        // Clean headers
        stateText = stateText.replace(/🫀 ESTADO AUTONÓMICO/i, '').trim();
        adjustmentText = adjustmentText.replace(/⚡ AJUSTE DEL ENTRENO DE HOY/i, '').trim();
        prescriptionText = prescriptionText.replace(/PRESCRIPCIÓN FINAL/i, '').trim();

        // Sub-parsing Prescription for the primary card
        // Expected format: "Bici → Z2 60’ (~45 TSS), 65–72% FTP, <140 lpm. Objetivo: ..."
        let mainTitle = 'Sesión Reguladora';
        let metrics = [];
        let objective = 'Mantenimiento autonómico';

        if (prescriptionText) {
            // Find the main plan (usually after the arrow "→")
            const arrowParts = prescriptionText.split('→');
            const rawPlan = arrowParts.length > 1 ? arrowParts[1] : arrowParts[0];

            // Extract Objective if present
            const objIndex = rawPlan.toLowerCase().indexOf('objetivo:');
            let planLines = rawPlan;
            if (objIndex !== -1) {
                objective = rawPlan.substring(objIndex + 9).trim();
                planLines = rawPlan.substring(0, objIndex).trim();
            }

            // Split into title and metrics
            // We look for the first part (like "Z2 60’") and then the rest (metrics)
            const commaParts = planLines.split(/[,(]/);
            if (commaParts.length > 0) {
                mainTitle = commaParts[0].trim();
                metrics = commaParts.slice(1).map(m => m.replace(/[).]/g, '').trim()).filter(Boolean);
            }
        }

        return {
            state: stateText,
            adjustment: adjustmentText,
            mainTitle,
            metrics,
            objective
        };
    }, [analysis]);

    return (
        <div className="ia-container">

            {!analysis && !isLoading ? (
                <div className="card-glass flex-center" style={{ padding: '3rem 1.5rem', borderRadius: '32px' }}>
                    <button onClick={onRequestAnalysis} className="btn btn-ghost" style={{ gap: '1rem', padding: '1.2rem 2rem' }}>
                        <Brain size={24} style={{ color: 'var(--cyan)' }} />
                        <span className="font-black text-base">EJECUTAR MOTOR IA</span>
                    </button>
                </div>
            ) : isLoading ? (
                <div className="card-glass flex-center" style={{ padding: '4rem 1.5rem', borderRadius: '32px', gap: '1.5rem', flexDirection: 'column' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                    <span className="text-sm font-black text-muted uppercase tracking-widest" style={{ letterSpacing: '0.2em' }}>
                        Sincronizando Bio-Datos...
                    </span>
                </div>
            ) : (
                <div className="stagger">

                    {/* BLOQUE 1: ACCIÓN (60% peso visual) */}
                    <div className="ia-card ia-primary">
                        <div className="ia-label">ACCIÓN RECOMENDADA</div>

                        <div className="ia-main-title">
                            {parts?.mainTitle}
                        </div>

                        {parts?.metrics && parts.metrics.length > 0 && (
                            <div className="ia-metrics">
                                {parts.metrics
                                    .filter(m => !m.toLowerCase().includes('fasciculación') && !m.toLowerCase().includes('palpitación'))
                                    .map((m, i) => (
                                        <div key={i}>{m}</div>
                                    ))}
                            </div>
                        )}

                        <div className="ia-objective">
                            Objetivo: {parts?.objective.split('.')[0]}
                        </div>
                    </div>

                    {/* BLOQUE 2: CONTEXTO (compacto) */}
                    <div className="ia-card ia-secondary">
                        <div className="ia-section-title">INTERPRETACIÓN</div>
                        <div className="ia-context-text">
                            {parts?.state.split('\n')[0]} {/* First line for immediate context */}
                            {parts?.state.split('\n').length > 1 && <div style={{ marginTop: '0.5rem', opacity: 0.8 }}>{parts.state.split('\n')[1]}</div>}
                        </div>
                    </div>

                    {/* BOTÓN Y ANÁLISIS TÉCNICO */}
                    <div className="ia-expand">
                        <button
                            onClick={() => setShowFull(!showFull)}
                            className="ia-button"
                        >
                            {showFull ? 'Ocultar análisis técnico' : 'Ver análisis técnico'}
                        </button>
                    </div>

                    {showFull && (
                        <div className="animate-fade-in" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="ia-card ia-secondary" style={{ margin: 0 }}>
                                <div className="ia-section-title">Ajuste de Carga Detallado</div>
                                <p className="ia-context-text">
                                    {parts?.adjustment}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Refresh logic floating slightly below */}
                    <div className="flex-center" style={{ marginTop: '2rem', opacity: 0.3 }}>
                        <button onClick={onRequestAnalysis} className="btn-icon">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAnalysis;

/**
 * VIVO — Coach Knowledge Base
 * Specific physiological patterns and rules learned from historical data for this athlete.
 * These are injected into the AI Coach system prompt.
 */

export const COACH_KNOWLEDGE = [
    {
        pattern: "Desincronización Autonómica en Descarga",
        description: "En semanas de descarga o reducción fuerte de carga, se observa una bajada de HRV (~4-6ms) y una subida ligera de FC Reposo (~2-3 bpm).",
        physiologicalReason: "Falta de estímulo cardiovascular aeróbico, reducción del retorno venoso y del volumen sistólico. No es fatiga acumulada (el TSB suele ser positivo), sino una desactivación transitoria del sistema aeróbico.",
        recommmendation: "No preocuparse por la caída de HRV si el TSB es creciente. Se resuelve reactivando con una sesión aeróbica ligera (Z2)."
    },
    {
        pattern: "Sensibilidad al Sueño",
        description: "Un porcentaje de sueño inferior al 60% produce una caída aguda del HRV (ej. de 44ms a 36ms).",
        physiologicalReason: "Estrés agudo del sistema nervioso central.",
        recoveryRate: "Tarda entre 3 y 4 días en normalizar la línea base de HRV tras un episodio de mal sueño."
    },
    {
        pattern: "Ventaja Aeróbica (Efecto San Millán)",
        description: "El HRV es consistentemente más alto (46-50ms) en semanas de carga moderada con volumen aeróbico que en semanas de descanso total.",
        physiologicalReason: "El ejercicio aeróbico regular estabiliza el tono vagal y los barorreceptores en este atleta."
    },
    {
        pattern: "Protocolo FA (Fibrilación Auricular) - Seguridad",
        description: "Límite absoluto de seguridad de FC en 150 lpm. Prohibido VO2max sostenido o Z6.",
        rule: "Si HRV Z-score < -1 o cv-HRV > 18%, cancelar cualquier sesión de intensidad y pasar a descanso o Z2 puro."
    }
];

export const formatKnowledgeForPrompt = () => {
    return COACH_KNOWLEDGE.map(k => `- ${k.pattern}: ${k.description} (Razón: ${k.physiologicalReason || ''})`).join('\n');
};

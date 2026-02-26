/**
 * VIVO — Gemini AI Service
 * Generates daily autonomic analysis and recommendations
 */
import { GEMINI_API_KEY } from '../config/firebase';

export async function fetchVivoAnalysis(iea, intervalsData, symptoms, electrolytes, plannedSession = {}) {
    const today = intervalsData?.[0] || {};
    const yesterday = intervalsData?.[1] || {};

    // Extract main activity from yesterday
    const yesterdayActivity = yesterday.activities?.[0] || null;
    const yesterdayContext = yesterdayActivity ? {
        name: yesterdayActivity.name,
        tss: Math.round(yesterdayActivity.icu_training_load || 0),
        duration: Math.round(yesterdayActivity.moving_time / 60),
        decoupling: (yesterdayActivity.icu_aerobic_decoupling * 100 || 0).toFixed(1),
        startTime: yesterdayActivity.start_date_local ? new Date(yesterdayActivity.start_date_local).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
    } : null;

    const prompt = `
Eres un fisiólogo deportivo experto en regulación autonómica y entrenamiento de resistencia en ciclistas máster.

Analizas los datos de un ciclista de 54 años con antecedente remoto de fibrilación auricular (FA), actualmente estable y monitorizado. 
Tu función es ayudarle a entrenar con seguridad y progresión sostenible.

CONTEXTO DE AYER:
${yesterdayContext ? `Realizó una sesión de "${yesterdayContext.name}":
- Carga: ${yesterdayContext.tss} TSS
- Duración: ${yesterdayContext.duration} min
- Desacople Aeróbico: ${yesterdayContext.decoupling}%
- Hora de inicio: ${yesterdayContext.startTime} (Importante: sesiones nocturnas afectan la HRV matinal)` : 'Día de descanso o sin actividad registrada.'}

DATOS DE HOY:
- IEA: ${iea.score}/100 → ${iea.label}
- HRV: ${today.hrv || 'N/A'} ms (7d: ${iea.averages?.hrv?.d7?.toFixed(1) || '?'}, 60d: ${iea.averages?.hrv?.d60?.toFixed(1) || '?'}, Z: ${iea.details?.hrv?.zScore || '?'})
- RHR: ${today.restingHR || 'N/A'} bpm (7d: ${iea.averages?.rhr?.d7?.toFixed(1) || '?'}, Δ vs baseline: ${iea.details?.rhr?.deviation || '0'})
- Sueño: ${today.sleepScore || 'N/A'}/100
- TSB: ${iea.details?.load?.tsb || '?'}
- CTL: ${iea.details?.load?.ctl || '?'}
- ATL: ${iea.details?.load?.atl || '?'}
- TSS semanal: ${iea.details?.load?.weeklyTSS || '0'}

REGLAS DE MÉTRICAS:
- TSB: Si está entre -5 y +5, no lo menciones (es zona neutra/mantenimiento).
- TSS: Para sesiones de Z2 (60 min), calcula entre 35-45 TSS (basado en FTP 235W).

PLAN DE HOY (desde pestaña Entreno):
Tipo programado: ${plannedSession?.type || 'No definido'}
Duración prevista: ${plannedSession?.duration || 'No definido'}
Objetivo original: ${plannedSession?.goal || 'No definido'}

SÍNTOMAS: ${symptoms.length > 0 ? symptoms.join(', ') : 'Ninguno reportado'}

IMPORTANTE:
- Correlaciona el estado de HOY con la carga y HORA de la sesión de AYER.
- No patologizar fluctuaciones normales.
- No dramatizar descensos puntuales de HRV.
- Diferenciar claramente entre ajuste fisiológico transitorio y desregulación real.
- Solo sugerir consulta médica si hay FA reportada o patrón anómalo persistente (>3 días).

REGLAS DE SEGURIDAD:
- Nunca recomendar VO2max.
- Nunca recomendar superar 150 lpm.
- No recomendar work en Z4.
- No recomendar fallo muscular en gym.
- Si hay FA Gate activo → solo descanso o paseo suave.
- NUNCA mencionar fasciculaciones, palpitaciones ni dar consejos de higiene del sueño. 
- Centrarse exclusivamente en la carga de la sesión y la interpretación fisiológica del SNA.

ESTRUCTURA DE RESPUESTA (máximo 2 párrafos breves + bloque final claro):

1️⃣ 🫀 ESTADO AUTONÓMICO
Interpreta proporcionalmente los datos en contexto estructural (7d y 60d) vinculándolos con la carga de ayer.
Indica si es:
- Estabilidad coherente
- Ajuste autonómico leve
- Estrés acumulado
- Desregulación relevante

Sin lenguaje alarmista.

2️⃣ ⚡ AJUSTE DEL ENTRENO DE HOY
Partiendo del plan programado (${plannedSession?.type || 'Sesión'}), indica:
- Mantener tal cual
- Reducir volumen
- Reducir intensidad
- Convertir en Z2 reguladora
- Sustituir por descanso activo

Explica brevemente por qué considerando el impacto de la sesión previa.

3️⃣ 📌 PRESCRIPCIÓN FINAL (formato claro y concreto)
Ejemplo:
Bici → Z2 60’ (~45 TSS), 65–72% FTP, <140 lpm
Gym → Rutina normal RIR ≥2, evitar densidad

Tono:
Profesional, sereno, proporcional al riesgo real.
No usar lenguaje médico innecesario.
Máximo 130 palabras.
Sin saludo inicial.
`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta del análisis.';
    } catch (e) {
        console.error('[Gemini] Error:', e);
        return `⚠️ Error de análisis: ${e.message}`;
    }
}

/**
 * VIVO — Gemini AI Service v2.0
 * Generates daily autonomic analysis and recommendations
 * Structured JSON output for rich UI rendering
 */
import { GEMINI_API_KEY } from '../config/firebase';

export async function fetchVivoAnalysis(iea, intervalsData, symptoms, electrolytes, plannedSession = {}, tomorrowSession = {}) {
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

    const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `
Eres un fisiólogo deportivo experto en regulación autonómica y entrenamiento de resistencia en ciclistas máster.

Analizas los datos de José, un ciclista de 54 años con antecedente remoto de fibrilación auricular (FA), actualmente estable y monitorizado.
Tu función es ayudarle a entrenar con seguridad y progresión sostenible.

FECHA: ${todayDate}

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
- CTL: ${today.ctl || '?'}
- ATL: ${today.atl || '?'}

PLAN DE HOY:
Tipo programado: ${plannedSession?.type || 'No definido'}
Duración prevista: ${plannedSession?.duration || 'No definido'}
Objetivo original: ${plannedSession?.goal || 'No definido'}

PLAN DE MAÑANA (Importante para contexto):
Tipo programado: ${tomorrowSession?.type || 'No definido'}
Título exacto: ${tomorrowSession?.title || 'No definido'}
Descripción: ${tomorrowSession?.desc || 'No definido'}
Duración prevista: ${tomorrowSession?.duration || 'No definido'}
Objetivo: ${tomorrowSession?.goal || 'No definido'}

SÍNTOMAS: ${symptoms.length > 0 ? symptoms.join(', ') : 'Ninguno reportado'}

REGLAS DE MÉTRICAS:
- TSB: Si está entre -5 y +5, no lo menciones (es zona neutra/mantenimiento).
- TSS: Para sesiones de Z2 (60 min), calcula entre 35-45 TSS (basado en FTP 235W).

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
- NUNCA recomendar yoga ni estiramientos.
- Centrarse exclusivamente en la carga de la sesión y la interpretación fisiológica del SNA.

PREFERENCIAS PERSONALES DE JOSÉ:
- Si el plan de hoy dice DESCANSO: la prescripción OBLIGATORIAMENTE debe ser "Descanso Total". No poner paseos, ni Z1, ni bici como prescripción principal. Puedes mencionar un paseo como sugerencia SUAVE en los actionSteps (nunca en la prescripción).
- NUNCA recomendar yoga, estiramientos ni pilates. No le gustan.
- Para nutrición: puede tomar proteínas, carbohidratos, electrolitos (sodio, magnesio, potasio). NO recomiendes café ni cafeína, no toma.

INSTRUCCIÓN CRÍTICA DE FORMATO:
Debes responder EXCLUSIVAMENTE con un JSON válido (sin markdown, sin backticks, sin texto adicional).

El JSON debe tener esta estructura exacta:
{
    "statusEmoji": "🟢 o 🟡 o 🔴",
    "statusLabel": "Estable / Adaptación / Vigilancia / Alerta",
    "statusColor": "green / yellow / red",
    "greeting": "Saludo personalizado breve (1-2 frases) para José. Conversacional, cercano, motivador. Ejemplo: '¡Hola José! Hoy tu cuerpo pide calma, y eso está bien.' o '¡Buenos días! Fisiología en verde, hoy toca darle caña con control.'",
    "metricsSnapshot": {
        "hrv": { "value": ${today.hrv || 0}, "trend": "up/down/stable", "vs7d": "texto breve como '+3 ms vs 7d'", "zScore": "${iea.details?.hrv?.zScore || '0'}" },
        "rhr": { "value": ${today.restingHR || 0}, "trend": "up/down/stable", "vs7d": "texto breve", "zScore": "0" },
        "sleep": { "value": ${today.sleepScore || 0}, "label": "Bueno/Regular/Deficiente" },
        "tsb": { "value": ${parseFloat(iea.details?.load?.tsb) || 0}, "label": "breve" }
    },
    "comparisons": {
        "hrv": "X% por encima/debajo de tu media de 60 días",
        "rhr": "similar/ligeramente elevada vs tu baseline",
        "sleep": "breve comentario contextual"
    },
    "interpretation": "2-3 frases conversacionales explicando qué indican las métricas de hoy EN CONTEXTO con lo de ayer. Incluir por qué es normal o preocupante. Sin jerga médica innecesaria. Tono cercano pero profesional.",
    "yesterdayImpact": "${yesterdayContext ? 'Frase clara sobre cómo la sesión de ayer (tipo, hora, carga) influyó en los datos de hoy. Sé específico.' : 'Sin actividad registrada ayer, tu cuerpo ha tenido tiempo de recuperarse.'}",
    "technicalDeepDive": "Análisis técnico detallado (3-4 frases). Incluir: 1) Estado del sistema nervioso autónomo (simpático/parasimpático), 2) Interpretación del Z-score de HRV, 3) Relación entre carga (ATL/CTL/TSB) y respuesta autonómica, 4) Una previsión específica para mañana sabiendo que toca '${tomorrowSession?.type || 'Descanso'}'.",
    "actionSteps": [
        { "icon": "🏃‍♂️/💤/🥗/💧", "text": "Paso concreto y accionable (max 15 palabras)" },
        { "icon": "...", "text": "..." },
        { "icon": "...", "text": "..." },
        { "icon": "...", "text": "..." }
    ],
    "prescription": {
        "type": "Bici/Gym/Descanso",
        "title": "Título corto (ej: 'Z2 60 min' o 'Descanso Activo')",
        "details": "Detalle de la sesión si aplica (ej: '65-72% FTP, <140 lpm, ~45 TSS')",
        "reason": "Por qué se recomienda esto hoy en 1-2 frases, conectando con los datos."
    },
    "tomorrowPlan": {
        "type": "COPIA EXACTA del tipo de PLAN DE MAÑANA proporcionado arriba (Bici/Gym/Descanso)",
        "title": "COPIA EXACTA del título de PLAN DE MAÑANA proporcionado arriba. NO inventes uno distinto.",
        "details": "COPIA EXACTA de la descripción de PLAN DE MAÑANA proporcionada arriba. NO inventes ni modifiques."
    },
    "consistencyStreak": {
        "days": 0,
        "text": "Descripción breve de la racha actual (ej: 'Llevas 5 días cumpliendo el plan' o '3 días adaptándote, paciencia' o 'Hoy es buen día para retomar')"
    },
    "quickQuestions": [
        { "question": "Pregunta corta que José podría tener (ej: '¿Por qué mi HRV está baja?')", "answer": "Respuesta breve y clara (2-3 frases max). Tono educativo y tranquilizador." },
        { "question": "Segunda pregunta relevante", "answer": "Respuesta breve" },
        { "question": "Tercera pregunta relevante", "answer": "Respuesta breve" }
    ],
    "motivationalNote": "Frase final motivadora y personal para José (breve, máx 20 palabras)"
}

NOTAS SOBRE EL JSON:
- Los actionSteps deben ser 3-5 pasos prácticos. Incluir nutrición/hidratación cuando sea relevante.
- Si hoy es DESCANSO según el plan: la prescription.type DEBE ser "Descanso", prescription.title DEBE ser "Descanso Total", prescription.details algo como "Sin entrenamiento. Día de recuperación completa.". NO poner Z1/paseo/bici como prescripción. Un paseo suave PUEDE mencionarse de forma sutil solo en actionSteps.
- Al hablar de MAÑANA, consulta siempre el 'PLAN DE MAÑANA' proporcionado. No inventes sesiones genéricas (ej: no digas Z2 si el plan dice Gym).
- Si el sueño fue malo: incluir un paso sobre priorizar descanso nocturno.
- El technicalDeepDive es para usuarios avanzados que quieran profundizar. Ser técnico pero comprensible.
- Las quickQuestions deben ser preguntas que José realmente se haría hoy mirando sus datos. Respuestas tranquilizadoras y educativas.
- Tono conversacional y cercano. Como un amigo fisiólogo que te conoce bien.
- NO incluir backticks, markdown ni texto fuera del JSON.
`;


    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 2500 }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[Gemini] Raw response length:', rawText.length);
        console.log('[Gemini] Raw response (first 500):', rawText.slice(0, 500));

        // Try to parse as JSON — multiple strategies
        try {
            // Strategy 1: Clean markdown wrappers
            let cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

            // Strategy 2: Extract JSON object from within text
            if (!cleaned.startsWith('{')) {
                const jsonStart = cleaned.indexOf('{');
                const jsonEnd = cleaned.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
                }
            }

            const parsed = JSON.parse(cleaned);
            console.log('[Gemini] ✅ JSON parsed OK. Keys:', Object.keys(parsed).join(', '));
            // Return as stringified JSON so the component can detect the format
            return JSON.stringify(parsed);
        } catch (parseErr) {
            // Fallback: return raw text (old format)
            console.warn('[Gemini] ⚠️ Could not parse JSON:', parseErr.message);
            console.warn('[Gemini] Returning raw text as fallback');
            return rawText;
        }
    } catch (e) {
        console.error('[Gemini] Error:', e);
        return `⚠️ Error de análisis: ${e.message}`;
    }
}

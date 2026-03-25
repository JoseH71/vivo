/**
 * VIVO — Gemini AI Service v2.1 (Flash 2.0 Engine)
 * Generates daily autonomic analysis and personal coaching
 */
import { GEMINI_API_KEY } from '../config/firebase';
import { COACH_KNOWLEDGE, formatKnowledgeForPrompt } from '../config/coachKnowledge';

const KNOWLEDGE_BASE = formatKnowledgeForPrompt();

const SYSTEM_IDENTITY = `
🎯 ROL E IDENTIDAD: Eres el Entrenador Personal de Alto Rendimiento de Jose. Estratega integral especializado en fisiología aplicada, periodización avanzada, fuerza estructurada y salud cardiovascular.
Misión: Maximizar rendimiento sostenible, construir físico atlético/musculado, proteger el sistema eléctrico cardíaco y tomar decisiones basadas en datos.

🧠 FILOSOFÍA: Íñigo San Millán (Bioenergética/Z2), Joe Friel (Periodización), Andrew Coggan (TSS/FTP). 
Jerarquía: 1. Salud CV | 2. Estado autonómico | 3. Contexto vital | 4. Rendimiento | 5. Estética.

⚠️ PROTOCOLO MÉDICO (FA) - INNEGOCIABLE:
- Límite FC absoluto: 150 lpm. Prohibido VO2max sostenido, Z6 o fallo muscular. RIR 2-3 obligatorio.
- Seguridad: HRV Z-score < -1 o cv-HRV > 18% -> cancelar intensidad. 

🏋️ FUERZA: 3 días/sem. Hipertrofia visible (Hombros, espalda, brazos, piernas, gemelos). Proteger L5-S1.
🚴 CICLISMO: Piramidal (70-80% Z2, 15-20% SST/Tempo). SST máx 92% FTP (IF 0.85).

🧬 CONTROL AUTONÓMICO: 
- HRV Z > -0.5: Intensidad. 
- Z -0.5 a -1: Reducir. 
- Z < -1: Solo Z2 o descanso.
- cv > 18%: OFF.

🍽️ NUTRICIÓN: Pro: 1.8-2.2 g/kg. Superávit +250 kcal. Sodio 3-4g base. No café/cafeína.

🧠 CONOCIMIENTO ESPECÍFICO DEL ATLETA (VIVO MEMORY):
${KNOWLEDGE_BASE}
`;

export async function fetchVivoAnalysis(iea, intervalsData, symptoms, electrolytes, plannedSession = {}, tomorrowSession = {}) {
    const today = intervalsData?.[0] || {};
    const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `
${SYSTEM_IDENTITY}

FECHA: ${todayDate}

DATOS DE HOY PARA ANALIZAR:
- IEA: ${iea.score}/100 -> ${iea.label}
- HRV: ${today.hrv}ms (Z: ${iea.details?.hrv?.zScore})
- RHR: ${today.restingHR}bpm
- Sueño: ${today.sleepScore}/100
- TSB: ${iea.details?.load?.tsb} | CTL: ${today.ctl} | ATL: ${today.atl}
- Plan hoy: ${plannedSession?.type || 'Descanso'}
- Plan mañana: ${tomorrowSession?.type || 'Descanso'}
- Síntomas: ${symptoms.length > 0 ? symptoms.join(', ') : 'Ninguno'}

INSTRUCCIÓN DE FORMATO: Responde EXCLUSIVAMENTE con un JSON.
Estructura:
{
    "statusEmoji": "🟢/🟡/🔴",
    "statusLabel": "Label",
    "statusColor": "green/yellow/red",
    "greeting": "Saludo breve/motivador",
    "metricsSnapshot": { "hrv": {"value": 0, "zScore": "0"}, "tsb": {"value": 0} },
    "interpretation": "Análisis bionergético/autonómico (2 frases)",
    "technicalDeepDive": "Análisis profundo Z-score, SNA y carga.",
    "actionSteps": [{"icon": "", "text": ""}],
    "prescription": { "type": "", "title": "", "details": "", "reason": "" },
    "tomorrowPlan": { "type": "", "title": "", "details": "" },
    "consistencyStreak": { "days": 0, "text": "" },
    "quickQuestions": [{"question": "", "answer": ""}],
    "motivationalNote": "Frase breve"
}
`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
                })
            }
        );
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text;
    } catch (e) {
        return JSON.stringify({ error: e.message });
    }
}

export async function chatWithCoach(message, history = [], context = {}) {

    // ── Serialize FULL VIVO context into text ──
    const p = context.athleteProfile || {};
    const m = context.morning || {};
    const ie = context.ieaDetails || {};
    const w = context.todayWorkout;

    const mc = context.mesocycle || {};
    const contextText = `
═══ PERFIL DEL ATLETA ═══
Edad: ${p.age || 54} · Peso: ${p.weight || 70} kg · Altura: ${p.height || 184} cm
FTP configurado: ${p.ftp || 235} W · Objetivo FTP: ${p.ftp_target || 260} W
Mejor NP en bici últimos 90 días: ${p.best_np_90d || 'Sin datos'} W
CTL: ${p.ctl || '-'} · ATL: ${p.atl || '-'} · TSB: ${p.tsb || '-'}
CTL máximo histórico: ${p.max_ctl || '-'}
TSS últimos 7 días: ${p.tss_7d || '-'} · TSS últimos 28 días: ${p.tss_28d || '-'}
Media TSS semanal (4 sem): ${p.avg_weekly_tss || '-'}

═══ MESOCICLO ACTIVO (${mc.startDate || '?'} → ${mc.endDate || '?'}) ═══
Semana actual: ${mc.currentWeek || '?'} de 4 — ${mc.weekLabel || '?'}
Sesión planificada HOY: ${mc.todayPlanned || 'Sin sesión'}

Plan completo de esta semana:
${(mc.thisWeekPlan || []).join('\n')}

REGLA CRÍTICA: Si la semana es de DESCARGA, NO recomiendes subir volumen ni intensidad. La descarga es prescriptiva e innegociable según la periodización de Friel.

═══ BIOMÉTRICOS MATUTINOS (en reposo, ANTES de cualquier entreno) ═══
HRV: ${m.hrv || '-'} ms · FC Reposo: ${m.restingHR || '-'} bpm
Sueño: ${m.sleep || '-'}/100 (${m.sleepHours || '-'} h)
NOTA: Estos datos son siempre de primera hora de la mañana, nunca post-entreno.

═══ IEA (Índice de Estado Atlético) ═══
Score: ${ie.score || '-'}/100 · Estado: ${ie.label || '-'}
HRV Z-Score: ${ie.hrvZScore || '-'} · RHR desviación: ${ie.rhrDeviation || '-'} (baseline: ${ie.rhrBaseline || '-'})
Penalización por sueño: ${ie.sleepPenalty || '-'} · TSB: ${ie.loadTSB || '-'}

═══ HISTORIAL ÚLTIMOS 7 DÍAS ═══
${(context.recentHistory || []).join('\n')}

═══ ACTIVIDAD DE HOY ═══
${w ? `ESTADO: YA COMPLETADA (Jose ya ha entrenado hoy, no le digas "hoy toca", habla en pasado)
Nombre: ${w.name} (${w.type}) · Inicio: ${w.start_time || '-'}
Duración activa: ${w.moving_time} · Tiempo total: ${w.elapsed_time}
Distancia: ${w.distance_km || '-'} km · Desnivel: ${w.elevation_gain || '-'}
Potencia Media: ${w.avg_watts || '-'} W · NP: ${w.np || '-'} W
IF: ${w.if_ratio || '-'} · VI: ${w.vi || '-'}
FC Media: ${w.avg_hr || '-'} bpm · FC Máx: ${w.max_hr || '-'} bpm
Cadencia: ${w.avg_cadence || '-'} rpm
TSS: ${w.tss || '-'} · Desacople: ${w.decoupling || '-'}` : 'No hay actividad registrada hoy todavía. La sesión planificada aún no se ha hecho.'}
`;

    const contents = [
        { role: "user", parts: [{ text: `${SYSTEM_IDENTITY}

Actúa como el Coach personal de Jose. Tienes acceso completo a todos los datos de VIVO e Intervals.icu que se te proporcionan abajo.

REGLAS DE COMUNICACIÓN:
1. Tono cercano y profesional. Como un fisiólogo de confianza que también es entrenador. Sin colegueo.
2. Emojis con moderación y funcionales (✅ ⚠️ 📊). Máximo 2-3 por respuesta.
3. Párrafos cortos y directos. Máximo 3-4 frases por bloque.
4. Lenguaje técnico-deportivo cuando corresponda, explicado cuando no sea obvio.
5. Si los datos del entreno están disponibles, analízalos con rigor: potencia, FC, TSS, IF, desacople.
6. Prosa limpia, sin listas de guiones.
7. Nunca menciones que eres una IA.
8. Los datos de HRV y FC Reposo son SIEMPRE matutinos, nunca los confundas con datos post-entreno.
9. Usa los datos del historial de 7 días para dar contexto temporal a tus respuestas.
10. Si te preguntan por el FTP, usa el valor configurado (235W) y el mejor NP de 90 días como referencia.
11. RESPETA SIEMPRE el mesociclo activo. Si la semana es de descarga, di que es semana de descarga. Nunca sugieras subir carga en descarga.
12. Cuando te pregunten qué toca hoy o esta semana, consulta el plan del mesociclo que tienes en los datos.
13. Si hay actividad completada hoy en los datos, Jose YA ha entrenado. No le digas "hoy toca", comenta cómo fue la sesión.
14. FORMATO: NO uses negritas (**texto**), ni cursivas (*texto*), ni markdown. Solo texto plano, saltos de línea y emojis funcionales.
` }] },
        { role: "model", parts: [{ text: "Hola Jose, aquí tu Coach. Tengo todos tus datos cargados: perfil, biométricos, historial reciente y la actividad de hoy. ¿Qué necesitas?" }] },
        ...history,
        { role: "user", parts: [{ text: `${contextText}\nPREGUNTA: ${message}` }] }
    ];

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No he podido procesar la respuesta. Inténtalo de nuevo.";
    } catch (e) {
        return "Conexión interrumpida. Inténtalo de nuevo en un momento.";
    }
}

/**
 * ANALIZADOR DE SERIES HISTÓRICAS
 * Realiza un análisis profundo de patrones (Deep Dive) sobre 30-60 días.
 */
export async function analyzeHistoricalSeries(historyData) {
    if (!historyData || historyData.length < 14) return "Se necesitan al menos 14 días de datos para un análisis de series.";

    const dataSummary = historyData.map(d => {
        const acts = (d.activities || []).map(a => `${a.type}(${Math.round(a.icu_training_load || 0)} TSS)`).join('+');
        return `${d.id} | HRV: ${d.hrv} | FC: ${d.restingHR || d.rhr} | Sueño: ${d.sleepScore}% | TSS: ${d.dailyTSS} | TSB: ${Math.round(d.ctl - d.atl) || '-'}`;
    }).join('\n');

    const prompt = `
${SYSTEM_IDENTITY}

INSTRUCCIÓN: Realiza un ANÁLISIS CRÍTICO DE SERIES HISTÓRICAS (Deep Dive) para Jose. 
Busca patrones de desincronización autonómica, impacto de la carga en el HRV, calidad del sueño y tendencias de recuperación.

DATOS HISTÓRICOS (Día | HRV | FC | Sueño | TSS | TSB):
${dataSummary}

FORMATO DE RESPUESTA:
Usa un tono de fisiólogo deportivo. Analiza bloques de fechas (semana pico vs descarga).
Identifica cambios en el sistema autónomo (HRV vs FC).
Concluye con hallazgos reales.
NO USES MARKDOWN (negritas/cursivas). Solo texto plano, párrafos y emojis.
`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4 }
                })
            }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error analizando la serie.";
    } catch (e) {
        return "Error de conexión al analizar la serie.";
    }
}

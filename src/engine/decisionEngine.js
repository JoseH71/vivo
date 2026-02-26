/**
 * VIVO — Decision Engine v2.0
 * 
 * Capa de decisión práctica sobre el IEA v4.0.
 * NO modifica el IEA. Solo lo consume.
 * 
 * Jerarquía obligatoria:
 *   1. FA Gate (palpitaciones) → Descanso activo
 *   2. cv-HRV > 18% → Upper ligero
 *   3. Desacople autonómico → Z2 suave
 *   4. Score + TSB → Recomendación final
 * 
 * 5 estados de salida únicos:
 *   🔴 Descanso activo
 *   🟡 Z2 suave
 *   🟡 Upper ligero
 *   🟢 Intensidad controlada
 *   🟢 Libre
 * 
 * Arquitectura: Funciones puras, determinísticas, sin estado.
 */

// ── Helpers ──────────────────────

const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const calculateTrend = (last7, prev7) => {
    const current = mean(last7);
    const previous = mean(prev7);
    if (previous === 0) return { current, previous, changePct: 0, changeAbs: 0 };
    return {
        current,
        previous,
        changePct: ((current - previous) / previous) * 100,
        changeAbs: current - previous,
    };
};

// ── Recomendaciones (5 estados cerrados) ──────────────────────

const RECOMMENDATIONS = {
    rest: {
        id: 'rest',
        intensity: 'Descanso activo',
        color: 'red',
        emoji: '🔴',
    },
    z2: {
        id: 'z2',
        intensity: 'Z2 suave',
        color: 'yellow',
        emoji: '🟡',
    },
    upper: {
        id: 'upper',
        intensity: 'Upper ligero',
        color: 'yellow',
        emoji: '🟡',
    },
    controlled: {
        id: 'controlled',
        intensity: 'Intensidad controlada',
        color: 'green',
        emoji: '🟢',
    },
    free: {
        id: 'free',
        intensity: 'Libre',
        color: 'green',
        emoji: '🟢',
    },
};

// ── Mensajes técnicos (tono clínico, no alarmista) ──────────────────────

const MESSAGES = {
    faGate: 'Evento eléctrico reportado. Se limita carga autonómica.',
    cvUnstable: 'Variabilidad inestable (cv-VFC > 18%). Solo carga muscular baja.',
    decouple: 'Desacople autonómico activo. Solo aeróbico suave permitido.',
    fatigue: 'Score estructural bajo. Sistema en recuperación.',
    tsbOverload: 'Carga acumulada elevada (TSB < -20). Priorizar descarga.',
    tsbModerate: 'Carga moderada acumulada. Evitar intensidad máxima.',
    controlled: 'Sistema estable. TSB moderado. Intensidad controlada permitida.',
    free: 'Fisiología coherente. Balance de carga óptimo. Día libre.',
};

// ── Motor de Decisión Principal ──────────────────────

/**
 * Función principal del motor de decisión v2.0.
 * Jerarquía obligatoria: FA Gate > Estabilidad > Desacople > Score + TSB
 * 
 * @param {object} iea - Resultado completo del calculateIEA v4.0
 * @param {object[]} intervalsData - Datos de Intervals.icu
 * @param {string[]} symptoms - Síntomas del día
 * @returns {object} Decisión completa del día
 */
export const calculateDecision = (iea, intervalsData, symptoms = []) => {
    // ── Safe return si no hay datos ──
    if (!iea || iea.score === null || !intervalsData || intervalsData.length < 14) {
        return {
            recommendation: { ...RECOMMENDATIONS.z2, description: 'Recopilando datos...' },
            reason: 'Esperando datos suficientes para generar recomendación.',
            trends: { hrv: null, rhr: null },
            gates: { faGate: false, cvGate: false, decoupleGate: false },
        };
    }

    // ── Calcular tendencias MA7 ──
    const last7 = intervalsData.slice(0, 7);
    const prev7 = intervalsData.slice(7, 14);

    const hrvLast7 = last7.map(d => d.hrv).filter(Boolean);
    const hrvPrev7 = prev7.map(d => d.hrv).filter(Boolean);
    const rhrLast7 = last7.map(d => d.restingHR || d.rhr).filter(Boolean);
    const rhrPrev7 = prev7.map(d => d.restingHR || d.rhr).filter(Boolean);

    const hrvTrend = calculateTrend(hrvLast7, hrvPrev7);
    const rhrTrend = calculateTrend(rhrLast7, rhrPrev7);

    // ── Extraer flags del IEA v4.0 ──
    const safety = iea.details?.safety || {};
    const stability = iea.details?.stability || {};
    const tsb = parseFloat(iea.details?.load?.tsb) || 0;
    const score = iea.score;

    // ── Gates ──
    const faGate = safety.hasPalpitations || symptoms.includes('palpitaciones');
    const cvGate = stability.zone === 'unstable'; // cv-HRV > 18%
    const hrvLowGate = parseFloat(iea.details?.hrv?.zScore) < -1.0;
    const decoupleGate = safety.autonomicConflict || false;

    // ── JERARQUÍA DE DECISIÓN ──

    // 1. FA Gate → DESCANSO ACTIVO (PRIORIDAD ABSOLUTA)
    if (faGate) {
        return {
            recommendation: { ...RECOMMENDATIONS.rest, description: MESSAGES.faGate },
            reason: MESSAGES.faGate,
            trends: { hrv: { ...hrvTrend, label: 'VFC MA7' }, rhr: { ...rhrTrend, label: 'FC MA7' } },
            gates: { faGate: true, cvGate, decoupleGate },
        };
    }

    // 2. cv-HRV > 18% → UPPER LIGERO
    if (cvGate) {
        return {
            recommendation: { ...RECOMMENDATIONS.upper, description: MESSAGES.cvUnstable },
            reason: MESSAGES.cvUnstable,
            trends: { hrv: { ...hrvTrend, label: 'VFC MA7' }, rhr: { ...rhrTrend, label: 'FC MA7' } },
            gates: { faGate: false, cvGate: true, decoupleGate },
        };
    }

    // 3. Z-VFC < -1.0 o Desacople → Z2 SUAVE
    if (hrvLowGate || decoupleGate) {
        const hrvLowReason = `VFC por debajo de línea base (Z: ${iea.details.hrv.zScore}). Reserva baja.`;
        return {
            recommendation: { ...RECOMMENDATIONS.z2, description: hrvLowGate ? hrvLowReason : MESSAGES.decouple },
            reason: hrvLowGate ? hrvLowReason : MESSAGES.decouple,
            trends: { hrv: { ...hrvTrend, label: 'VFC MA7' }, rhr: { ...rhrTrend, label: 'FC MA7' } },
            gates: { faGate: false, cvGate: false, hrvLowGate, decoupleGate },
        };
    }

    // 4. Score + TSB → DECISIÓN FINAL
    let recommendation;
    let reason;

    if (score < 55) {
        recommendation = { ...RECOMMENDATIONS.rest, description: MESSAGES.fatigue };
        reason = MESSAGES.fatigue;
    } else if (score < 70) {
        recommendation = { ...RECOMMENDATIONS.z2, description: MESSAGES.tsbModerate };
        reason = 'Score en zona de adaptación. Solo aeróbico suave.';
    } else if (tsb < -20) {
        recommendation = { ...RECOMMENDATIONS.z2, description: MESSAGES.tsbOverload };
        reason = MESSAGES.tsbOverload;
    } else if (tsb < -10) {
        recommendation = { ...RECOMMENDATIONS.controlled, description: MESSAGES.controlled };
        reason = MESSAGES.controlled;
    } else {
        recommendation = { ...RECOMMENDATIONS.free, description: MESSAGES.free };
        reason = MESSAGES.free;
    }

    return {
        recommendation,
        reason,
        trends: {
            hrv: { ...hrvTrend, label: 'VFC MA7' },
            rhr: { ...rhrTrend, label: 'FC MA7' },
        },
        gates: { faGate: false, cvGate: false, decoupleGate: false },
    };
};

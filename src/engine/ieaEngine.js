/**
 * VIVO — IEA Engine v5.0 (Motor de Inteligencia Autonómica)
 * 
 * Arquitectura jerárquica con compuertas (gates):
 *   1. FA Gate (palpitaciones) → Cap 55
 *   2. Estabilidad Eléctrica (cv-HRV > 18%) → Cap 65
 *   3. Desacople Autonómico (Tipo 1 y 2) → Cap 70
 *   4. Score Estructural (Z-score 60d + pesos con suelos)
 * 
 * Filosofía: Menos reactividad, más contexto fisiológico.
 * v5.0: Filtro de 2 días para desacople y exclusión por carga previa (TSS/VI).
 * Pensado para deportista con FA vagal controlada.
 */

// ── Helpers Estadísticos ──────────────────────
const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const std = (arr) => {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (arr.length - 1));
};

const zScore = (value, arr) => {
    const m = mean(arr);
    const s = std(arr);
    if (s === 0) return 0;
    return (value - m) / s;
};

const calculateCorrelation = (x, y) => {
    if (x.length !== y.length || x.length < 5) return 0;
    const n = x.length, mux = mean(x), muy = mean(y);
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - mux, dy = y[i] - muy;
        num += dx * dy; denX += dx * dx; denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
};

// ── Módulos de Cálculo ──────────────────────

/**
 * Coeficiente de Variación (cv-HRV 7d)
 * Mide la estabilidad de la VFC en los últimos 7 días.
 * 
 * < 12%  → Estable (sin penalización)
 * 12-18% → Vigilancia (penalización moderada)
 * > 18%  → Inestable (penalización máxima, flag crítico)
 */
const calculateCvHRV = (last7, zHrv, context = {}) => {
    const { today, rhrBaseline, sleepMean7, symptoms = [] } = context;
    const hrvs = last7.map(d => d.hrv).filter(v => typeof v === 'number' && v > 0);
    if (hrvs.length < 5) return { cv: 0, penalty: 0, zone: 'stable' };
    const m = mean(hrvs), s = std(hrvs);
    const cv = (s / m) * 100;

    let penalty = 0;
    let zone = 'stable';
    let message = '';

    // Detección Inteligente v4.5 (CV Asimétrico)
    const todayRhr = today.restingHR || today.rhr || 0;
    const rhrDiff = Math.abs(todayRhr - rhrBaseline);
    const isSleepGood = today.sleepScore >= (sleepMean7 || 0);
    const noSymptoms = symptoms.length === 0;

    // 1. Rebote Vagal Probable (Mejoría)
    const isVagalPeak = zHrv > 0.8 && rhrDiff <= 1.5 && isSleepGood && noSymptoms;

    // 2. Posible Artefacto
    const isArtifact = zHrv > 1.5 && rhrDiff >= 3 && today.sleepScore < (sleepMean7 || 0);

    // Cálculo base de penalización
    if (cv > 20) {
        penalty = -12;
        zone = 'unstable';
    } else if (cv >= 12) {
        penalty = -2 + ((cv - 12) / 8) * -8;
        zone = 'vigilance';
    }

    // Aplicación de lógica asimétrica:
    if (zHrv >= 0) {
        // REGRA: Si la variabilidad es positiva (mejoría) o neutral, eliminamos penalización
        if (isVagalPeak) {
            penalty = 0;
            zone = 'adaptation';
            message = 'ADAPTACIÓN: Mejora coherente (vagal peak)';
        } else if (isArtifact) {
            penalty = 0;
            zone = 'artifact';
            message = 'AVISO: Posible artefacto de medición';
        } else {
            // Dispersión estadística por mejora (no penalizable)
            penalty = 0;
            zone = 'stable';
            message = 'Dispersión por mejora (HRV al alza)';
        }
    } else {
        // Si HRV es baja (z < 0) y CV es alto, hay inestabilidad real
        if (cv > 15 && zHrv < -0.8 && todayRhr > rhrBaseline + 2) {
            message = 'INESTABILIDAD: Depresión HRV + Desorden eléctrico';
        }
    }

    // ⚠️ ZONA FANTASMA: Saturación (Estancado)
    if (cv < 3 && zHrv < -1.0) {
        penalty = -10;
        zone = 'saturated';
        message = 'SATURACIÓN (Estancado)';
    }

    return { cv, penalty, zone, message };
};

/**
 * Pesos Dinámicos con suavizado EMA y Hard Floors v4.0
 * 
 * Suelos obligatorios:
 *   HRV: 30% (pilar dominante, FA protection)
 *   RHR: 15% (indicador secundario)
 *   Sueño: 15% (importante pero no crítico)
 *   TSB: 10% (contexto de carga)
 *   Total suelos: 70% → Margen dinámico: 30%
 */
const calculateEmaWeights = (intervalsData) => {
    const getWeightsAt = (index) => {
        const window = intervalsData.slice(index + 1, index + 29);
        const hrvSeries = window.filter(d => d.hrv && d.sleepScore && d.atl !== undefined);
        const hrv = hrvSeries.map(d => d.hrv);

        const cSleep = Math.abs(calculateCorrelation(hrv, hrvSeries.map(d => d.sleepScore)));
        const cLoad = Math.abs(calculateCorrelation(hrv, hrvSeries.map(d => d.atl)));
        const cRhr = Math.abs(calculateCorrelation(hrv, hrvSeries.map(d => d.restingHR || d.rhr)));

        const total = (cSleep + cLoad + cRhr) || 1;
        return {
            hrv: (cRhr / total) * 40,
            sleep: (cSleep / total) * 30,
            load: (cLoad / total) * 30,
            rhr: (cRhr / total) * 20
        };
    };

    // EMA (0.8 previo, 0.2 nuevo) — 7 días de suavizado
    let currentWeights = getWeightsAt(7);
    for (let i = 6; i >= 0; i--) {
        const dailyRaw = getWeightsAt(i);
        currentWeights = {
            hrv: (currentWeights.hrv * 0.8) + (dailyRaw.hrv * 0.2),
            rhr: (currentWeights.rhr * 0.8) + (dailyRaw.rhr * 0.2),
            sleep: (currentWeights.sleep * 0.8) + (dailyRaw.sleep * 0.2),
            load: (currentWeights.load * 0.8) + (dailyRaw.load * 0.2),
        };
    }

    // Hard Floors v4.0 — Aplicar ANTES de normalizar
    const floors = { hrv: 30, rhr: 15, sleep: 15, load: 10 };
    const floored = {
        hrv: Math.max(floors.hrv, currentWeights.hrv),
        rhr: Math.max(floors.rhr, currentWeights.rhr),
        sleep: Math.max(floors.sleep, currentWeights.sleep),
        load: Math.max(floors.load, currentWeights.load),
    };

    // Normalizar a 100%
    const totalFinal = floored.hrv + floored.rhr + floored.sleep + floored.load;
    return {
        hrv: (floored.hrv / totalFinal) * 100,
        rhr: (floored.rhr / totalFinal) * 100,
        sleep: (floored.sleep / totalFinal) * 100,
        load: (floored.load / totalFinal) * 100,
    };
};

// ── Puntuación por Z-Score (Escala Simétrica v4.0) ──────────────────────

/**
 * Escala simétrica conservadora:
 *   Z ≥ +0.5        → 100 puntos
 *   0 ≤ Z < +0.5    → 95 puntos
 *   0 > Z ≥ -0.5    → 85 puntos
 *   -0.5 > Z ≥ -1   → 70 puntos
 *   Z < -1           → 50 puntos
 */
const zScoreToPoints = (z) => {
    if (z >= 0.5) return 100;
    if (z >= 0) return 95;
    if (z >= -0.5) return 85;
    if (z >= -1) return 70;
    return 50;
};

/**
 * Puntuación de RHR (inversa: RHR bajo = bueno)
 * Se usa el Z-score pero invertido: Z negativo (RHR baja) es bueno.
 */
const rhrZScoreToPoints = (z) => {
    // RHR: Z negativo = pulso más bajo = bueno
    // Invertimos la lógica
    if (z <= -0.5) return 100;  // Pulso muy bajo vs baseline
    if (z <= 0) return 95;       // Pulso en media o ligeramente bajo
    if (z <= 0.5) return 85;     // Ligeramente elevado
    if (z <= 1) return 70;       // Elevado
    return 50;                    // Muy elevado
};

// ── Main Engine ──────────────────────

export const calculateIEA = (intervalsData, symptoms = [], electrolytes = {}) => {
    const safeReturn = {
        score: null, color: 'gray', label: 'Cargando...',
        message: 'Recopilando ventana estructural (mín. 30 días)...',
        alerts: [], weights: {},
        details: { hrv: {}, rhr: {}, sleep: {}, load: {}, stability: {}, safety: {} }
    };

    // Mínimo 30 días para arrancar
    if (!intervalsData || intervalsData.length < 30) return safeReturn;

    try {
        const today = intervalsData[0];
        if (!today) return safeReturn;

        const last7 = intervalsData.slice(0, Math.min(7, intervalsData.length));
        // Ventana estructural: 60 días (excluimos hoy)
        const last60 = intervalsData.slice(1, Math.min(61, intervalsData.length));

        // ── PESOS DINÁMICOS EMA ──
        let weights;
        if (intervalsData.length >= 36) {
            weights = calculateEmaWeights(intervalsData);
        } else {
            // Fallback a pesos fijos (coinciden con suelos)
            weights = { hrv: 40, rhr: 25, sleep: 20, load: 15 };
        }

        // ── Z-SCORES ESTRUCTURALES (60d) ──
        const hrvValues60 = last60.filter(d => d.hrv).map(d => d.hrv);
        const rhrValues60 = last60.filter(d => d.restingHR).map(d => d.restingHR);

        if (!hrvValues60.length || !rhrValues60.length) return safeReturn;

        const hrvMean60 = mean(hrvValues60);
        const rhrMean60 = mean(rhrValues60);
        const hrvStd60 = std(hrvValues60);
        const rhrStd60 = std(rhrValues60);

        const zHrv = zScore(today.hrv, hrvValues60);
        const zRhr = zScore(today.restingHR || today.rhr, rhrValues60);

        // Sueño (media 7d para validación de CV inteligente)
        const sleepValues7 = last7.map(d => d.sleepScore).filter(v => typeof v === 'number');
        const sleepMean7 = sleepValues7.length ? mean(sleepValues7) : 70;

        // ── ESTABILIDAD ELÉCTRICA (cv-HRV 7d) ──
        const { cv, penalty: cvPenalty, zone: cvZone, message: cvMessage } = calculateCvHRV(last7, zHrv, {
            today,
            rhrBaseline: rhrMean60,
            sleepMean7,
            symptoms
        });

        // ── DESACOPLE AUTONÓMICO v5.0 ──
        const todayRhr = today.restingHR || today.rhr || 0;
        const rhrDev = todayRhr - rhrMean60;

        // Tipo 1 (Simpático real): Más estricto v5.0
        const isDesacopleT1Today = (zHrv <= -0.8 && rhrDev >= 2.0);

        // Tipo 2 (Saturación parasimpática):
        const isDesacopleT2Today = (zHrv < -1.0 && zRhr < -1.0);

        // Regla de Confirmación (2 días) y Filtro de Contexto
        let decoupleType1 = false;
        let decoupleType2 = isDesacopleT2Today;

        const yesterday = intervalsData[1];
        if (isDesacopleT1Today && yesterday) {
            // Calculamos ayer para confirmar tendencia
            const last60Yest = intervalsData.slice(2, 62);
            const hrvVals60Yest = last60Yest.filter(d => d.hrv).map(d => d.hrv);
            const rhrVals60Yest = last60Yest.filter(d => d.restingHR).map(d => d.restingHR);

            const zHrvYest = zScore(yesterday.hrv, hrvVals60Yest);
            const yestRhr = yesterday.restingHR || yesterday.rhr || 0;
            const rhrDevYest = yestRhr - mean(rhrVals60Yest);

            const isDesacopleT1Yesterday = (zHrvYest <= -0.8 && rhrDevYest >= 2.0);

            // Filtro de contexto: Carga previa
            const hadHighLoadYest = (yesterday.tss > 80 || yesterday.vi > 1.08 || (yesterday.tags?.toLowerCase().includes('pierna')));

            if (isDesacopleT1Yesterday) {
                decoupleType1 = true; // Confirmado 2 días
            } else if (!hadHighLoadYest) {
                // Si es el primer día pero NO viene de carga alta, vigilamos pero no capeamos aún (Regra confirmación 2d)
                decoupleType1 = false;
            }
        }

        const autonomicConflict = decoupleType1 || decoupleType2;

        // ── ÍNDICE DE CONFIANZA DEL DÍA (Bonus Pro) ──
        const isDayNeutral = (Math.abs(zHrv) <= 0.6 && Math.abs(rhrDev) <= 1.5 && today.sleepScore > 70);
        const confidenceIndex = isDayNeutral ? 'ALTA (Fisiología estable)' : 'NORMAL';

        // ── PUNTUACIÓN POR MÉTRICA ──
        const hrvPoints = zScoreToPoints(zHrv);
        const rhrPoints = rhrZScoreToPoints(zRhr);

        // Sueño (28d)
        const sleepValues28 = intervalsData.slice(1, 29).filter(d => d.sleepScore).map(d => d.sleepScore);
        const sleepMean28 = sleepValues28.length ? mean(sleepValues28) : 70;
        const todaySleep = today.sleepScore || sleepMean28;
        let sleepPoints = (todaySleep >= sleepMean28) ? 100 : (todaySleep / sleepMean28) * 85;
        sleepPoints = Math.round(sleepPoints);

        // Carga (TSB)
        const tsb = (today.ctl || 0) - (today.atl || 0);
        let loadPoints;
        if (tsb >= 0) loadPoints = 100;
        else if (tsb >= -10) loadPoints = 85;
        else if (tsb >= -20) loadPoints = 65;
        else loadPoints = 40;

        // ── SCORE ESTRUCTURAL (Promedio Ponderado) ──
        let score = (
            (hrvPoints * weights.hrv) +
            (rhrPoints * weights.rhr) +
            (sleepPoints * weights.sleep) +
            (loadPoints * weights.load)
        ) / 100;

        // Aplicar penalización cv-HRV (hasta -12 puntos)
        score += cvPenalty;

        // ── JERARQUÍA DE CAPS v5.0 ──
        //   1. FA Gate (palpitaciones) → 55
        //   2. cv-HRV > 20% o Saturated → 65
        //   3. Desacople autonómico (Confirmado 2d) → 70
        //   4. VFC baja (Z < -1.0) → 75

        const hasPalpitations = symptoms.includes('palpitaciones');
        // Fasciculaciones: NO penalizan diariamente, solo tracking

        let finalScore = Math.max(0, Math.round(score));
        let capActive = false;
        let capValue = null;
        let capReason = '';

        // Cap 4: VFC baja (Z < -1.0)
        if (zHrv < -1.0) {
            finalScore = Math.min(finalScore, 75);
            capActive = true;
            capValue = 75;
            capReason = `VFC por debajo de línea base (Z: ${zHrv.toFixed(2)}). Reserva baja.`;
        }

        // Cap 3: Desacople
        if (autonomicConflict) {
            finalScore = Math.min(finalScore, 70);
            capActive = true;
            capValue = 70;
            capReason = decoupleType1
                ? 'Desacople: VFC baja + FC elevada'
                : 'Desacople: Saturación parasimpática previa';
        }

        // Cap 2: cv-HRV Crítico (sobreescribe cap 3)
        if (cvZone === 'unstable' || cvZone === 'saturated') {
            finalScore = Math.min(finalScore, 65);
            capActive = true;
            capValue = 65;
            capReason = cvZone === 'saturated'
                ? 'Zona Fantasma: Saturación Autonómica (VFC estancada)'
                : 'Desregulación Autonómica Severa (Caos eléctrico)';
        }

        // Cap 1: FA Gate — PRIORIDAD ABSOLUTA
        if (hasPalpitations) {
            finalScore = Math.min(finalScore, 55);
            capActive = true;
            capValue = 55;
            capReason = 'Evento eléctrico reportado. Se limita carga autonómica.';
        }

        // ── MA7 y BANDAS DE NORMALIDAD (±0.75σ, ventana 60d) ──
        const hrvMean7 = mean(last7.map(d => d.hrv).filter(Boolean));
        const rhrMean7 = mean(last7.map(d => d.restingHR).filter(Boolean));


        const bands = {
            hrv: {
                ma7: hrvMean7 ? +hrvMean7.toFixed(1) : null,
                today: today.hrv || null,
                mean: +hrvMean60.toFixed(1),
                lower: +(hrvMean60 - 0.75 * hrvStd60).toFixed(0),
                upper: +(hrvMean60 + 0.75 * hrvStd60).toFixed(0),
            },
            rhr: {
                ma7: rhrMean7 ? +rhrMean7.toFixed(1) : null,
                today: today.restingHR || today.rhr || null,
                mean: +rhrMean60.toFixed(1),
                lower: +(rhrMean60 - 0.75 * rhrStd60).toFixed(0),
                upper: +(rhrMean60 + 0.75 * rhrStd60).toFixed(0),
            },
        };

        // ── MEDIAS TEMPORALES (7d, 14d, 30d, 60d) ──
        const getMetricAvg = (days, key) => {
            const vals = intervalsData.slice(0, days).map(d => d[key] || (key === 'rhr' ? d.restingHR : null)).filter(v => typeof v === 'number' && v > 0);
            return vals.length ? mean(vals) : null;
        };

        const averages = {
            hrv: {
                d7: getMetricAvg(7, 'hrv'),
                d14: getMetricAvg(14, 'hrv'),
                d30: getMetricAvg(30, 'hrv'),
                d60: getMetricAvg(60, 'hrv'),
            },
            rhr: {
                d7: getMetricAvg(7, 'rhr'),
                d14: getMetricAvg(14, 'rhr'),
                d30: getMetricAvg(30, 'rhr'),
                d60: getMetricAvg(60, 'rhr'),
            },
            sleep: {
                d7: getMetricAvg(7, 'sleepScore'),
                d14: getMetricAvg(14, 'sleepScore'),
                d30: getMetricAvg(30, 'sleepScore'),
                d60: getMetricAvg(60, 'sleepScore'),
            }
        };

        // ── ALERTAS ──
        const alerts = [];
        const isDroppingTrend = hrvMean60 > 0 && hrvMean7 < hrvMean60 * 0.9;
        if (isDroppingTrend) alerts.push('Tendencia VFC a la baja (MA7 < 90% de media 60d)');
        if (decoupleType2) alerts.push('Saturación parasimpática: VFC y FC por debajo de baseline');

        // ── COLOR Y LABEL ──
        // El cap define el color, SIEMPRE.
        let color, label, message;

        if (capActive && capValue === 55) {
            color = 'red';
            label = 'FA GATE ACTIVO';
            message = capReason;
        } else if (capActive && capValue === 70) {
            color = 'yellow';
            label = 'VIGILANCIA';
            message = capReason;
        } else if (finalScore >= 70) {
            color = 'green';
            label = 'ESTABLE';
            message = 'Sistema autonómico en equilibrio. Fisiología coherente.';
        } else if (finalScore >= 55) {
            color = 'yellow';
            label = 'ADAPTACIÓN';
            message = 'Fatiga acumulada moderada. Moderar carga.';
        } else {
            color = 'red';
            label = 'FATIGA ACUMULADA';
            message = 'Score estructural bajo. Priorizar recuperación.';
        }

        // Estado provisional si < 60 días
        const isProvisional = intervalsData.length < 60;

        return {
            score: finalScore, color, label, message,
            alerts,
            weights,
            isProvisional,
            bands,
            averages,
            details: {
                hrv: { value: today.hrv, zScore: zHrv.toFixed(2), weight: weights.hrv.toFixed(1), points: hrvPoints },
                rhr: { value: today.restingHR || today.rhr, zScore: zRhr.toFixed(2), baseline: rhrMean60.toFixed(1), weight: weights.rhr.toFixed(1), points: rhrPoints },
                sleep: { value: today.sleepScore, mean28: sleepMean28.toFixed(0), weight: weights.sleep.toFixed(1), points: sleepPoints },
                load: { tsb: tsb.toFixed(0), weight: weights.load.toFixed(1), points: loadPoints },
                stability: { cv: cv.toFixed(1), penalty: cvPenalty, zone: cvZone, message: cvMessage },
                safety: {
                    hasPalpitations,
                    autonomicConflict,
                    decoupleType1, decoupleType2,
                    capActive, capValue, capReason,
                    confidenceIndex
                }
            }
        };
    } catch (err) {
        console.error('[IEA Engine v4.0] Error:', err);
        return safeReturn;
    }
};

/**
 * Calculate normality bands for HRV and RHR charts.
 * Used by TrendCharts to draw reference areas.
 */
export const calculateBands = (data) => {
    if (!data || data.length < 7) return {};

    const hrvValues = data.filter(d => d.hrv).map(d => d.hrv);
    const rhrValues = data.filter(d => d.restingHR).map(d => d.restingHR);

    const hrvM = hrvValues.length ? mean(hrvValues) : 0;
    const hrvS = hrvValues.length ? std(hrvValues) : 0;
    const rhrM = rhrValues.length ? mean(rhrValues) : 0;
    const rhrS = rhrValues.length ? std(rhrValues) : 0;

    return {
        hrvMean: Math.round(hrvM),
        hrvUpper: Math.round(hrvM + hrvS),
        hrvLower: Math.round(hrvM - hrvS),
        rhrMean: Math.round(rhrM),
        rhrUpper: Math.round(rhrM + rhrS),
        rhrLower: Math.round(rhrM - rhrS),
    };
};

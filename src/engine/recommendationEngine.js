/**
 * VIVO — Recommendation Engine v5.0
 *
 * v5.0: Modulador Mecánico DOMS — capa separada del IEA.
 * El IEA mide estabilidad autonómica. El DOMS mide fatiga periférica.
 * No se mezclan planos. El DOMS modula la PRESCRIPCION, no el score eléctrico.
 */

// --- ATHLETE PROFILE (Jose) ---
export const ATHLETE = {
    name: 'Jose',
    ftp_target: 235,
    ss_range: [197, 211],
    hr_limit: 150,
    gym_hr_limit: 90
};

// --- SST PROGRESSION LEVELS ---
const SST_LEVELS = [
    { level: 1, workout: "2 x 15' SST", work: 30, desc: "Base de volumen en zona" },
    { level: 2, workout: "2 x 18' SST", work: 36, desc: "Incremento de densidad" },
    { level: 3, workout: "2 x 20' SST", work: 40, desc: "El estándar de oro" },
    { level: 4, workout: "3 x 15' SST", work: 45, desc: "Volumen total extendido" },
    { level: 5, workout: "2 x 25' SST", work: 50, desc: "Resistencia a la fatiga" },
    { level: 6, workout: "3 x 20' SST", work: 60, desc: "Nivel Pro: 1h en zona" }
];

import { calculateIEA } from './ieaEngine';
import { getDomsLevel } from '../components/SymptomJournal';
import { getPlannedSession } from '../services/mesocycleService';

/**
 * Detecta el estado de progresión de SST basado en los últimos 21 días
 */
const getSstStatus = (intervalsData) => {
    if (!intervalsData || intervalsData.length === 0) return { current: SST_LEVELS[0], target: SST_LEVELS[0], totalDone: 0 };

    const sstSessions = [];
    for (let i = 0; i < Math.min(21, intervalsData.length); i++) {
        const day = intervalsData[i];
        if (!day || !day.activities) continue;
        for (const act of day.activities) {
            const name = (act.name || '').toLowerCase();
            const desc = (act.description || '').toLowerCase();
            if (name.includes('sst') || desc.includes('sst')) {
                sstSessions.push({
                    date: day.id,
                    duration: act.moving_time,
                    tss: act.icu_training_load || 0,
                    decoupling: act.icu_aerobic_decoupling || act.decoupling || 0
                });
            }
        }
    }

    if (sstSessions.length === 0) return { current: SST_LEVELS[0], target: SST_LEVELS[0], totalDone: 0 };

    const lastSession = sstSessions[0];
    const sessionsDone = sstSessions.length;
    const lastWorkMinutes = (lastSession.duration / 60) * 0.7;
    let currentLevelIdx = SST_LEVELS.findIndex(l => l.work >= lastWorkMinutes);
    if (currentLevelIdx === -1) currentLevelIdx = 0;

    const isSuccess = lastSession.decoupling < 5;
    const targetLevelIdx = isSuccess ? Math.min(currentLevelIdx + 1, SST_LEVELS.length - 1) : currentLevelIdx;

    return { current: SST_LEVELS[currentLevelIdx], target: SST_LEVELS[targetLevelIdx], isSuccess, totalDone: sessionsDone };
};

/**
 * ── MODULADOR MECÁNICO DOMS v1.0 ──
 *
 * Opera DESPUÉS de que el IEA haya tomado su decisión.
 * No modifica el score. Solo modifica tipo de sesión o añade aviso.
 *
 * Caso A — IEA alto + DOMS 2-3: SNA ok, chasis dañado → redirigir músculo
 * Caso B — IEA bajo  + DOMS 2-3: doble fatiga → reforzar descanso activo
 * Caso C — DOMS 1: leve → solo aviso, sin cambio de sesión
 */
const applyDomsModulator = (recommendation, domsLevel, ieaScore, plannedType) => {
    if (domsLevel === 0) return recommendation;

    const isIeaHigh = ieaScore >= 70;

    // Caso C — DOMS leve
    if (domsLevel === 1) {
        return {
            ...recommendation,
            domsAlert: {
                level: 1,
                icon: '🟡',
                title: 'DOMS Leve detectado',
                msg: 'Agujetas ligeras. Respeta la técnica y evita excederte en el volumen. El chasis está en regeneración.',
                color: 'var(--yellow)'
            }
        };
    }

    // Caso B — IEA bajo + DOMS 2-3: doble fatiga
    if (!isIeaHigh && domsLevel >= 2) {
        return {
            ...recommendation,
            workout: 'Descanso Activo: Movilidad + Caminar suave',
            tss: 0,
            color: 'red',
            domsAlert: {
                level: domsLevel,
                icon: '🔴',
                title: 'DOBLE FATIGA: Central + Periférica',
                msg: `SNA comprometido Y daño muscular ${domsLevel === 3 ? 'limitante' : 'moderado'}. Descanso activo obligatorio: movilidad suave, hidratación, magnesio.`,
                color: 'var(--red)'
            }
        };
    }

    // Caso A — IEA alto + DOMS 2-3: redirigir músculo
    if (isIeaHigh && domsLevel >= 2) {
        const isGym = plannedType === 'Gym';
        const isBike = plannedType === 'Bike' || plannedType === 'Bici';

        let redirectedWorkout = recommendation.workout;
        let redirectMsg = '';

        if (isGym) {
            redirectedWorkout = domsLevel === 3
                ? 'REST: DOMS limitante. Prioriza recuperación muscular total.'
                : 'GYM Upper Body o movilidad (evita el grupo muscular dañado)';
            redirectMsg = domsLevel === 3
                ? 'DOMS 3/3 en Gym: el tejido necesita silencio. Considera cancelar o hacer solo tren superior.'
                : 'Redirige al grupo muscular no afectado. El SNA está disponible, el chasis local no.';
        } else if (isBike) {
            redirectedWorkout = domsLevel === 3
                ? 'Z1 muy suave o descanso activo (DOMS limitante en piernas)'
                : 'Z2 suave sin picos (DOMS moderado en piernas, prioriza flujo sanguíneo)';
            redirectMsg = domsLevel === 3
                ? 'DOMS 3/3 en piernas: evita estrés mecánico. Z1 o descanso activo.'
                : 'Cadencia alta, potencia baja. El flujo sanguíneo ayuda a la regeneración sin agravar el daño.';
        }

        return {
            ...recommendation,
            workout: redirectedWorkout,
            domsAlert: {
                level: domsLevel,
                icon: domsLevel === 3 ? '🔴' : '🟠',
                title: `DOMS ${domsLevel === 3 ? 'Limitante' : 'Moderado'} — Redirección mecánica`,
                msg: redirectMsg,
                color: domsLevel === 3 ? 'var(--red)' : '#f97316'
            }
        };
    }

    return recommendation;
};

/**
 * Motor de Recomendación VIVO v5.0 — "Copiloto Bio-Sincronizado"
 * IEA 0-100 + Modulador DOMS externo.
 */
export const getDailyRecommendation = (iea, intervalsData, weeklyPlan = {}, motivation = 3, symptoms = []) => {
    if (!iea || iea.score === null || !intervalsData || (Array.isArray(intervalsData) && intervalsData.length < 2)) return null;

    const todayISO = new Date().toLocaleDateString('sv');
    const planned = getPlannedSession(todayISO);

    const readiness = iea.score;
    const { capValue, hasPalpitations } = iea.details.safety;
    const zHrv = parseFloat(iea.details.hrv.zScore) || 0;
    const tsb = parseFloat(iea.details.load.tsb) || 0;

    // Nivel DOMS — capa mecánica separada
    const domsLevel = getDomsLevel(symptoms);

    // ── CASO A: Protección Crítica ──
    const isCritical = (capValue === 55) || (hasPalpitations) || (readiness < 45) || (tsb < -30);
    if (isCritical) {
        const base = {
            title: planned.type === 'Descanso' ? 'DESCANSO PROGRAMADO' : 'AJUSTE: PRIORIDAD RECUPERACIÓN',
            color: 'red',
            stimulus: 'Protección autonómica y reseteo cardiaco',
            workout: "DESCANSO TOTAL o Movilidad muy suave (20')",
            tss: 0,
            iea: readiness,
            msg: hasPalpitations ? 'Evento eléctrico reportado.' : 'Reserva autonómica muy baja para la carga prevista.',
            strategy: 'El plan original se pospone para evitar desregulación severa. Hoy la prioridad es el silencio eléctrico.'
        };
        return applyDomsModulator(base, domsLevel, readiness, planned.type);
    }

    // ── CASO B: Ajuste Preventivo ──
    const needsAdjustment = (readiness < 70) || (capValue >= 65) || (zHrv < -0.8);
    if (needsAdjustment) {
        if (planned.type === 'Descanso') {
            const base = {
                title: 'DESCANSO PROGRAMADO',
                color: 'green',
                stimulus: 'Asimilación de carga',
                workout: 'Descanso (Hidratación + Magnesio)',
                tss: 0,
                iea: readiness,
                msg: 'Estado ideal para asimilar el trabajo previo.',
                strategy: 'Mantén el plan de descanso para recuperar frescura estructural.'
            };
            return applyDomsModulator(base, domsLevel, readiness, planned.type);
        }

        const adjustedTss = Math.round(planned.tss * 0.6);
        let adjustedWorkout = planned.title;
        if (planned.type === 'Bici') adjustedWorkout = `Z2 Suave 45-60' (Sin picos)`;
        else if (planned.type === 'Gym') adjustedWorkout = `GYM Movilidad / Poco peso (RIR 4)`;

        const base = {
            title: `AJUSTE SUGERIDO: ${planned.type}`,
            color: 'yellow',
            stimulus: 'Regulación del SNA mediante carga moderada',
            workout: adjustedWorkout,
            tss: adjustedTss,
            iea: readiness,
            msg: 'Disponibilidad autonómica moderada. Conviene reducir la dosis.',
            strategy: `El plan original (${planned.title}) se ajusta para no estresar el sistema en exceso hoy.`
        };
        return applyDomsModulator(base, domsLevel, readiness, planned.type);
    }

    // ── CASO C: Luz Verde ──
    const base = {
        title: planned.type === 'Descanso' ? 'DESCANSO PROGRAMADO' : `PLAN: ${planned.title}`,
        color: planned.type === 'Descanso' ? 'green' : 'cyan',
        stimulus: planned.type === 'Descanso' ? 'Recuperación activa' : 'Cumplimiento estructural del plan',
        workout: planned.type === 'Descanso' ? 'Descanso total' : planned.desc,
        tss: planned.tss,
        iea: readiness,
        msg: 'Fisiología en equilibrio. Luz verde para seguir el mesociclo.',
        strategy: planned.type === 'Descanso' ? 'Aprovecha para supercompensar.' : 'Mantén el foco en la técnica y el RIR propuesto.'
    };
    return applyDomsModulator(base, domsLevel, readiness, planned.type);
};

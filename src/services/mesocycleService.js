/**
 * VIVO — Mesocycle Plan Service
 * Defines the 4-week "Semana de Oro" plan and provides lookup functions.
 */

export const MESOCYCLE_START_DATE = '2026-02-16';
export const MESOCYCLE_END_DATE = '2026-03-15';

export const PLAN = {
    // SEMANA 1: ADAPTACIÓN CONTROLADA (Azul)
    '2026-02-16': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A (Pierna + Espalda)', tss: 55,
        desc: 'Consolidar técnica y resetear sistema.',
        exercises: [
            'Prensa Matrix: 4×8 (RIR 2)', 'Cuádriceps unilateral: 3×10 (RIR 2)',
            'Femoral máquina: 3×10 (RIR 2)', 'Adductor máquina: 2×12 (RIR 2)',
            'Jalón al pecho: 4×8–10 (RIR 2)', 'Remo máquina: 3×10 (RIR 2)',
            'Gemelo prensa: 4×10 (RIR 2)', 'Core: 3×15'
        ]
    },
    '2026-02-17': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Recuperación autonómica. Movilidad suave opcional.', tss: 0 },
    '2026-02-18': { type: 'Bici', icon: 'Zap', title: 'BICI (SST 2×15’)', desc: '10’ Cal + 15\'@210W + 5\' Rec + 15\'@210W + 15\' Z2 + 5\' Enf.', tss: 55 },
    '2026-02-19': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B (Torso + Brazos)', tss: 45,
        desc: 'Enfoque en volumen de torso.',
        exercises: [
            'Press banca: 3×8–10', 'Press inclinado: 3×10',
            'Jalón agarre distinto: 3×10', 'Elevaciones laterales: 4×12',
            'Curl bíceps: 3×12', 'Tríceps máquina: 3×12',
            'Gemelo sentado: 4×12', 'Core: 3×15'
        ]
    },
    '2026-02-20': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Reset previo al fin de semana.', tss: 0 },
    '2026-02-21': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C (Cadena Posterior)', tss: 40,
        desc: 'Hip Thrust y técnica de cadena posterior.',
        exercises: [
            'Hip thrust máquina: 3×10', 'Femoral máquina: 3×10',
            'Abductor máquina: 3×12', 'Adductor máquina: 2×12',
            'Hombro posterior (Face pull): 3×12', 'Gemelo: 4×12–15', 'Core: 3×15'
        ]
    },
    '2026-02-22': { type: 'Bici', icon: 'Bike', title: 'BICI (Largo Z2 - 2h)', desc: '10’ Cal + 100’ @ 150–165 W + 10’ Enf.', tss: 85 },

    // SEMANA 2: PROGRESIÓN DE CARGA (Verde)
    '2026-02-23': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A (Progresión)', tss: 60,
        desc: 'Incrementar volumen en pierna (5 series).',
        exercises: [
            'Prensa Matrix: 5×8 (RIR 2)', 'Cuádriceps unilateral: 3×10',
            'Femoral máquina: 3×10', 'Adductor máquina: 2×12',
            'Jalón al pecho: 4×8–10', 'Remo máquina: 3×10',
            'Gemelo prensa: 4×10', 'Core: 3×15'
        ]
    },
    '2026-02-24': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Asimilación de carga.', tss: 0 },
    '2026-02-25': { type: 'Bici', icon: 'Zap', title: 'BICI (SST 3×15’)', desc: '10’ Cal + 3×15’ @ 210 W (Rec. 5\') + 10’ Enf.', tss: 70 },
    '2026-02-26': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B (Torso + Brazos)', tss: 45,
        desc: 'Continuidad en volumen de torso.',
        exercises: [
            'Press banca: 3×8–10', 'Press inclinado: 3×10',
            'Jalón agarre distinto: 3×10', 'Elevaciones laterales: 4×12',
            'Curl bíceps: 3×12', 'Tríceps máquina: 3×12',
            'Gemelo sentado: 4×12', 'Core: 3×15'
        ]
    },
    '2026-02-27': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: '-', tss: 0 },
    '2026-02-28': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C (Cadena Posterior)', tss: 40,
        desc: 'Mantener control de tempo.',
        exercises: [
            'Hip thrust máquina: 3×10', 'Femoral máquina: 3×10',
            'Abductor máquina: 3×12', 'Adductor máquina: 2×12',
            'Hombro posterior: 3×12', 'Gemelo: 4×12–15', 'Core: 3×15'
        ]
    },
    '2026-03-01': { type: 'Bici', icon: 'Bike', title: 'BICI (Largo Z2 - 2h15m)', desc: '10’ Cal + 115’ @ 150–165 W + 10’ Enf.', tss: 95 },

    // SEMANA 3: PICO CONTROLADO (Amarillo)
    '2026-03-02': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A (Pico)', tss: 60,
        desc: 'Máximo volumen mensual. Vigilancia VFC.',
        exercises: [
            'Prensa Matrix: 5×8 (RIR 2)', 'Cuádriceps máquina: 3×10',
            'Femoral máquina: 3×10', 'Adductor máquina: 2×12',
            'Jalón al pecho: 4×8–10', 'Remo máquina: 3×10',
            'Gemelo prensa: 4×10', 'Core: 3×15'
        ]
    },
    '2026-03-03': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Recuperación estratégica.', tss: 0 },
    '2026-03-04': { type: 'Bici', icon: 'Zap', title: 'BICI (SST 2×20’)', desc: '10’ Cal + 20’ @ 212 W + 5’ Rec + 20’ @ 212 W + 15’ Z2 + 5’ Enf.', tss: 80 },
    '2026-03-05': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B (Torso+Brazos)', tss: 45,
        desc: 'Foco máximo acumulado.',
        exercises: [
            'Press banca: 3×8–10', 'Press inclinado: 3×10',
            'Jalón agarre distinto: 3×10', 'Elevaciones laterales: 4×12',
            'Curl bíceps: 3×12', 'Tríceps máquina: 3×12',
            'Gemelo sentado: 4×12', 'Core: 3×15'
        ]
    },
    '2026-03-06': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Reset pre-fin de semana.', tss: 0 },
    '2026-03-07': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C (Cadena Posterior)', tss: 40,
        desc: 'Hip thrust pesado técnica.',
        exercises: [
            'Hip thrust máquina: 3×10', 'Femoral máquina: 3×10',
            'Abductor máquina: 3×12', 'Adductor máquina: 2×12',
            'Hombro posterior: 3×12', 'Gemelo: 4×12–15', 'Core: 3×15'
        ]
    },
    '2026-03-08': { type: 'Bici', icon: 'Bike', title: 'BICI (Largo Z2 - 2h30m)', desc: '10’ Cal + 130’ @ 150–165 W + 10’ Enf.', tss: 105 },

    // SEMANA 4: DESCARGA REAL (Rojo)
    '2026-03-09': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A (Descarga)', tss: 35,
        desc: '-30% volumen. Limpiar fatiga.',
        exercises: [
            'Prensa: 3×8', 'Cuádriceps: 2×10',
            'Femoral: 2×10', 'Jalón: 2×10',
            'Remo: 2×10', 'Gemelo: 3×10', 'Core: 2×15'
        ]
    },
    '2026-03-10': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Supercompensación activa.', tss: 0 },
    '2026-03-11': { type: 'Bici', icon: 'Bike', title: 'BICI (Mantenimiento)', desc: '60’ @ 160 W (Z2 baja). Cero series.', tss: 45 },
    '2026-03-12': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B (Descarga)', tss: 30,
        desc: 'Foco en técnica y recuperación.',
        exercises: [
            'Press banca: 2×10', 'Jalón agarre distinto: 2×10',
            'Elevaciones laterales: 2×12', 'Bíceps/Tríceps: 2 series c/u',
            'Gemelo sentado: 3×12'
        ]
    },
    '2026-03-13': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', desc: 'Asimilación final.', tss: 0 },
    '2026-03-14': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C (Descarga)', tss: 30,
        desc: 'Movilidad y técnica ligera.',
        exercises: [
            'Hip thrust: 2×10', 'Femoral: 2×10',
            'Abductor/Adductor: 2 series c/u', 'Gemelo: 3×12'
        ]
    },
    '2026-03-15': { type: 'Bici', icon: 'Bike', title: 'BICI (Largo corto Z2)', desc: '105’ @ 150 W (Z2 suave).', tss: 70 },
};

export const getColorForType = (type) => {
    switch (type) {
        case 'Bici': return '#22d3ee';    // cyan vivo
        case 'Gym': return '#06b6d4';     // cyan
        case 'Descanso': return '#60a5fa'; // azul brillante
        default: return '#475569';
    }
};

export const getWeekForDate = (dateStr) => {
    const date = new Date(dateStr);
    const start = new Date(MESOCYCLE_START_DATE);
    const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24 * 7));
    return diff + 1;
};

export const getPlannedSession = (dateStr) => {
    return PLAN[dateStr] || { type: 'Descanso', title: 'Fuera de Plan', desc: '-', tss: 0 };
};

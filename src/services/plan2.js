
export const PLAN2 = {
    // SEMANA 1 — REACTIVACIÓN (16 - 22 MAR)
    '2026-03-16': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A (Pierna + Espalda)', tss: 55, durationStr: '65 min',
        desc: 'Objetivo: reactivar fuerza de piernas.',
        exercises: [
            'Prensa Matrix: 4×8 (30 kg)', 
            'Cuádriceps máquina: 3×10 (14 kg)',
            'Femoral máquina: 3×10 (43 kg)',
            'Adductor: 2×12 (36 kg)',
            'Jalón al pecho: 4×8 (36 kg)',
            'Remo máquina: 3×10 (29 kg)',
            'Gemelo prensa: 4×12 (30 kg)',
            'Core: 3×15 (5 kg)'
        ]
    },
    '2026-03-17': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO TOTAL', tss: 0, durationStr: '—', desc: 'Movilidad opcional. Objetivo: estabilidad autonómica.' },
    '2026-03-18': { 
        type: 'Bici', icon: 'Zap', title: 'BICI SST PROGRESIVO', tss: 75, durationStr: '1h25',
        desc: "10' calentar + 15' 210W + 5' recuperación + 15' 212W + 5' recuperación + 12' 215W + 15' Z2 160W + 5' enfriar. Objetivo: tolerancia al sub-umbral."
    },
    '2026-03-19': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B (Torso + Brazos)', tss: 45, durationStr: '60 min',
        desc: 'Objetivo: hipertrofia hombros.',
        exercises: [
            'Press banca: 3×8 (30 kg)',
            'Press inclinado: 3×10 (30 kg)',
            'Jalón agarre neutro: 3×10 (36 kg)',
            'Elevaciones laterales: 4×12 (7 kg)',
            'Curl bíceps: 3×12 (9 kg)',
            'Tríceps máquina: 3×12 (43 kg)',
            'Gemelo sentado: 4×12 (30 kg)',
            'Core: 3×15'
        ]
    },
    '2026-03-20': { type: 'Bici', icon: 'Zap', title: 'BICI Z2 + SPRINTS', tss: 40, durationStr: '1h05', desc: "65' @ 155 W. Durante sesión: 6×8'' sprints. Objetivo: activación neuromuscular." },
    '2026-03-21': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C (Cadena Posterior)', tss: 40, durationStr: '60 min',
        desc: 'Objetivo: estabilidad posterior.',
        exercises: [
            'Hip thrust máquina: 3×10 (10 kg)',
            'Femoral máquina: 3×10 (43 kg)',
            'Abductor: 3×12 (36 kg)',
            'Adductor: 2×12 (36 kg)',
            'Remo sentado agarre ancho: 3×12 (23 kg)',
            'Gemelo máquina: 4×15 (30 kg)',
            'Core: 3×15'
        ]
    },
    '2026-03-22': { type: 'Bici', icon: 'Bike', title: 'BICI Z2 LARGA', tss: 95, durationStr: '2h30', desc: "90' @ 155 W. Puerto: 20' 170 W. Resto Z2. Objetivo: expansión aeróbica." },

    // SEMANA 2 — EXPANSIÓN AERÓBICA (23 - 29 MAR)
    '2026-03-23': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A', tss: 60, durationStr: '65 min',
        desc: 'Objetivo: progresión de fuerza.',
        exercises: [
            'Prensa: 5×8 (32 kg)',
            'Cuádriceps máquina: 3×10 (14 kg)',
            'Femoral: 3×10 (45 kg)',
            'Adductor: 2×12 (36 kg)',
            'Jalón: 4×8 (38 kg)',
            'Remo máquina: 3×10 (30 kg)',
            'Gemelo prensa: 4×12 (32 kg)',
            'Core'
        ]
    },
    '2026-03-24': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO', tss: 0, durationStr: '—', desc: '' },
    '2026-03-25': { 
        type: 'Bici', icon: 'Zap', title: 'BICI SST LARGO', tss: 85, durationStr: '1h30',
        desc: "10' calentamiento + 22' 212W + 6' recuperación + 22' 218W + 15' Z2 + 5' enfriar. Objetivo: aumentar tiempo cercano al FTP."
    },
    '2026-03-26': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B', tss: 45, durationStr: '60 min',
        desc: 'Objetivo: hipertrofia hombro lateral.',
        exercises: [
            'Press banca: 3×8 (32 kg)',
            'Press inclinado: 3×10 (30 kg)',
            'Jalón: 3×10 (38 kg)',
            'Elevaciones laterales: 5×12 (7 kg)',
            'Curl bíceps: 3×12 (9 kg)',
            'Tríceps máquina: 3×12 (45 kg)',
            'Gemelo sentado: 4×12 (32 kg)'
        ]
    },
    '2026-03-27': { type: 'Bici', icon: 'Zap', title: 'BICI Z2 CADENCIA', tss: 45, durationStr: '1h15', desc: "75' @ 155 W + 6×1' 110 rpm. Objetivo: eficiencia neuromuscular." },
    '2026-03-28': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C', tss: 40, durationStr: '60 min',
        desc: 'Objetivo: estabilidad posterior.',
        exercises: [
            'Hip thrust: 3×10 (12 kg)',
            'Femoral: 3×10 (45 kg)',
            'Abductor: 3×12 (36 kg)',
            'Remo sentado ancho: 3×12 (23 kg)',
            'Gemelo máquina: 4×15 (32 kg)'
        ]
    },
    '2026-03-29': { type: 'Bici', icon: 'Bike', title: 'BICI Z2 LARGA', tss: 110, durationStr: '2h50', desc: "Z2 155-165 W + Puerto: 25' 175 W. Objetivo: eficiencia metabólica." },

    // SEMANA 3 — PICO CONTROLADO (30 MAR - 5 ABR)
    '2026-03-30': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A', tss: 60, durationStr: '65 min',
        desc: '',
        exercises: [
            'Prensa: 5×8 (34 kg)',
            'Cuádriceps máquina: 3×10 (16 kg)',
            'Femoral: 3×10 (47 kg)',
            'Jalón: 4×8 (40 kg)',
            'Remo: 3×10 (32 kg)',
            'Gemelo prensa: 4×12 (34 kg)'
        ]
    },
    '2026-03-31': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO', tss: 0, durationStr: '—', desc: '' },
    '2026-04-01': { 
        type: 'Bici', icon: 'Zap', title: 'BICI SST 3x18', tss: 95, durationStr: '1h35',
        desc: "10' calentar + 18' 215W + 5' rec + 18' 218W + 5' rec + 18' 220W + 10' enfriar. Objetivo: máximo tiempo SST."
    },
    '2026-04-02': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B', tss: 45, durationStr: '60 min',
        desc: '',
        exercises: [
            'Press banca: 3×8 (34 kg)',
            'Press inclinado: 3×10 (32 kg)',
            'Jalón: 3×10 (40 kg)',
            'Elevaciones laterales: 5×12 (8 kg)',
            'Curl bíceps: 3×12 (10 kg)',
            'Tríceps máquina: 3×12 (47 kg)',
            'Gemelo sentado: 4×12 (34 kg)'
        ]
    },
    '2026-04-03': { type: 'Bici', icon: 'Bike', title: 'BICI Z2', tss: 45, durationStr: '1h15', desc: "75' @ 160 W. Objetivo: volumen aeróbico." },
    '2026-04-04': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C', tss: 40, durationStr: '60 min',
        desc: '',
        exercises: [
            'Hip thrust: 3×10 (15 kg)',
            'Femoral: 3×10 (47 kg)',
            'Abductor: 3×12 (36 kg)',
            'Remo sentado ancho: 3×12 (25 kg)',
            'Gemelo máquina: 4×15 (34 kg)'
        ]
    },
    '2026-04-05': { type: 'Bici', icon: 'Bike', title: 'BICI Z2 ULTRA LARGA', tss: 125, durationStr: '3h10', desc: "Z2 155-165 W + 2 puertos: 20' 175 W, 15' 170 W. Objetivo: estímulo mitocondrial fuerte." },

    // SEMANA 4 — DESCARGA (6 - 12 ABR)
    '2026-04-06': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM A DESCARGA', tss: 35, durationStr: '50 min',
        desc: '',
        exercises: [
            'Prensa: 3×8 (26 kg)',
            'Cuádriceps: 2×10 (12 kg)',
            'Femoral: 2×10 (40 kg)',
            'Jalón: 2×10 (32 kg)',
            'Gemelo: 3×12 (28 kg)'
        ]
    },
    '2026-04-07': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO', tss: 0, durationStr: '—', desc: '' },
    '2026-04-08': { type: 'Bici', icon: 'Bike', title: 'BICI Z2', tss: 45, durationStr: '1h', desc: "60' @ 150 W." },
    '2026-04-09': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM B DESCARGA', tss: 30, durationStr: '45 min',
        desc: '',
        exercises: [
            'Press banca: 2×10 (28 kg)',
            'Elevaciones laterales: 2×12 (6 kg)',
            'Curl: 2×12 (8 kg)',
            'Tríceps: 2×12 (40 kg)'
        ]
    },
    '2026-04-10': { type: 'Descanso', icon: 'Moon', title: 'DESCANSO', tss: 0, durationStr: '—', desc: '' },
    '2026-04-11': {
        type: 'Gym', icon: 'Dumbbell', title: 'GYM C DESCARGA', tss: 30, durationStr: '45 min',
        desc: '',
        exercises: [
            'Hip thrust: 2×10 (10 kg)',
            'Femoral: 2×10 (40 kg)',
            'Gemelo: 3×12 (28 kg)'
        ]
    },
    '2026-04-12': { type: 'Bici', icon: 'Bike', title: 'BICI Z2 SUAVE', tss: 80, durationStr: '2h', desc: "Z2 150 W." },
};

/**
 * VIVO — Mesocycle Firestore Service v1.0
 * Gestión dinámica de mesociclos en Firestore.
 * Reemplaza el plan hardcodeado de mesocycleService.js
 */
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, APP_ID, SHARED_USER_ID } from '../config/firebase';
import { PLAN as LEGACY_PLAN, MESOCYCLE_START_DATE, MESOCYCLE_END_DATE } from './mesocycleService';
import { PLAN2 } from './plan2';

const MESO_PATH = `artifacts/${APP_ID}/users/${SHARED_USER_ID}/mesocycles`;

// ── Crear o actualizar un mesociclo ──
export const saveMesocycle = async (mesocycle) => {
    if (!db) return;
    const id = mesocycle.id || `meso_${Date.now()}`;
    const data = {
        ...mesocycle,
        id,
        updatedAt: Date.now(),
    };
    await setDoc(doc(db, MESO_PATH, id), data);
    return id;
};

// ── Obtener todos los mesociclos ──
export const getAllMesocycles = async () => {
    if (!db) return [];
    try {
        const snap = await getDocs(query(collection(db, MESO_PATH), orderBy('startDate', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.warn('[Meso] Error loading mesocycles:', e);
        return [];
    }
};

// ── Obtener el mesociclo activo (la fecha de hoy cae dentro) ──
export const getActiveMesocycle = async () => {
    const all = await getAllMesocycles();
    const today = new Date().toLocaleDateString('sv');
    return all.find(m => today >= m.startDate && today <= m.endDate) || null;
};

// ── Eliminar un mesociclo ──
export const deleteMesocycle = async (id) => {
    if (!db) return;
    await deleteDoc(doc(db, MESO_PATH, id));
};

// ── Obtener sesión planificada para una fecha ──
export const getPlannedSessionFromMesocycle = (mesocycle, dateStr) => {
    if (!mesocycle?.sessions) return null;
    return mesocycle.sessions[dateStr] || null;
};

// ── Migrar el plan legacy hardcodeado a Firestore ──
export const migrateLegacyPlan = async () => {
    if (!db) return null;

    // Check if already migrated
    const existing = await getAllMesocycles();
    const alreadyMigrated = existing.some(m => m.id === 'legacy_semana_oro');
    if (alreadyMigrated) return existing.find(m => m.id === 'legacy_semana_oro');

    const mesocycle = {
        id: 'legacy_semana_oro',
        name: 'Semana de Oro',
        startDate: MESOCYCLE_START_DATE,
        endDate: MESOCYCLE_END_DATE,
        weeks: 4,
        weekLabels: ['Adaptación', 'Progresión', 'Pico', 'Descarga'],
        weekColors: ['#3b82f6', '#22c55e', '#eab308', '#ef4444'],
        sessions: LEGACY_PLAN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await saveMesocycle(mesocycle);
    return mesocycle;
};

// ── Crear un mesociclo en blanco de N semanas ──
export const createBlankMesocycle = (name, startDate, weeks = 4) => {
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + (weeks * 7) - 1);

    const sessions = {};
    for (let i = 0; i < weeks * 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = d.toLocaleDateString('sv');
        sessions[iso] = {
            type: 'Descanso',
            icon: 'Moon',
            title: 'Sin asignar',
            desc: '',
            tss: 0,
        };
    }

    return {
        id: `meso_${Date.now()}`,
        name,
        startDate: start.toLocaleDateString('sv'),
        endDate: endDate.toLocaleDateString('sv'),
        weeks,
        weekLabels: Array.from({ length: weeks }, (_, i) => `Semana ${i + 1}`),
        weekColors: ['#3b82f6', '#22c55e', '#eab308', '#ef4444'].slice(0, weeks),
        sessions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
};

// ── Sembrar el Plan Maestro v5.0 ──
export const seedPlanMaestroV5 = async () => {
    if (!db) return;
    const mesocycle = {
        id: 'plan_maestro_v5',
        name: 'PLAN MAESTRO v5.0',
        startDate: '2026-03-16',
        endDate: '2026-04-12',
        weeks: 4,
        weekLabels: ['Reactivación', 'Expansión', 'Pico', 'Descarga'],
        weekColors: ['#3b82f6', '#22c55e', '#eab308', '#ef4444'],
        sessions: PLAN2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    await saveMesocycle(mesocycle);
    return mesocycle;
};

// ── Tipos de sesión disponibles ──
export const SESSION_TYPES = [
    { type: 'Bici', icon: 'Bike', color: '#22d3ee', label: 'Bici' },
    { type: 'Gym', icon: 'Dumbbell', color: '#06b6d4', label: 'Gym' },
    { type: 'Descanso', icon: 'Moon', color: '#60a5fa', label: 'Descanso' },
];

/**
 * VIVO — Symptom History Service v1.0
 * Historial de check-ins diarios (síntomas, DOMS, motivación, electrolitos)
 * Permite consultar patrones a lo largo del tiempo.
 */
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, APP_ID, SHARED_USER_ID } from '../config/firebase';

const DAILY_PATH = `artifacts/${APP_ID}/users/${SHARED_USER_ID}/daily`;

// ── Obtener historial de check-ins (últimos N días) ──
export const getSymptomHistory = async (maxDays = 30) => {
    if (!db) return getLocalHistory(maxDays);

    try {
        const snap = await getDocs(
            query(collection(db, DAILY_PATH), orderBy('lastUpdated', 'desc'), limit(maxDays))
        );
        const history = snap.docs.map(d => ({
            date: d.id,
            ...d.data(),
        }));
        return history.sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
        console.warn('[SymptomHistory] Firestore error, falling back to localStorage:', e);
        return getLocalHistory(maxDays);
    }
};

// ── Fallback: leer del localStorage ──
const getLocalHistory = (maxDays) => {
    const history = [];
    const today = new Date();
    for (let i = 0; i < maxDays; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toLocaleDateString('sv');
        const key = `vivo_daily_${iso}`;
        const data = localStorage.getItem(key);
        if (data) {
            try {
                history.push({ date: iso, ...JSON.parse(data) });
            } catch (e) { /* skip corrupt entry */ }
        }
    }
    return history;
};

// ── Extraer estadísticas de síntomas ──
export const getSymptomStats = (history) => {
    const symptomCounts = {};
    const domsTrend = [];
    const motivationTrend = [];

    history.forEach(day => {
        // Count symptoms
        if (day.symptoms && Array.isArray(day.symptoms)) {
            day.symptoms.forEach(s => {
                if (s && !s.startsWith('doms_')) {
                    symptomCounts[s] = (symptomCounts[s] || 0) + 1;
                }
            });
        }

        // DOMS trend
        const domsTag = day.symptoms?.find(s => s?.startsWith?.('doms_'));
        const domsLevel = domsTag ? parseInt(domsTag.split('_')[1], 10) : 0;
        domsTrend.push({ date: day.date, level: domsLevel });

        // Motivation trend
        if (day.motivation != null) {
            motivationTrend.push({ date: day.date, value: day.motivation });
        }
    });

    // Sort by frequency
    const topSymptoms = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({ id, count, pct: Math.round((count / history.length) * 100) }));

    return {
        totalDays: history.length,
        topSymptoms,
        domsTrend: domsTrend.reverse(),
        motivationTrend: motivationTrend.reverse(),
        avgMotivation: motivationTrend.length
            ? (motivationTrend.reduce((s, m) => s + m.value, 0) / motivationTrend.length).toFixed(1)
            : null,
    };
};

// ── Labels legibles por humanos ──
export const SYMPTOM_LABELS = {
    bien: '✨ Me siento bien',
    descansado: '😴 Descansado',
    motivado: '🔥 Motivado',
    estres_alto: '😤 Estrés alto',
    digestion_pesada: '🫃 Digestión pesada',
    cena_copiosa: '🍽️ Cena copiosa',
    insomnio: '😵 Dormí mal',
};

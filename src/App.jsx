/**
 * VIVO — Motor de Decisión Autonómica
 * v4.0
 */
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, APP_ID, SHARED_USER_ID } from './config/firebase';
import { fetchIntervalsData } from './services/intervalsService';
import { fetchVivoAnalysis } from './services/geminiService';
import { calculateIEA } from './engine/ieaEngine';
import { calculateDecision } from './engine/decisionEngine';
import { getDailyRecommendation } from './engine/recommendationEngine';
import { getActiveMesocycle, seedPlanMaestroV5, getAllMesocycles } from './services/mesocycleFirestoreService';
import { requestNotificationPermission, isNotificationEnabled, scheduleLocalReminder, getReminderConfig } from './services/notificationService';
import { Bell, BellOff } from 'lucide-react';

// Components
import Semaphore from './components/Semaphore';
import BioMetrics from './components/BioMetrics';
import DecisionCard from './components/DecisionCard';
import IEAIntelligenceCard from './components/IEAIntelligenceCard';
import NormalityBands from './components/NormalityBands';
import AveragesCard from './components/AveragesCard';

// Lazy-loaded tabs (code-splitting)
const MetricsHistory = lazy(() => import('./components/MetricsHistory'));
const AIAnalysis = lazy(() => import('./components/AIAnalysis'));
const CoachHub = lazy(() => import('./components/Coach/CoachHub'));

const TabFallback = () => (
    <div className="flex-center animate-fade-in" style={{ padding: '4rem 0', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} />
        <p className="text-xs font-black text-muted uppercase tracking-widest">Cargando…</p>
    </div>
);

// Icons
import {
    Activity, BarChart3, Droplets, Brain,
    RefreshCw, Loader2, Wifi, WifiOff, Maximize, Minimize, Clipboard, Check,
    ClipboardCheck, Palette
} from 'lucide-react';
import { generateCoachReport } from './services/reportService';

const todayISO = () => new Date().toLocaleDateString('sv');

function App() {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    const [intervalsData, setIntervalsData] = useState(null);
    const [intervalsLoading, setIntervalsLoading] = useState(false);
    const [intervalsError, setIntervalsError] = useState(null);
    const [symptoms, setSymptoms] = useState(() => {
        const local = localStorage.getItem(`vivo_daily_${todayISO()}`);
        return local ? JSON.parse(local).symptoms || [] : [];
    });
    const [electrolytes, setElectrolytes] = useState(() => {
        const local = localStorage.getItem(`vivo_daily_${todayISO()}`);
        return local ? JSON.parse(local).electrolytes || {} : {};
    });
    const [symptomsSaved, setSymptomsSaved] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(() => {
        const local = localStorage.getItem(`vivo_daily_${todayISO()}`);
        return local ? JSON.parse(local).aiAnalysis || '' : '';
    });
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('vivo_activeTab') || 'dashboard');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [weeklyPlan, setWeeklyPlan] = useState({});
    const [motivation, setMotivation] = useState(3);
    const [showZScoreInfo, setShowZScoreInfo] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('vivo_theme') || 'default');
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(isNotificationEnabled());
    const [activeMesocycleData, setActiveMesocycleData] = useState(null);
    const [allMesocycles, setAllMesocycles] = useState([]);

    const THEMES = [
        { id: 'default', name: 'Dark Glass', bg: '#0a0a0f', accent: '#3b82f6', desc: 'Original' },
        { id: 'midnight', name: 'Midnight', bg: '#020617', accent: '#0ea5e9', desc: 'Azul profundo' },
        { id: 'cyberpunk', name: 'Cyberpunk', bg: '#000000', accent: '#ff00ff', desc: 'Neón futurista' },
        { id: 'forest', name: 'Bosque', bg: '#0a1208', accent: '#22c55e', desc: 'Verde natural' },
        { id: 'ember', name: 'Ember', bg: '#0f0806', accent: '#f97316', desc: 'Fuego cálido' },
        { id: 'aurora', name: 'Aurora', bg: '#050510', accent: '#a78bfa', desc: 'Violeta boreal' },
        { id: 'stealth', name: 'Stealth', bg: '#000000', accent: '#737373', desc: 'Monocromo' },
        { id: 'blood', name: 'Blood Moon', bg: '#0a0505', accent: '#dc2626', desc: 'Rojo intenso' },
        { id: 'ocean', name: 'Ocean', bg: '#03070f', accent: '#0284c7', desc: 'Azul oceánico' },
        { id: 'gold', name: 'Gold', bg: '#050505', accent: '#fbbf24', desc: 'Premium Oro' },
        { id: 'deeppurple', name: 'Purple', bg: '#0a0510', accent: '#a855f7', desc: 'Púrpura profundo' },
        { id: 'nordic', name: 'Nordic', bg: '#f3f4f6', accent: '#3b82f6', desc: 'Blanco limpio' },
        { id: 'terminal', name: 'Terminal', bg: '#0a0a0a', accent: '#00ff41', desc: 'Retro hacker' },
        { id: 'sunset', name: 'Sunset', bg: '#0f172a', accent: '#f43f5e', desc: 'Atardecer' },
        { id: 'zen', name: 'Zen', bg: '#27272a', accent: '#a1a1aa', desc: 'Relajado' },
        { id: 'copper', name: 'Copper', bg: '#0c0806', accent: '#d4845e', desc: 'Cobre artesanal' },
        { id: 'matrix', name: 'Matrix', bg: '#000800', accent: '#00ff00', desc: 'Código verde' },
        { id: 'sakura', name: 'Sakura', bg: '#0f0a0c', accent: '#f472b6', desc: 'Rosa japonés' },
        { id: 'arctic', name: 'Arctic', bg: '#0a1015', accent: '#67e8f9', desc: 'Ártico helado' },
        { id: 'neontokyo', name: 'Neon Tokyo', bg: '#05000a', accent: '#e879f9', desc: 'Tokio de noche' },
        { id: 'desert', name: 'Desert', bg: '#0f0c08', accent: '#d6a756', desc: 'Arena dorada' },
    ];

    // Custom theme state
    const [customBg, setCustomBg] = useState(() => localStorage.getItem('vivo_custom_bg') || '#0a0a0f');
    const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('vivo_custom_accent') || '#06b6d4');
    const [showCustomEditor, setShowCustomEditor] = useState(false);

    const applyTheme = useCallback((themeId) => {
        // Remove any previous custom CSS
        const oldCustomStyle = document.getElementById('vivo-custom-theme');
        if (oldCustomStyle) oldCustomStyle.remove();

        if (themeId === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else if (themeId === 'custom') {
            document.documentElement.setAttribute('data-theme', 'custom');
            applyCustomThemeCSS(customBg, customAccent);
        } else {
            document.documentElement.setAttribute('data-theme', themeId);
        }
        setCurrentTheme(themeId);
        localStorage.setItem('vivo_theme', themeId);
    }, [customBg, customAccent]);

    const applyCustomThemeCSS = useCallback((bg, accent) => {
        // Remove old custom style
        const old = document.getElementById('vivo-custom-theme');
        if (old) old.remove();

        // Derive colors from accent
        const lighten = (hex, amt) => {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = Math.min(255, (num >> 16) + amt);
            const g = Math.min(255, ((num >> 8) & 0xff) + amt);
            const b = Math.min(255, (num & 0xff) + amt);
            return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
        };
        const darken = (hex, amt) => lighten(hex, -amt);
        const withAlpha = (hex, alpha) => {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = (num >> 16) & 0xff;
            const g = (num >> 8) & 0xff;
            const b = num & 0xff;
            return `rgba(${r},${g},${b},${alpha})`;
        };

        // Detect if bg is light
        const bgNum = parseInt(bg.replace('#', ''), 16);
        const bgLum = ((bgNum >> 16) * 0.299 + ((bgNum >> 8) & 0xff) * 0.587 + (bgNum & 0xff) * 0.114);
        const isLight = bgLum > 128;

        const css = `
[data-theme="custom"] {
    --bg-primary: ${bg};
    --bg-secondary: ${isLight ? lighten(bg, -10) : lighten(bg, 8)};
    --bg-card: ${isLight ? lighten(bg, -5) : lighten(bg, 12)};
    --bg-card-hover: ${isLight ? lighten(bg, -15) : lighten(bg, 20)};
    --bg-elevated: ${isLight ? '#ffffff' : lighten(bg, 15)};
    --green: ${accent};
    --blue: ${accent};
    --purple: ${darken(accent, 30)};
    --cyan: ${lighten(accent, 40)};
    --text-primary: ${isLight ? '#111827' : '#f1f5f9'};
    --text-secondary: ${isLight ? '#4b5563' : lighten(accent, 60)};
    --text-muted: ${isLight ? '#9ca3af' : darken(accent, 60)};
    --border: ${withAlpha(accent, 0.15)};
    --border-hover: ${withAlpha(accent, 0.35)};
}`;

        const style = document.createElement('style');
        style.id = 'vivo-custom-theme';
        style.textContent = css;
        document.head.appendChild(style);
    }, []);

    const handleApplyCustomTheme = useCallback(() => {
        localStorage.setItem('vivo_custom_bg', customBg);
        localStorage.setItem('vivo_custom_accent', customAccent);
        applyCustomThemeCSS(customBg, customAccent);
        document.documentElement.setAttribute('data-theme', 'custom');
        setCurrentTheme('custom');
        localStorage.setItem('vivo_theme', 'custom');
    }, [customBg, customAccent, applyCustomThemeCSS]);

    useEffect(() => {
        // Apply saved theme on mount
        if (currentTheme === 'custom') {
            document.documentElement.setAttribute('data-theme', 'custom');
            applyCustomThemeCSS(customBg, customAccent);
        } else if (currentTheme !== 'default') {
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('vivo_activeTab', activeTab);
    }, [activeTab]);

    const iea = useMemo(() => {
        return calculateIEA(intervalsData, symptoms, electrolytes);
    }, [intervalsData, symptoms, electrolytes]);

    const decision = useMemo(() => {
        return calculateDecision(iea, intervalsData, symptoms);
    }, [iea, intervalsData, symptoms]);

    const mergedPlan = useMemo(() => {
        const allSessions = allMesocycles.reduce((acc, meso) => {
            return { ...acc, ...(meso.sessions || {}) };
        }, {});
        return { ...weeklyPlan, ...allSessions };
    }, [weeklyPlan, allMesocycles]);

    const dailyRecommendation = useMemo(() => {
        return getDailyRecommendation(iea, intervalsData, mergedPlan, motivation, symptoms);
    }, [iea, intervalsData, mergedPlan, motivation, symptoms]);

    const toggleNotifications = async () => {
        if (notificationsEnabled) {
            // Disable if already enabled (this is simplified, ideally we'd have a true toggle)
            setNotificationsEnabled(false);
            // In a real app we'd stop the reminder service
        } else {
            const permission = await requestNotificationPermission();
            if (permission === 'granted') {
                setNotificationsEnabled(true);
                scheduleLocalReminder(7, 30); // Default to 7:30
                alert('¡Notificaciones activadas! Te avisaremos cada mañana a las 7:30.');
            } else {
                alert('No se pudieron activar las notificaciones. Por favor, revisa los permisos de tu navegador.');
            }
        }
    };

    useEffect(() => {
        if (!auth) { setReady(true); return; }
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                setReady(true);
            } else {
                signInAnonymously(auth).then(() => setReady(true)).catch(() => setReady(true));
            }
        }, () => setReady(true)); // Handle network errors in auth
        return unsub;
    }, []);

    // Load mesocycles once ready
    useEffect(() => {
        if (ready && user) {
            // Seed Plan Maestro v5.0
            seedPlanMaestroV5().then(() => {
                getAllMesocycles().then(mesos => {
                    setAllMesocycles(mesos);
                    const today = new Date().toLocaleDateString('sv');
                    const active = mesos.find(m => today >= m.startDate && today <= m.endDate);
                    if (active) setActiveMesocycleData(active);
                });
            });
        }
    }, [ready, user]);

    // Handle Notifications setup
    useEffect(() => {
        const config = getReminderConfig();
        if (config.enabled && isNotificationEnabled()) {
            scheduleLocalReminder(config.hour, config.minute);
        }
    }, []);

    const loadIntervals = useCallback(async (force = false) => {
        setIntervalsLoading(true);
        setIntervalsError(null);
        try {
            const data = await fetchIntervalsData(90, null, null, force);
            if (data) setIntervalsData(data);
            else setIntervalsError('No se pudieron obtener datos');
        } catch (e) {
            setIntervalsError(e.message);
        } finally {
            setIntervalsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (ready) loadIntervals();
    }, [ready, loadIntervals]);

    useEffect(() => {
        const today = todayISO();

        // Always attempt to load from local storage first for instant feedback
        const localData = localStorage.getItem(`vivo_daily_${today}`);
        if (localData) {
            const parsed = JSON.parse(localData);
            if (parsed.symptoms) setSymptoms(parsed.symptoms);
            if (parsed.electrolytes) setElectrolytes(parsed.electrolytes);
            if (parsed.aiAnalysis) setAiAnalysis(parsed.aiAnalysis);
            setSymptomsSaved(true);
        }

        if (!db || !user) return;

        // Subscription to daily data (Symptoms, Electrolytes, AI Analysis)
        const dailyPath = `artifacts/${APP_ID}/users/${SHARED_USER_ID}/daily/${today}`;
        const unsubDaily = onSnapshot(doc(db, dailyPath), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.symptoms) setSymptoms(data.symptoms);
                if (data.electrolytes) setElectrolytes(data.electrolytes);
                if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
                if (data.motivation) setMotivation(data.motivation);
                setSymptomsSaved(true);
                localStorage.setItem(`vivo_daily_${today}`, JSON.stringify(data));
            }
        });

        // Subscription to Weekly Plan (Shared with Nutriminerals)
        const planPath = `artifacts/Nutriminerals/users/${SHARED_USER_ID}/data/weekly_plan`;
        const unsubPlan = onSnapshot(doc(db, planPath), (snap) => {
            if (snap.exists()) {
                setWeeklyPlan(snap.data().plan || {});
            }
        });

        return () => {
            unsubDaily();
            unsubPlan();
        };
    }, [user, ready]);

    const saveDailyData = useCallback(async (updates) => {
        const today = todayISO();

        // 1. Save to localStorage first (Works offline/standalone)
        try {
            const localKey = `vivo_daily_${today}`;
            const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
            const merged = { ...existing, ...updates, lastUpdated: Date.now() };
            localStorage.setItem(localKey, JSON.stringify(merged));
        } catch (e) {
            console.warn('[Vivo] Local save error:', e);
        }

        // 2. Save to Firestore if available
        if (!db) return;
        const path = `artifacts/${APP_ID}/users/${SHARED_USER_ID}/daily/${today}`;
        try {
            await setDoc(doc(db, path), { ...updates, lastUpdated: Date.now() }, { merge: true });
            setSymptomsSaved(true);
        } catch (e) {
            console.error('[Vivo] Cloud save error:', e);
        }
    }, []);

    const handleSymptomsChange = useCallback((newSymptoms) => {
        setSymptoms(newSymptoms);
        saveDailyData({ symptoms: newSymptoms });
    }, [saveDailyData]);

    const handleMotivationChange = useCallback((newMotivation) => {
        setMotivation(newMotivation);
        saveDailyData({ motivation: newMotivation });
    }, [saveDailyData]);

    const handleElectrolytesChange = useCallback((newElectrolytes) => {
        setElectrolytes(newElectrolytes);
        saveDailyData({ electrolytes: newElectrolytes });
    }, [saveDailyData]);

    const handleUpdateWeeklyPlan = useCallback(async (date, type) => {
        const newPlan = { ...weeklyPlan, [date]: type };
        if (!type) delete newPlan[date];

        setWeeklyPlan(newPlan);

        if (!db) return;
        const planPath = `artifacts/Nutriminerals/users/${SHARED_USER_ID}/data/weekly_plan`;
        try {
            await setDoc(doc(db, planPath), { plan: newPlan }, { merge: true });
        } catch (e) {
            console.error('[Vivo] Plan save error:', e);
        }
    }, [weeklyPlan]);

    const [aiError, setAiError] = useState(null);

    const requestAIAnalysis = useCallback(async () => {
        console.log('[Vivo AI] requestAIAnalysis called. intervalsData:', !!intervalsData, 'iea:', !!iea);
        setAiError(null);

        // If data not ready, try loading first
        if (!intervalsData) {
            console.warn('[Vivo AI] No intervalsData — attempting reload');
            setAiError('Cargando tus datos biométricos... Inténtalo de nuevo en unos segundos.');
            try { await loadIntervals(true); } catch { }
            return;
        }
        if (!iea) {
            setAiError('Los datos aún se están procesando. Espera unos segundos e inténtalo de nuevo.');
            return;
        }

        setAiLoading(true);

        const today = new Date();
        const todayISO = today.toLocaleDateString('sv');
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowISO = tomorrow.toLocaleDateString('sv');

        // Use mergedPlan (weeklyPlan + active Firestore mesocycle) as single source of truth
        const todayPlan = mergedPlan[todayISO];
        const todaySession = todayPlan ? {
            type: typeof todayPlan === 'object' ? todayPlan.type : todayPlan,
            title: typeof todayPlan === 'object' ? (todayPlan.title || todayPlan.type) : todayPlan,
            desc: typeof todayPlan === 'object' ? (todayPlan.desc || '') : '',
            duration: typeof todayPlan === 'object' ? (todayPlan.duration || null) : null,
            goal: typeof todayPlan === 'object' ? (todayPlan.goal || '') : '',
        } : null;
        // Fill in defaults for duration/goal if missing
        if (todaySession && !todaySession.duration) {
            const t = todaySession.type;
            todaySession.duration = (t === 'Descanso' || t === 'Rest') ? '-' : t === 'Gym' ? '60 min' : '90 min';
        }
        if (todaySession && !todaySession.goal) {
            const t = todaySession.type;
            todaySession.goal = (t === 'Descanso' || t === 'Rest') ? 'Recuperación completa' : t === 'SST' ? 'Progresión Densidad' : t === 'Z2' ? 'Base Aeróbica' : 'Mantenimiento';
        }

        const tomorrowPlan = mergedPlan[tomorrowISO];
        const tomorrowSession = tomorrowPlan ? {
            type: typeof tomorrowPlan === 'object' ? tomorrowPlan.type : tomorrowPlan,
            title: typeof tomorrowPlan === 'object' ? (tomorrowPlan.title || tomorrowPlan.type) : tomorrowPlan,
            desc: typeof tomorrowPlan === 'object' ? (tomorrowPlan.desc || '') : '',
            duration: typeof tomorrowPlan === 'object' ? (tomorrowPlan.duration || null) : null,
            goal: typeof tomorrowPlan === 'object' ? (tomorrowPlan.goal || '') : '',
        } : null;
        if (tomorrowSession && !tomorrowSession.duration) {
            const t = tomorrowSession.type;
            tomorrowSession.duration = (t === 'Descanso' || t === 'Rest') ? '-' : t === 'Gym' ? '60 min' : '90 min';
        }
        if (tomorrowSession && !tomorrowSession.goal) {
            const t = tomorrowSession.type;
            tomorrowSession.goal = (t === 'Descanso' || t === 'Rest') ? 'Recuperación' : t === 'SST' ? 'Progresión Densidad' : t === 'Z2' ? 'Base Aeróbica' : 'Mantenimiento';
        }

        console.log('[Vivo AI] Today:', todayISO, todaySession?.type);
        console.log('[Vivo AI] Tomorrow:', tomorrowISO, tomorrowSession?.type);

        try {
            const result = await fetchVivoAnalysis(iea, intervalsData, symptoms, electrolytes, todaySession, tomorrowSession);
            console.log('[Vivo AI] ✅ Analysis received, length:', result?.length);
            setAiAnalysis(result);
            saveDailyData({ aiAnalysis: result });
        } catch (e) {
            console.error('[Vivo] AI error:', e);
            setAiError(`Error de IA: ${e.message}. Comprueba tu conexión e inténtalo de nuevo.`);
        } finally {
            setAiLoading(false);
        }
    }, [intervalsData, iea, symptoms, electrolytes, mergedPlan, saveDailyData, loadIntervals]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    const handleCopyReport = useCallback(() => {
        const reportText = generateCoachReport(iea, decision);
        navigator.clipboard.writeText(reportText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [iea, decision]);

    if (!ready) {
        return (
            <div className="app-container flex-center" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                <Loader2 size={60} className="animate-spin" style={{ color: 'var(--blue)' }} />
                <div className="text-xl font-black tracking-tight">VIVO</div>
            </div>
        );
    }

    const tabs = [
        { id: 'dashboard', label: 'Hoy', icon: Activity },
        { id: 'coach', label: 'Entreno', icon: ClipboardCheck },
        { id: 'trends', label: 'Métricas', icon: BarChart3 },
        { id: 'ai', label: 'IA', icon: Brain },
    ];

    const renderView = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="section-gap stagger">
                        <DecisionCard decision={decision} iea={iea} dailyRecommendation={dailyRecommendation} />

                        {iea?.score !== null && (
                            <>
                                <BioMetrics iea={iea} intervalsData={intervalsData} />

                                <IEAIntelligenceCard iea={iea} />

                                <AveragesCard iea={iea} />

                                <NormalityBands bands={iea.bands} />

                                {/* Observatorio de Escalas */}
                                {iea.details.hrv?.zScore && (
                                    <div className="card-glass animate-fade-in" style={{ padding: '1rem' }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                            <div className="text-xs uppercase tracking-widest font-bold" style={{ color: '#ffffff' }}>Observatorio de Escalas</div>
                                            <div className="text-xs font-mono text-cyan" style={{ fontSize: '0.6rem' }}>60d vs Hoy</div>
                                        </div>
                                        <div className="flex-col gap-sm">
                                            <div className="flex-between">
                                                <span
                                                    className="text-xs"
                                                    style={{ color: '#ffffff', opacity: 0.7, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.4)', paddingBottom: '2px' }}
                                                    onClick={() => setShowZScoreInfo(!showZScoreInfo)}
                                                >
                                                    Z-Score VFC (60d) ⓘ
                                                </span>
                                                <span
                                                    style={{
                                                        color: Number(iea.details.hrv.zScore) < -0.5 ? 'var(--red)' : Number(iea.details.hrv.zScore) < 0 ? 'var(--yellow)' : 'var(--green)',
                                                        fontSize: '1.25rem',
                                                        fontWeight: 900,
                                                        fontFamily: 'var(--font-mono)'
                                                    }}
                                                >
                                                    {iea.details.hrv.zScore}
                                                </span>
                                            </div>

                                            {showZScoreInfo && (
                                                <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>¿Qué significa el Z-Score?</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>Mide cuántas desviaciones estándar se aleja la VFC de tu media de los últimos 60 días.</p>
                                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <li><span style={{ color: 'var(--green)', fontWeight: 'bold' }}>&gt; +0.5</span> : Adaptación excelente / Vagal Peak</li>
                                                        <li><span style={{ color: 'var(--yellow)', fontWeight: 'bold' }}>-0.5 a +0.5</span> : Sistema en equilibrio</li>
                                                        <li><span style={{ color: 'var(--red)', fontWeight: 'bold' }}>-0.5 a -1.0</span> : Fatiga moderada / Alerta simpática</li>
                                                        <li><span style={{ color: 'var(--red)', fontWeight: 'bold' }}>&lt; -1.0</span> : Depresión del sistema (Cap automático)</li>
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="flex-between" style={{ alignItems: 'center' }}>
                                                <span className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>FC Base (60d)</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                                    {iea.details.rhr?.baseline} <span style={{ fontSize: '0.65rem' }}>bpm</span>
                                                </span>
                                            </div>
                                            <div className="flex-between" style={{ alignItems: 'center' }}>
                                                <span className="text-xs" style={{ color: '#ffffff', opacity: 0.7 }}>FC Hoy</span>
                                                <span style={{
                                                    color: Number(iea.details.rhr?.value) > Number(iea.details.rhr?.baseline) + 1.5 ? 'var(--yellow)' : 'var(--green)',
                                                    fontSize: '1.2rem',
                                                    fontWeight: 800,
                                                    fontFamily: 'var(--font-mono)'
                                                }}>
                                                    {iea.details.rhr?.value} <span style={{ fontSize: '0.65rem' }}>bpm</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}





                        {/* Botón flotante de Copia para Entrenador */}
                        <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 100 }}>
                            <button
                                onClick={handleCopyReport}
                                className="card-glass"
                                style={{
                                    width: '56px', height: '56px', borderRadius: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--purple)',
                                    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3)',
                                    background: 'rgba(168, 85, 247, 0.2)',
                                    color: '#fff'
                                }}
                            >
                                {copied ? <Check size={24} style={{ color: 'var(--green)' }} /> : <Clipboard size={24} />}
                            </button>
                        </div>
                    </div>
                );
            case 'trends':
                return (
                    <Suspense fallback={<TabFallback />}>
                        <div className="section-gap">
                            <MetricsHistory intervalsData={intervalsData} />
                        </div>
                    </Suspense>
                );

            case 'ai':
                return <Suspense fallback={<TabFallback />}><AIAnalysis analysis={aiAnalysis} isLoading={aiLoading} onRequestAnalysis={requestAIAnalysis} iea={iea} intervalsData={intervalsData} error={aiError} activeMesocycleData={activeMesocycleData} /></Suspense>;
            case 'coach':
                return <Suspense fallback={<TabFallback />}><CoachHub intervalsData={intervalsData} dailyRecommendation={dailyRecommendation} weeklyPlan={mergedPlan} onUpdatePlan={handleUpdateWeeklyPlan} activeMesocycleData={activeMesocycleData} allMesocycles={allMesocycles} /></Suspense>;
            default: return null;
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="flex-row gap-sm">
                    <div className="text-xl font-black tracking-tight">VIVO</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button className={`header-btn ${intervalsData ? 'status-on' : 'status-off'}`} title={intervalsData ? 'Conectado' : 'Sin conexión'}>
                        {intervalsData ? <Wifi size={14} /> : <WifiOff size={14} />}
                    </button>
                    <button className="header-btn" onClick={() => loadIntervals(true)} disabled={intervalsLoading} title="Refrescar datos">
                        <RefreshCw size={14} className={intervalsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button className="header-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}>
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                    </button>
                    <button className="header-btn" onClick={toggleNotifications} title={notificationsEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}>
                        {notificationsEnabled ? <Bell size={14} className="text-cyan" /> : <BellOff size={14} />}
                    </button>
                    <button className="header-btn accent" onClick={() => setShowThemePicker(true)} title="Cambiar diseño">
                        <Palette size={14} />
                    </button>
                </div>
            </header>

            {/* Theme Picker */}
            {showThemePicker && (
                <div className="theme-picker-overlay" onClick={() => setShowThemePicker(false)}>
                    <div className="theme-picker-panel" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div>
                                <div className="text-lg font-black tracking-tight">Diseño & Estilo</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>Elige un tema o crea el tuyo</div>
                            </div>
                            <button onClick={() => setShowThemePicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div className="theme-picker-grid">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    className={`theme-opt ${currentTheme === t.id ? 'active' : ''}`}
                                    onClick={() => { applyTheme(t.id); setShowThemePicker(false); }}
                                >
                                    <div className="theme-swatch" style={{ background: `linear-gradient(135deg, ${t.bg} 40%, ${t.accent})` }} />
                                    <span className="theme-label">{t.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom Theme Creator */}
                        <div style={{ marginTop: '1.2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <button
                                onClick={() => setShowCustomEditor(!showCustomEditor)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.7rem', borderRadius: '14px',
                                    background: currentTheme === 'custom' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${currentTheme === 'custom' ? 'rgba(6,182,212,0.3)' : 'var(--border)'}`,
                                    color: currentTheme === 'custom' ? 'var(--cyan)' : 'var(--text-secondary)',
                                    cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                }}
                            >
                                <Palette size={16} /> {showCustomEditor ? 'Cerrar Editor' : '🎨 Crear Tu Propio Tema'}
                            </button>

                            {showCustomEditor && (
                                <div className="animate-fade-in" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {/* Preview */}
                                    <div style={{
                                        height: '60px', borderRadius: '16px', overflow: 'hidden',
                                        background: `linear-gradient(135deg, ${customBg} 0%, ${customBg} 50%, ${customAccent} 100%)`,
                                        border: '2px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative',
                                    }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 1 }}>VIVO</span>
                                        <div style={{ position: 'absolute', bottom: '8px', right: '12px', display: 'flex', gap: '4px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: customAccent, boxShadow: `0 0 8px ${customAccent}` }} />
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: customAccent, opacity: 0.5 }} />
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: customAccent, opacity: 0.25 }} />
                                        </div>
                                    </div>

                                    {/* Color Pickers */}
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                                                Fondo
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <input
                                                    type="color"
                                                    value={customBg}
                                                    onChange={(e) => setCustomBg(e.target.value)}
                                                    style={{ width: '40px', height: '40px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'none', padding: 0 }}
                                                />
                                                <input
                                                    type="text"
                                                    value={customBg}
                                                    onChange={(e) => setCustomBg(e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '0.5rem', borderRadius: '10px',
                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                                        color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                                                        fontWeight: 700, outline: 'none', textTransform: 'uppercase',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                                                Acento
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <input
                                                    type="color"
                                                    value={customAccent}
                                                    onChange={(e) => setCustomAccent(e.target.value)}
                                                    style={{ width: '40px', height: '40px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'none', padding: 0 }}
                                                />
                                                <input
                                                    type="text"
                                                    value={customAccent}
                                                    onChange={(e) => setCustomAccent(e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '0.5rem', borderRadius: '10px',
                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                                        color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                                                        fontWeight: 700, outline: 'none', textTransform: 'uppercase',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick accent palette */}
                                    <div>
                                        <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                            Acentos rápidos
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                            {['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#6366f1', '#d946ef', '#f43f5e', '#0ea5e9', '#84cc16', '#a855f7', '#fb923c'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setCustomAccent(c)}
                                                    style={{
                                                        width: '26px', height: '26px', borderRadius: '8px',
                                                        background: c, border: customAccent === c ? '2px solid #fff' : '2px solid transparent',
                                                        cursor: 'pointer', transition: 'transform 0.15s',
                                                        boxShadow: customAccent === c ? `0 0 12px ${c}` : 'none',
                                                    }}
                                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.15)'}
                                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick bg palette */}
                                    <div>
                                        <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                            Fondos rápidos
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                            {['#000000', '#0a0a0f', '#020617', '#0f172a', '#0a1208', '#0f0806', '#050510', '#0a0505', '#18181b', '#1e1b4b', '#27272a', '#f3f4f6', '#e5e7eb', '#1a1a2e'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setCustomBg(c)}
                                                    style={{
                                                        width: '26px', height: '26px', borderRadius: '8px',
                                                        background: c, border: customBg === c ? '2px solid var(--text-primary)' : '2px solid rgba(255,255,255,0.1)',
                                                        cursor: 'pointer', transition: 'transform 0.15s',
                                                    }}
                                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.15)'}
                                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Apply button */}
                                    <button
                                        onClick={() => { handleApplyCustomTheme(); setShowThemePicker(false); }}
                                        style={{
                                            padding: '0.75rem', borderRadius: '14px',
                                            background: `linear-gradient(135deg, ${customAccent}, ${customAccent}88)`,
                                            border: 'none', color: '#fff', fontWeight: 900, fontSize: '0.82rem',
                                            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
                                            boxShadow: `0 4px 20px ${customAccent}40`,
                                        }}
                                    >
                                        ✨ Aplicar Mi Tema
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <main className="main-content">{renderView()}</main>
            <nav className="nav-bar">
                <div className="nav-inner">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <Icon size={20} className="nav-icon" />
                                <span className="nav-label">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default App;

/**
 * VIVO — Motor de Decisión Autonómica
 * v4.0
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, APP_ID, SHARED_USER_ID } from './config/firebase';
import { fetchIntervalsData } from './services/intervalsService';
import { fetchVivoAnalysis } from './services/geminiService';
import { calculateIEA } from './engine/ieaEngine';
import { calculateDecision } from './engine/decisionEngine';
import { getDailyRecommendation } from './engine/recommendationEngine';

// Components
import Semaphore from './components/Semaphore';
import BioMetrics from './components/BioMetrics';
import DecisionCard from './components/DecisionCard';
import IEAIntelligenceCard from './components/IEAIntelligenceCard';
import NormalityBands from './components/NormalityBands';
import SymptomJournal from './components/SymptomJournal';
import ElectrolyteTracker from './components/ElectrolyteTracker';
import MetricsHistory from './components/MetricsHistory';
import AIAnalysis from './components/AIAnalysis';
import AveragesCard from './components/AveragesCard';
import CoachHub from './components/Coach/CoachHub';

// Icons
import {
    Activity, BarChart3, Droplets, Brain,
    RefreshCw, Loader2, Wifi, WifiOff, Maximize, Minimize, Clipboard, Check,
    ClipboardCheck
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

    useEffect(() => {
        localStorage.setItem('vivo_activeTab', activeTab);
    }, [activeTab]);

    const iea = useMemo(() => {
        return calculateIEA(intervalsData, symptoms, electrolytes);
    }, [intervalsData, symptoms, electrolytes]);

    const decision = useMemo(() => {
        return calculateDecision(iea, intervalsData, symptoms);
    }, [iea, intervalsData, symptoms]);

    const dailyRecommendation = useMemo(() => {
        return getDailyRecommendation(iea, intervalsData, weeklyPlan, motivation, symptoms);
    }, [iea, intervalsData, weeklyPlan, motivation, symptoms]);

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

    const requestAIAnalysis = useCallback(async () => {
        if (!intervalsData || !iea) return;
        setAiLoading(true);

        const todayISO = new Date().toLocaleDateString('sv');
        const plannedType = weeklyPlan[todayISO];
        const plannedSession = plannedType ? {
            type: plannedType,
            duration: plannedType === 'Rest' ? '-' : plannedType === 'Gym' ? '60 min' : '90 min',
            goal: plannedType === 'SST' ? 'Progresión Densidad' : plannedType === 'Z2' ? 'Base Aeróbica' : 'Mantenimiento'
        } : null;

        try {
            const result = await fetchVivoAnalysis(iea, intervalsData, symptoms, electrolytes, plannedSession);
            setAiAnalysis(result);
            saveDailyData({ aiAnalysis: result });
        } catch (e) {
            console.error('[Vivo] AI error:', e);
        } finally {
            setAiLoading(false);
        }
    }, [intervalsData, iea, symptoms, electrolytes, weeklyPlan, saveDailyData]);

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

                        <SymptomJournal
                            symptoms={symptoms}
                            onSymptomsChange={handleSymptomsChange}
                            motivation={motivation}
                            onMotivationChange={handleMotivationChange}
                            saved={symptomsSaved}
                        />

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
                    <div className="section-gap">
                        <MetricsHistory intervalsData={intervalsData} />
                    </div>
                );

            case 'ai':
                return <AIAnalysis analysis={aiAnalysis} isLoading={aiLoading} onRequestAnalysis={requestAIAnalysis} />;
            case 'coach':
                return <CoachHub intervalsData={intervalsData} dailyRecommendation={dailyRecommendation} weeklyPlan={weeklyPlan} onUpdatePlan={handleUpdateWeeklyPlan} />;
            default: return null;
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="flex-row gap-sm">
                    <div className="text-base font-black tracking-tight">VIVO</div>
                    <div className="text-xs text-muted">Motor Autonómico</div>
                </div>
                <div className="flex-row gap-sm">
                    {intervalsData ? <Wifi size={14} style={{ color: 'var(--green)' }} /> : <WifiOff size={14} style={{ color: 'var(--red)' }} />}
                    <button onClick={() => loadIntervals(true)} disabled={intervalsLoading}>
                        <RefreshCw size={14} className={intervalsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                    </button>
                </div>
            </header>
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

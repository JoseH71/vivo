/* ============================================
   VIVO — Core Type Definitions
   Interfaces principales del motor IEA
   ============================================ */

// ── Datos de Intervals.icu ──
export interface IntervalsDay {
    id: string;            // "2026-03-03"
    hrv: number | null;
    restingHR: number | null;
    rhr: number | null;
    sleepScore: number | null;
    ctl: number | null;
    atl: number | null;
    tsb: number | null;
    dailyTSS: number | null;
    activities: IntervalsActivity[];
}

export interface IntervalsActivity {
    id: string;
    name: string;
    type: string;
    icu_training_load: number;
    moving_time: number;
    icu_aerobic_decoupling: number;
    start_date_local: string;
}

// ── IEA Engine ──
export interface IEAMetricDetail {
    points: number;
    weight: number;
    zScore?: number;
    deviation?: number;
    raw?: number;
}

export interface IEALoadDetail extends IEAMetricDetail {
    tsb: number;
}

export interface IEAStability {
    cv: number;
    zone: 'stable' | 'vigilance' | 'unstable' | 'saturated';
    penalty: number;
}

export interface IEASafety {
    capActive: boolean;
    capValue: number;
    capReason: string;
    autonomicConflict: boolean;
    decoupleType1: boolean;
}

export interface IEAAverages {
    hrv: { d7: number; d60: number };
    rhr: { d7: number; d60: number };
}

export interface IEAResult {
    score: number;
    label: string;
    isProvisional: boolean;
    details: {
        hrv: IEAMetricDetail;
        rhr: IEAMetricDetail;
        sleep: IEAMetricDetail;
        load: IEALoadDetail;
        stability: IEAStability;
        safety: IEASafety;
    };
    averages: IEAAverages;
}

// ── Decision Engine ──
export type DecisionColor = 'green' | 'yellow' | 'red' | 'purple';

export interface DecisionRecommendation {
    color: DecisionColor;
    emoji: string;
    intensity: string;
    description: string;
}

export interface DecisionTrend {
    current: number;
    previous: number;
    changePct: number;
}

export interface DecisionResult {
    recommendation: DecisionRecommendation;
    trends: {
        hrv: DecisionTrend;
        rhr: DecisionTrend;
    };
}

// ── Daily Recommendation ──
export interface DailyRecommendation {
    title: string;
    msg: string;
    color: DecisionColor;
    stimulus: string;
    workout: string;
    strategy: string;
    domsAlert?: {
        icon: string;
        title: string;
        msg: string;
        color: string;
    };
}

// ── Gemini AI Analysis ──
export interface GeminiMetricSnapshot {
    value: number;
    trend: 'up' | 'down' | 'stable';
    vs7d: string;
    zScore: string;
}

export interface GeminiAnalysis {
    statusEmoji: string;
    statusLabel: string;
    statusColor: string;
    greeting: string;
    metricsSnapshot: {
        hrv: GeminiMetricSnapshot;
        rhr: GeminiMetricSnapshot;
        sleep: { value: number; label: string };
        tsb: { value: number; label: string };
    };
    comparisons: {
        hrv: string;
        rhr: string;
        sleep: string;
    };
    interpretation: string;
    yesterdayImpact: string;
    technicalDeepDive: string;
    actionSteps: Array<{ icon: string; text: string }>;
    prescription: {
        type: string;
        title: string;
        details: string;
        reason: string;
    };
    tomorrowPlan: {
        type: string;
        title: string;
        details: string;
    };
    consistencyStreak: {
        days: number;
        text: string;
    };
    quickQuestions: Array<{ question: string; answer: string }>;
    motivationalNote: string;
}

// ── Electrolytes ──
export interface ElectrolyteData {
    sodium?: number;
    magnesium?: number;
    potassium?: number;
    protein?: number;
    carbs?: number;
}

// ── Symptom ──
export type Symptom = string;

// ── Theme ──
export type ThemeId =
    | 'default' | 'midnight' | 'cyberpunk' | 'forest'
    | 'ember' | 'aurora' | 'stealth' | 'blood'
    | 'ocean' | 'gold' | 'deeppurple' | 'nordic'
    | 'terminal' | 'sunset' | 'zen';

export interface ThemeOption {
    id: ThemeId;
    name: string;
    bg: string;
    accent: string;
    desc: string;
}

// ── Weekly Data (Correlations) ──
export interface WeeklySummary {
    label: string;
    tss: number;
    atl: number | null;
    ctl: number | null;
    rhr: number | null;
    hrv: number | null;
    sleep: number | null;
}

export interface CorrelationMatrix {
    matrix: (number | null)[][];
    labels: string[];
}

// ── Coach / Mesocycle ──
export interface PlannedSession {
    type: string;
    title?: string;
    desc?: string;
    duration?: string;
    goal?: string;
}

export interface WeeklyPlan {
    [dayKey: string]: PlannedSession;
}

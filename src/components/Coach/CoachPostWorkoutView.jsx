import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { getPlannedSession } from '../../services/mesocycleService';

/**
 * ANÁLISIS POST-SESIÓN — VIVO PRO
 * 
 * 4 Bloques:
 * 1. Coherencia con el Plan
 * 2. Calidad Fisiológica del Estímulo
 * 3. Análisis Fisiológico y Diagnóstico
 * 
 * Reglas especiales FA:
 * - FC media > 130 → alerta
 * - IF > 0.75 en Z2 → contaminada
 * - Decoupling solo si VI ≤ 1.08 y duración ≥ 75 min
 */

// ─── Z2 PHYSIOLOGICAL THRESHOLDS ────────────────────────────────
const Z2_RULES = {
    ifTarget: [0.60, 0.72],      // IF objetivo Z2
    ifTempo: 0.78,               // Por encima = no es Z2
    fcMaxZ2: 128,                // FC máx Z2
    fcAlertFA: 130,              // Alerta FA
    driftOk: 5,                  // < 5% decoupling OK
    driftWarn: 7,                // 5-7% leve
    viMax: 1.08,                 // VI máximo para drift válido
    minDurationDrift: 75,        // Minutos mínimos para drift
    maxCoastPct: 15,             // % máx sin pedalear para drift válido
};

const CoachPostWorkoutView = ({ todayData, onSaveRpe, dateStr }) => {
    const [rpe, setRpe] = useState(null);
    const [rpeSaved, setRpeSaved] = useState(false);

    const effectiveDate = dateStr || new Date().toLocaleDateString('sv');
    const planned = getPlannedSession(effectiveDate);

    // ─── Extract today's activity from intervals data ────────────
    const activity = useMemo(() => {
        if (!todayData?.activities || todayData.activities.length === 0) return null;
        // Get the main activity (highest TSS if multiple)
        const sorted = [...todayData.activities].sort((a, b) => (b.icu_training_load || 0) - (a.icu_training_load || 0));
        return sorted[0];
    }, [todayData]);

    if (!activity) return null;

    // ─── Extract all available fields (names confirmed from live API) ─────────
    const a = activity;
    const tssReal = a.icu_training_load || 0;
    let ifReal = a.icu_intensity != null ? a.icu_intensity : null;

    // Normalize IF: Intervals can return 0.66 or 66.0. We want 0.66 for our rules.
    if (ifReal !== null && ifReal > 2.0) ifReal = ifReal / 100;

    const npReal = a.icu_weighted_avg_watts != null ? a.icu_weighted_avg_watts : null;
    const apReal = a.icu_average_watts != null ? a.icu_average_watts : null;
    const viReal = a.icu_variability_index != null ? a.icu_variability_index : null;
    const fcMedia = a.average_heartrate != null ? a.average_heartrate : null;
    const fcMax = a.max_heartrate != null ? a.max_heartrate : null;
    const driftReal = a.decoupling != null ? a.decoupling : null;
    const durationSecs = a.moving_time || a.elapsed_time || 0;
    const durationMins = Math.round(durationSecs / 60);
    const distKm = a.distance ? (a.distance / 1000).toFixed(1) : null;
    const elevGain = a.total_elevation_gain != null ? a.total_elevation_gain : null;
    const cadAvg = a.average_cadence != null ? a.average_cadence : null;
    const tempAvg = a.average_temp != null ? a.average_temp : null;
    const calories = a.calories != null ? a.calories : null;
    const activityName = a.name || 'Sesión';
    const activityType = a.type || 'Ride';
    const coastPct = (a.coasting_time && durationSecs > 0)
        ? (a.coasting_time / durationSecs) * 100 : null;

    // Start time — start_date_local confirmed present in API keys
    const rawStart = a.start_date_local || a.start_date || null;
    const startTime = rawStart
        ? new Date(String(rawStart).replace(' ', 'T')).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : null;

    // Garmin fields — CAPITALIZED (confirmed from API dump)
    const trainingEffect = a.AerobicEffect != null ? a.AerobicEffect : null;
    const anaerobicEffect = a.AnaerobicEffect != null ? a.AnaerobicEffect : null;
    const vo2max = a.VO2MaxGarmin != null ? a.VO2MaxGarmin : null;
    const perfCondition = a.PerformanceCondition != null ? a.PerformanceCondition : null;
    const recoveryTime = a.RecoveryTime != null ? a.RecoveryTime : null;

    // CTL/ATL — wellness + fallback
    const ctl = (todayData?.ctl != null && todayData.ctl !== 0) ? todayData.ctl : (a.icu_ctl ?? null);
    const atl = (todayData?.atl != null && todayData.atl !== 0) ? todayData.atl : (a.icu_atl ?? null);
    const tsb = (ctl != null && atl != null) ? parseFloat((ctl - atl).toFixed(1)) : null;

    // Weight
    const weight = a.icu_weight != null ? a.icu_weight : (todayData?.weight ?? null);

    // Work (kJ)
    const workKj = a.icu_joules != null ? Math.round(a.icu_joules / 1000) : null;
    const workAboveFtp = a.icu_joules_above_ftp != null ? Math.round(a.icu_joules_above_ftp / 1000) : null;

    // Power/HR and Efficiency
    const pwHr = a.icu_power_hr != null ? a.icu_power_hr : null;
    const efficiency = a.icu_efficiency_factor != null ? a.icu_efficiency_factor : null;

    // S-RPE
    const srpe = a.session_rpe != null ? a.session_rpe : (a.icu_rpe != null ? a.icu_rpe : null);

    // Zones
    const rawHrZones = Array.isArray(a.icu_hr_zone_times) ? a.icu_hr_zone_times : null;
    const rawPowerZones = Array.isArray(a.icu_zone_times)
        ? a.icu_zone_times.map(z => typeof z === 'object' ? { id: z.id, secs: z.secs } : { id: null, secs: z })
        : null;

    const hrZones = rawHrZones && rawHrZones.some(z => z > 30) ? rawHrZones : null;
    const powerZones = rawPowerZones && rawPowerZones.some(z => z.secs > 30) ? rawPowerZones : null;

    const hrvToday = todayData?.hrv || null;


    // ─── Determine if plan was Z2 / Bici ─────────────────────────
    const isPlannedZ2 = planned.title?.includes('Z2') || planned.desc?.includes('Z2');
    const isPlannedSST = planned.title?.includes('SST') || planned.desc?.includes('SST');
    const isPlannedBike = planned.type === 'Bici';
    const isBikeActivity = activityType === 'Ride' || activityType === 'VirtualRide' || activityType === 'Cycling';

    // ─── DRIFT VALIDITY CHECK ────────────────────────────────────
    const driftValid = useMemo(() => {
        const reasons = [];
        let valid = true;
        if (viReal !== null && viReal > Z2_RULES.viMax) {
            valid = false;
            reasons.push(`VI = ${viReal.toFixed(2)} (máx ${Z2_RULES.viMax}). Intensidad demasiado variable.`);
        }
        if (durationMins < Z2_RULES.minDurationDrift) {
            valid = false;
            reasons.push(`Duración ${durationMins}' (mín ${Z2_RULES.minDurationDrift}'). Sesión demasiado corta.`);
        }
        if (coastPct !== null && coastPct > Z2_RULES.maxCoastPct) {
            valid = false;
            reasons.push(`Tiempo sin pedalear ${coastPct.toFixed(0)}% (máx ${Z2_RULES.maxCoastPct}%). Demasiadas bajadas.`);
        }
        if (driftReal !== null && Math.abs(driftReal) > 1.0) {
            valid = false;
            reasons.push("Valor de desacople fuera de rango (posible error de datos).");
        }
        return { valid, reasons };
    }, [viReal, durationMins, coastPct, driftReal]);

    // ─── Z2 QUALITY DIAGNOSIS ────────────────────────────────────
    const z2Diagnosis = useMemo(() => {
        if (!isPlannedZ2 || !isBikeActivity) return null;

        const issues = [];
        let classification = 'CORRECTA'; // CORRECTA, VARIABLE, ALTA, CONTAMINADA

        // 1. Check Intensidad Global (IF)
        if (ifReal !== null) {
            const ifPct = (ifReal * 100).toFixed(0);
            if (ifReal > Z2_RULES.ifTempo) {
                classification = 'CONTAMINADA';
                issues.push(`IF = ${ifPct}%: excede el rango aeróbico. No es Z2.`);
            } else if (ifReal > Z2_RULES.ifTarget[1]) {
                classification = 'ALTA';
                issues.push(`IF = ${ifPct}%: zona alta. Limítrofe Tempo.`);
            }
        }

        // 2. Check Frecuencia Cardíaca Media
        if (fcMedia !== null) {
            if (fcMedia > Z2_RULES.fcAlertFA) {
                classification = 'CONTAMINADA';
                issues.push(`FC media ${fcMedia} bpm: supera umbral de seguridad FA (${Z2_RULES.fcAlertFA}).`);
            } else if (fcMedia > Z2_RULES.fcMaxZ2) {
                if (classification !== 'CONTAMINADA') classification = 'ALTA';
                issues.push(`FC media ${fcMedia} bpm: por encima de Z2 puro (${Z2_RULES.fcMaxZ2}).`);
            }
        }

        // 3. Check Variabilidad (VI)
        if (viReal !== null && viReal > Z2_RULES.viMax) {
            if (classification === 'CORRECTA') classification = 'VARIABLE';
            issues.push(`VI = ${viReal.toFixed(2)}: variabilidad alta (cambios de ritmo o terreno).`);
        }

        // 4. Check Distribución de Intensidad (High Zones)
        const totalPwrSecs = powerZones ? powerZones.reduce((s, z) => s + (z.secs || 0), 0) : 0;
        const highPwrSecs = powerZones ? powerZones.reduce((s, z) => {
            // Include Z3, Z4, Z5, Z6, SS as high intensity for a Z2 session
            if (['Z3', 'Z4', 'Z5', 'Z6', 'SS'].includes(z.id)) return s + (z.secs || 0);
            return s;
        }, 0) : 0;
        const highPwrPct = totalPwrSecs > 0 ? (highPwrSecs / totalPwrSecs) * 100 : 0;

        const totalHrSecs = hrZones ? hrZones.reduce((s, z) => s + (z || 0), 0) : 0;
        const highHrSecs = hrZones ? hrZones.slice(2).reduce((s, z) => s + (z || 0), 0) : 0; // Z3, Z4, Z5
        const highHrPct = totalHrSecs > 0 ? (highHrSecs / totalHrSecs) * 100 : 0;

        if (highPwrPct > 15 || highHrPct > 15) {
            if (classification === 'CORRECTA' || classification === 'VARIABLE') classification = 'VARIABLE';
            issues.push(`Carga mixta: ${highPwrPct.toFixed(0)}% del tiempo en zonas de intensidad > Z2.`);
        }

        // 5. Check Drift (if valid)
        if (driftReal !== null && driftValid.valid) {
            const driftPct = Math.abs(driftReal * 100);
            if (driftPct > Z2_RULES.driftWarn) {
                if (classification !== 'CONTAMINADA') classification = 'ALTA';
                issues.push(`Desacople ${driftPct.toFixed(1)}%: fatiga cardiovascular detectada.`);
            }
        }

        const translations = {
            'CORRECTA': 'Estímulo mitocondrial limpio. Recuperación prevista normal.',
            'VARIABLE': 'Z2 VARIABLE / BASE ONDULADA. Carga mixta con bloques de intensidad.',
            'ALTA': 'Base con carga simpática añadida. Vigilar densidad siguiente sesión.',
            'CONTAMINADA': 'La sesión excedió el objetivo aeróbico. Ajustar próxima carga.'
        };

        return { classification, issues, summary: translations[classification] };
    }, [isPlannedZ2, isBikeActivity, ifReal, fcMedia, viReal, powerZones, hrZones, driftReal, driftValid]);

    // ─── TOMORROW IMPACT ─────────────────────────────────────────
    const tomorrowImpact = useMemo(() => {
        const baseDate = new Date(effectiveDate + 'T12:00:00');
        baseDate.setDate(baseDate.getDate() + 1);
        const nextDayStr = baseDate.toLocaleDateString('sv');
        const tomorrowPlan = getPlannedSession(nextDayStr);
        const alerts = [];

        if (z2Diagnosis?.classification === 'CONTAMINADA' || z2Diagnosis?.classification === 'ALTA') {
            if (tomorrowPlan.type === 'Bici' && (tomorrowPlan.title?.includes('SST') || tomorrowPlan.desc?.includes('SST'))) {
                alerts.push('Carga superior a la prevista hoy. Reducir intensidad o acortar intervalos mañana (SST).');
            }
            if (tomorrowPlan.type === 'Gym') {
                alerts.push('Residuo simpático elevado. Valorar reducir volumen de pierna mañana.');
            }
        }

        // FA protection
        if (fcMedia && fcMedia > Z2_RULES.fcAlertFA) {
            alerts.push('Reducir intensidad próxima sesión para proteger estabilidad autonómica.');
        }
        if (ifReal && ifReal > 0.75 && isPlannedZ2) {
            alerts.push('IF demasiado alto para Z2. Próxima sesión de base, mantener IF < 0.70.');
        }
        if (driftReal !== null && driftValid.valid && Math.abs(driftReal * 100) > 8 && fcMedia && fcMedia > 125 && viReal && viReal <= Z2_RULES.viMax) {
            alerts.push('Señal de carga cardiovascular real (drift + FC + VI estable). Considerar día de descarga.');
        }

        // RPE cross
        if (rpe !== null && tssReal > 0) {
            if (rpe >= 7 && tssReal < 60) {
                alerts.push(`RPE ${rpe}/10 con TSS ${tssReal}: eficiencia percibida baja. Revisar sueño, nutrición o estrés.`);
            }
        }

        if (z2Diagnosis?.classification === 'VARIABLE') {
            alerts.push('Carga mixta (base ondulada). Vigilar respuesta autonómica (HRV/Sueño) mañana.');
        }

        return { tomorrowPlan, alerts, clear: alerts.length === 0 };
    }, [z2Diagnosis, fcMedia, ifReal, driftReal, driftValid, viReal, isPlannedZ2, rpe, tssReal, effectiveDate]);

    // ─── RPE HANDLER ─────────────────────────────────────────────
    const handleRpe = useCallback((val) => {
        setRpe(val);
        setRpeSaved(true);
        if (onSaveRpe) onSaveRpe(val);
        setTimeout(() => setRpeSaved(false), 2000);
    }, [onSaveRpe]);

    const [copied, setCopied] = useState(false);

    const handleCopyAnalysis = () => {
        const displayDate = new Date(effectiveDate + 'T12:00:00');
        let text = `ANÁLISIS DE SESIÓN — ${planned.title || activityName}\n\n`;
        text += `${activityName} · ${displayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;

        // 1. COHERENCIA
        text += `1. Coherencia con el Plan\n\n`;
        text += `PLANIFICADO\n`;
        text += `Sesión: ${planned.title || '—'}\n`;
        text += `TSS est.: ${planned.tss || '—'}\n`;
        if (isPlannedZ2) text += `IF ideal: 60-72%\n`;
        text += `\nREALIZADO\n`;
        text += `Duración: ${durationMins}'\n`;
        text += `TSS real: ${tssReal}\n`;
        text += `IF real: ${ifReal ? (ifReal * 100).toFixed(0) + '%' : '—'}\n\n`;

        // 2. DISTRIBUCIÓN
        text += `2. Distribución del Esfuerzo\n\n`;
        if (powerZones) {
            text += `ZONAS POTENCIA\n`;
            powerZones.forEach(z => {
                if (z.secs < 10) return;
                const m = Math.floor(z.secs / 60);
                const s = z.secs % 60;
                const total = powerZones.reduce((acc, curr) => acc + curr.secs, 0);
                const pct = total > 0 ? ((z.secs / total) * 100).toFixed(0) : 0;
                text += `${z.id}: ${m}:${s.toString().padStart(2, '0')} (${pct}%)\n`;
            });
            text += `\n`;
        }
        if (hrZones) {
            text += `ZONAS FC\n`;
            hrZones.forEach((secs, i) => {
                if (secs < 10) return;
                const m = Math.floor(secs / 60);
                const s = secs % 60;
                const total = hrZones.reduce((acc, curr) => acc + (curr || 0), 0);
                const pct = total > 0 ? ((secs / total) * 100).toFixed(0) : 0;
                text += `Z${i + 1}: ${m}:${s.toString().padStart(2, '0')} (${pct}%)\n`;
            });
            text += `\n`;
        }

        // 3. ANÁLISIS FISIOLÓGICO
        text += `3. Análisis Fisiológico\n\n`;
        text += `VI: ${viReal ? viReal.toFixed(2) : '—'}\n`;
        text += `DRIFT: ${driftReal !== null && driftValid.valid ? (driftReal * 100).toFixed(1) + '%' : 'N/A'}\n`;
        text += `EFICIENCIA: ${efficiency ? efficiency.toFixed(2) : '—'}\n\n`;

        if (z2Diagnosis) {
            text += `DIAGNÓSTICO Z2: ${z2Diagnosis.classification}\n`;
            z2Diagnosis.issues.forEach(issue => text += `• ${issue}\n`);
            text += `\n${z2Diagnosis.summary}\n\n`;
        }

        text += `DATOS COMPLETOS DE LA SESIÓN\n`;
        if (startTime) text += `Hora de inicio: ${startTime}\n`;
        if (npReal) text += `Potencia Normalizada: ${npReal} W\n`;
        if (apReal) text += `Potencia Media: ${apReal} W\n`;
        if (workKj) text += `Trabajo: ${workKj} kJ\n`;
        if (workAboveFtp !== null) text += `Trabajo > FTP: ${workAboveFtp} kJ\n`;
        if (fcMax) text += `FC Máxima: ${fcMax} bpm\n`;
        if (pwHr) text += `Potencia / FC: ${typeof pwHr === 'number' ? pwHr.toFixed(2) : pwHr}\n`;
        if (efficiency) text += `Eficiencia: ${efficiency.toFixed(2)}\n`;
        if (distKm) text += `Distancia: ${distKm} km\n`;
        if (elevGain) text += `Desnivel: ${elevGain} m\n`;
        if (cadAvg) text += `Cadencia Media: ${Math.round(cadAvg)} rpm\n`;
        if (tempAvg) text += `Temperatura: ${Number(tempAvg).toFixed(1)}°C\n`;
        if (calories) text += `Calorías: ${calories} kcal\n`;
        if (coastPct !== null) text += `Tiempo sin pedalear: ${coastPct.toFixed(0)}%\n`;
        if (weight) text += `Peso: ${Number(weight).toFixed(1)} kg\n\n`;

        if (trainingEffect || vo2max) {
            text += `TRAINING EFFECT (GARMIN)\n`;
            if (trainingEffect) text += `Aerobic Effect: ${trainingEffect.toFixed(1)}\n`;
            if (anaerobicEffect) text += `Anaerobic Effect: ${anaerobicEffect.toFixed(1)}\n`;
            if (vo2max) text += `VO2 Max: ${vo2max.toFixed(1)}\n`;
            if (perfCondition) text += `Performance Condition: ${perfCondition}\n`;
            if (recoveryTime) text += `Recuperación: ${recoveryTime.toFixed(0)} h\n\n`;
        }

        // 4. DATOS COMPLETOS
        text += `4. Datos Completos de la Sesión\n\n`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ─── STYLES ──────────────────────────────────────────────────
    const block = { padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' };
    const divider = { height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.75rem 0' };
    const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.3rem 0' };
    const T = {
        heading: { fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cyan)', margin: 0 },
        label: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' },
        value: { fontSize: '1rem', color: '#fff', fontFamily: 'var(--font-mono)' },
        meta: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' },
        translation: { fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, marginTop: '0.5rem' },
        alert: { fontSize: '0.85rem', color: '#fff', lineHeight: 1.5, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', borderLeft: '3px solid rgba(255,255,255,0.2)', marginBottom: '0.4rem' },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Header */}
            <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan)', letterSpacing: '0.2em', margin: 0 }}>
                        Análisis de Sesión — {planned.title || activityName}
                    </p>
                    <p style={T.meta}>{activityName} · {new Date(effectiveDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button
                    onClick={handleCopyAnalysis}
                    style={{
                        background: copied ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.05)',
                        border: `1px solid ${copied ? 'var(--green)' : 'rgba(6, 182, 212, 0.3)'}`,
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        color: copied ? 'var(--green)' : 'var(--cyan)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                    }}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {copied ? 'Copiado' : 'Copiar'}
                    </span>
                </button>
            </div>

            {/* ═══ 1. COHERENCIA CON EL PLAN ═══ */}
            <div style={block}>
                <p style={T.heading}>1. Coherencia con el Plan</p>
                <div style={divider} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <p style={{ ...T.meta, marginBottom: '0.5rem' }}>PLANIFICADO</p>
                        <div style={row}><span style={T.label}>Sesión</span><span style={T.value}>{planned.title || '—'}</span></div>
                        <div style={row}><span style={T.label}>TSS est.</span><span style={T.value}>{planned.tss || '—'}</span></div>
                        {isPlannedZ2 && <div style={row}><span style={T.label}>IF ideal</span><span style={T.value}>60-72%</span></div>}
                    </div>
                    <div>
                        <p style={{ ...T.meta, marginBottom: '0.5rem' }}>REALIZADO</p>
                        <div style={row}><span style={T.label}>Duración</span><span style={T.value}>{durationMins}'</span></div>
                        <div style={row}><span style={T.label}>TSS real</span><span style={T.value}>{tssReal}</span></div>
                        {ifReal !== null && <div style={row}><span style={T.label}>IF real</span><span style={T.value}>{(ifReal * 100).toFixed(0)}%</span></div>}
                    </div>
                </div>
            </div>

            {/* ═══ 2. DESGLOSE DE ZONAS (POTENCIA Y FC) ═══ */}
            {(powerZones || hrZones) && (
                <div style={block}>
                    <p style={T.heading}>2. Distribución del Esfuerzo</p>
                    <div style={divider} />

                    <div style={{ display: 'grid', gridTemplateColumns: powerZones && hrZones ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                        {powerZones && (
                            <div>
                                <p style={{ ...T.meta, marginBottom: '0.5rem', color: 'var(--cyan)' }}>ZONAS POTENCIA</p>
                                {powerZones.map((z, i) => {
                                    if (z.secs < 10) return null;
                                    const mins = Math.floor(z.secs / 60);
                                    const s = z.secs % 60;
                                    const total = powerZones.reduce((acc, curr) => acc + curr.secs, 0);
                                    const pct = total > 0 ? ((z.secs / total) * 100).toFixed(0) : 0;
                                    return (
                                        <div key={`pz-${i}`} style={row}>
                                            <span style={{ ...T.label, fontSize: '0.75rem' }}>{z.id || `Z${i + 1}`}</span>
                                            <span style={{ ...T.value, fontSize: '0.85rem' }}>{mins}:{s.toString().padStart(2, '0')} ({pct}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {hrZones && (
                            <div>
                                <p style={{ ...T.meta, marginBottom: '0.5rem', color: 'var(--cyan)' }}>ZONAS FC</p>
                                {hrZones.map((secs, i) => {
                                    if (secs < 10) return null;
                                    const mins = Math.floor(secs / 60);
                                    const s = secs % 60;
                                    const total = hrZones.reduce((acc, curr) => acc + (curr || 0), 0);
                                    const pct = total > 0 ? ((secs / total) * 100).toFixed(0) : 0;
                                    return (
                                        <div key={`hz-${i}`} style={row}>
                                            <span style={{ ...T.label, fontSize: '0.75rem', color: 'var(--cyan)' }}>Z{i + 1}</span>
                                            <span style={{ ...T.value, fontSize: '0.85rem' }}>{mins}:{s.toString().padStart(2, '0')} ({pct}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ 3. CALIDAD FISIOLÓGICA Y DIAGNÓSTICO ═══ */}
            <div style={block}>
                <p style={T.heading}>3. Análisis Fisiológico</p>
                <div style={divider} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={T.meta}>VI</div>
                        <div style={{ ...T.value, color: viReal > 1.08 ? 'var(--yellow)' : '#fff' }}>{viReal?.toFixed(2) || '—'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={T.meta}>DRIFT</div>
                        <div style={{ ...T.value, color: driftValid.valid && Math.abs(driftReal * 100) > 5 ? 'var(--yellow)' : '#fff' }}>
                            {driftReal !== null && driftValid.valid ? `${(driftReal * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={T.meta}>EFICIENCIA</div>
                        <div style={T.value}>{efficiency?.toFixed(2) || '—'}</div>
                    </div>
                </div>

                {z2Diagnosis && (
                    <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                        <p style={{ ...T.meta, color: 'var(--cyan)', marginBottom: '0.5rem', fontWeight: 900 }}>DIAGNÓSTICO Z2: {z2Diagnosis.classification}</p>
                        {z2Diagnosis.issues.map((msg, i) => <p key={i} style={{ ...T.meta, color: '#fff', marginBottom: '0.2rem' }}>• {msg}</p>)}
                        <p style={{ ...T.translation, fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9 }}>{z2Diagnosis.summary}</p>
                    </div>
                )}

                <div style={divider} />
                <p style={{ ...T.meta, marginBottom: '0.5rem' }}>DATOS COMPLETOS DE LA SESIÓN</p>

                {startTime && <div style={row}><span style={T.label}>Hora de inicio</span><span style={T.value}>{startTime}</span></div>}
                {npReal && <div style={row}><span style={T.label}>Potencia Normalizada</span><span style={T.value}>{npReal} W</span></div>}
                {apReal && <div style={row}><span style={T.label}>Potencia Media</span><span style={T.value}>{apReal} W</span></div>}
                {workKj && <div style={row}><span style={T.label}>Trabajo</span><span style={T.value}>{workKj} kJ</span></div>}
                {workAboveFtp !== null && <div style={row}><span style={T.label}>Trabajo &gt; FTP</span><span style={T.value}>{workAboveFtp} kJ</span></div>}
                {fcMax !== null && <div style={row}><span style={T.label}>FC Máxima</span><span style={T.value}>{fcMax} bpm</span></div>}
                {pwHr !== null && <div style={row}><span style={T.label}>Potencia / FC</span><span style={T.value}>{typeof pwHr === 'number' ? pwHr.toFixed(2) : pwHr}</span></div>}
                {efficiency !== null && <div style={row}><span style={T.label}>Eficiencia</span><span style={T.value}>{efficiency.toFixed(2)}</span></div>}
                {distKm !== null && <div style={row}><span style={T.label}>Distancia</span><span style={T.value}>{distKm} km</span></div>}
                {elevGain !== null && <div style={row}><span style={T.label}>Desnivel</span><span style={T.value}>{elevGain} m</span></div>}
                {cadAvg !== null && <div style={row}><span style={T.label}>Cadencia Media</span><span style={T.value}>{Math.round(cadAvg)} rpm</span></div>}
                {tempAvg !== null && <div style={row}><span style={T.label}>Temperatura</span><span style={T.value}>{Number(tempAvg).toFixed(1)}°C</span></div>}
                {calories !== null && <div style={row}><span style={T.label}>Calorías</span><span style={T.value}>{calories} kcal</span></div>}
                {coastPct !== null && <div style={row}><span style={T.label}>Tiempo sin pedalear</span><span style={T.value}>{coastPct.toFixed(0)}%</span></div>}
                {weight !== null && <div style={row}><span style={T.label}>Peso</span><span style={T.value}>{Number(weight).toFixed(1)} kg</span></div>}

                <div style={divider} />
                <p style={{ ...T.meta, marginBottom: '0.5rem' }}>TRAINING EFFECT (GARMIN)</p>
                {trainingEffect !== null && <div style={row}><span style={T.label}>Aerobic Effect</span><span style={T.value}>{trainingEffect.toFixed(1)}</span></div>}
                {anaerobicEffect !== null && <div style={row}><span style={T.label}>Anaerobic Effect</span><span style={T.value}>{anaerobicEffect?.toFixed(1) || '0.0'}</span></div>}
                {vo2max !== null && <div style={row}><span style={T.label}>VO2 Max</span><span style={T.value}>{vo2max.toFixed(1)}</span></div>}
                {perfCondition !== null && <div style={row}><span style={T.label}>Performance Condition</span><span style={T.value}>{perfCondition}</span></div>}
                {recoveryTime !== null && <div style={row}><span style={T.label}>Recuperación</span><span style={T.value}>{recoveryTime.toFixed(0)} h</span></div>}
            </div>


        </div>
    );
};

export default CoachPostWorkoutView;

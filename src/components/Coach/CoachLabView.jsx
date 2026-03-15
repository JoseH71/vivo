import React, { useState, useMemo, useEffect } from 'react';
import { fetchActivityLaps } from '../../services/intervalsService';

const CoachLabView = ({ historyData = [] }) => {
    const [labSubTab, setLabSubTab] = useState('physiology');
    const [sstEstimates, setSstEstimates] = useState(null);
    const [loadingSst, setLoadingSst] = useState(false);

    // ── Efecto para buscar y analizar sesiones SST y refinar el FTP ──
    useEffect(() => {
        const analyzeSST = async () => {
            if (!historyData || historyData.length < 5) return;
            const now = new Date();
            const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

            // 1. Identificar sesiones de ciclismo con "SST" en el nombre o descripcion
            const candidateActivities = [];
            historyData.forEach(day => {
                if (!day.activities) return;
                const dDate = new Date(day.id);
                if (dDate < cutoff90) return;

                day.activities.forEach(a => {
                    const name = (a.name || '').toLowerCase();
                    const desc = (a.description || '').toLowerCase();
                    const type = a.type || '';
                    const isBike = type === 'Ride' || type === 'VirtualRide' || type === 'Cycling';
                    
                    // IF entre 0.83 y 0.95 suele ser Sweet Spot
                    const ifVal = a.icu_intensity != null ? (a.icu_intensity > 2.0 ? a.icu_intensity / 100 : a.icu_intensity) : 0;
                    const isSstIF = ifVal >= 0.82 && ifVal <= 0.96;
                    
                    if (isBike && (name.includes('sst') || desc.includes('sst') || isSstIF)) {
                        candidateActivities.push(a);
                    }
                });
            });

            if (candidateActivities.length === 0) {
                setSstEstimates({ avgFTP: null, count: 0 });
                return;
            }

            setLoadingSst(true);
            try {
                // Tomamos un maximo de 5 sesiones SST recientes para no saturar la API
                const topSessions = candidateActivities
                    .sort((a, b) => b.start_date_local.localeCompare(a.start_date_local))
                    .slice(0, 5);

                const sessionFTPs = [];

                for (const session of topSessions) {
                    const laps = await fetchActivityLaps(session.id || session.activity_id);
                    if (!laps || laps.length === 0) {
                        console.log('[Lab SST] No laps found for:', session.name);
                        continue;
                    }

                    // Filtrar intervalos de trabajo: duracion >= 8 min
                    const workIntervals = laps.filter(lap => {
                        const durationSecs = lap.moving_time || lap.elapsed_time || 0;
                        const hr = lap.average_heartrate || lap.avg_hr || lap.average_hr || 0;
                        const pwr = lap.weighted_average_watts || lap.average_watts || 0;
                        // Al menos 8 min Y cierta potencia o pulso para confirmarlo como serie
                        return durationSecs >= 480 && (pwr > 150 || hr > 130);
                    });

                    console.log(`[Lab SST] Activity: ${session.name} | Work intervals: ${workIntervals.length}`);

                    if (workIntervals.length > 0) {
                        // Usamos la NP del intervalo (weighted_average_watts) si esta disponible
                        const avgNP = workIntervals.reduce((s, l) => s + (l.weighted_average_watts || l.average_watts || 0), 0) / workIntervals.length;
                        
                        if (avgNP > 100) { // Validacion de cordura
                            // Factor 0.89 (rango medio-bajo de SST para ser mas realista/agresivo que 0.90)
                            let ftpSst = avgNP / 0.89;

                            // Si el desacople medio de ESTA sesion es < 4%, sumamos un 2% extra
                            const avgDecoupling = workIntervals.reduce((s, l) => s + (l.decoupling || 0), 0) / workIntervals.length;
                            if (avgDecoupling !== 0 && avgDecoupling < 4) {
                                ftpSst *= 1.02;
                            }
                            console.log(`[Lab SST] Activity: ${session.name} | AvgNP: ${avgNP.toFixed(1)}W | Decoupling: ${avgDecoupling.toFixed(1)}% | Estimated FTP: ${ftpSst.toFixed(1)}W`);
                            sessionFTPs.push(ftpSst);
                        }
                    }
                }

                if (sessionFTPs.length > 0) {
                    // En lugar de la media de todas las sesiones, tomamos el MAXIMO
                    // El FTP se demuestra con la mejor sesion, no con el promedio de dias suaves/fuertes
                    const maxFTP = Math.max(...sessionFTPs);
                    console.log(`[Lab SST] Final MAX FTP chosen: ${maxFTP.toFixed(1)}W from ${sessionFTPs.length} sessions.`);
                    setSstEstimates({ avgFTP: maxFTP, count: sessionFTPs.length });
                } else {
                    console.log('[Lab SST] No valid session FTPs calculated.');
                    setSstEstimates({ avgFTP: null, count: 0 });
                }
            } catch (e) {
                console.error('[Lab] Error analizando SST:', e);
            } finally {
                setLoadingSst(false);
            }
        };

        analyzeSST();
    }, [historyData]);


    const block = { padding: '1.25rem 1.25rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' };
    const divider = { height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.75rem 0' };
    const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.3rem 0' };

    const T = {
        heading: { fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cyan)', margin: 0 },
        question: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', margin: '0.5rem 0 0.75rem' },
        meta: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' },
        label: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' },
        value: { fontSize: '1rem', color: '#fff', fontFamily: 'var(--font-mono)' },
        translation: { fontSize: '0.95rem', color: '#fff', lineHeight: 1.6, marginTop: '0.5rem' },
    };

    const DASH = '\u2014';
    const DOT = '\u00B7';
    const LEQ = '\u2264';
    const TIMES = '\u00D7';
    const MINUS = '\u2212';
    const ENDASH = '\u2013';
    const APPROX = '\u2248';
    const GEQ = '\u2265';

    const pearson = (arrX, arrY) => {
        const pairs = arrX.map((x, i) => [x, arrY[i]]).filter(([x, y]) => x != null && y != null && !isNaN(x) && !isNaN(y));
        if (pairs.length < 3) return { r: null, n: pairs.length };
        const xs = pairs.map(p => p[0]);
        const ys = pairs.map(p => p[1]);
        const n = xs.length;
        const sumX = xs.reduce((a, b) => a + b, 0);
        const sumY = ys.reduce((a, b) => a + b, 0);
        const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
        const sumX2 = xs.reduce((s, x) => s + x * x, 0);
        const sumY2 = ys.reduce((s, y) => s + y * y, 0);
        const num = n * sumXY - sumX * sumY;
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return { r: den === 0 ? 0 : num / den, n };
    };

    const fmtDate = (iso) => {
        if (!iso) return DASH;
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const fmtR = (r) => r !== null ? r.toFixed(2) : DASH;

    const translateStructural = (r) => {
        if (r === null) return 'No hay suficientes semanas completas para analizar la relacion.';
        if (r > 0.4) return 'Cuando tu carga semanal aumenta, tu HRV tiende a subir. Tu sistema tolera bien el volumen cronico.';
        if (r > 0.1) return 'La carga semanal sube ligeramente tu HRV. Tu sistema absorbe el volumen sin supresion clara.';
        if (r > -0.1) return 'La carga semanal no cambia tu HRV de forma consistente. Neutral.';
        if (r > -0.4) return 'Cuando subes el volumen semanal, tu HRV baja un poco. Tu sistema nota el estres acumulado.';
        return 'El aumento de carga suprime claramente tu HRV semana a semana. Monitorear recuperacion estructural.';
    };

    const translateAcute = (r) => {
        if (r === null) return 'No hay suficientes dias consecutivos con datos para calcular el impacto agudo.';
        if (r < -0.4) return `Lo que entrenas hoy tiene impacto directo en tu HRV de ma${String.fromCharCode(241)}ana. Tu sistema es sensible a la carga aguda.`;
        if (r < -0.15) return 'La carga de ayer tiene un efecto leve pero real sobre tu HRV de hoy. Sensibilidad aguda moderada.';
        if (r < 0.15) return 'La carga del dia anterior apenas afecta tu HRV. Tu sistema no es especialmente sensible a la carga aguda.';
        return 'Curiosamente, cuando entrenas mas, tu HRV tiende a subir al dia siguiente. Tu recuperacion aguda es muy eficiente.';
    };

    const translateDensity = (mean, max, atlCtl) => {
        const parts = [];
        if (mean > 0) {
            if (mean >= 4) parts.push(`Sueles encadenar ${mean.toFixed(1)} dias seguidos de entreno ${DASH} densidad alta.`);
            else if (mean >= 2.5) parts.push(`Encadenas de media casi ${mean.toFixed(1)} dias consecutivos. Ritmo sostenido.`);
            else parts.push(`Tu media es de ${mean.toFixed(1)} dias seguidos. Alternan bien carga y descanso.`);
        }
        if (max > 0) parts.push(`Tu racha mas larga fue de ${max} dias consecutivos.`);
        if (atlCtl !== null) {
            if (atlCtl > 1.25) parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: estas acumulando mas fatiga de la que puedes asimilar. Cuidado.`);
            else if (atlCtl > 1.1) parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: en el limite alto del rango fisiologico. Normal en fase de carga.`);
            else if (atlCtl < 0.8) parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: carga muy por debajo de tu nivel cronico. Semana tranquila.`);
            else parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: carga acumulada bien equilibrada.`);
        }
        return parts.join(' ') || 'Datos insuficientes.';
    };

    const translateRhrHrv = (r) => {
        if (r === null) return 'No hay suficientes dias con ambas metricas para calcular la coherencia.';
        if (r < -0.7) return `Cuando tu pulso sube, tu HRV baja ${DASH} y viceversa. Tu coherencia autonomica es fuerte.`;
        if (r < -0.4) return 'Hay una relacion inversa moderada entre tu pulso y tu HRV. Sistema razonablemente equilibrado.';
        if (r < -0.1) return 'La relacion inversa entre pulso y HRV es debil. Puede haber ruido en los datos o poca variabilidad.';
        return 'Tu pulso y tu HRV no muestran la relacion inversa esperada. Revisar calidad de los datos o ventana temporal.';
    };

    const translateCvHrv = (cv) => {
        if (cv === 0) return 'Sin datos suficientes de HRV.';
        if (cv < 8) return `Tu HRV es muy estable (CV = ${cv.toFixed(1)}%). Poco margen de variacion ${DASH} sistema muy regulado.`;
        if (cv < 12) return `Tu variabilidad electrica es estable (CV = ${cv.toFixed(1)}%). Rango fisiologico normal.`;
        if (cv < 18) return `Tu HRV varia bastante (CV = ${cv.toFixed(1)}%). Puede reflejar cargas irregulares o alta sensibilidad.`;
        return `Alta variacion de HRV (CV = ${cv.toFixed(1)}%). Puede indicar inestabilidad autonomica o factores externos fuertes.`;
    };

    const lab = useMemo(() => {
        if (!historyData || historyData.length < 14) return null;
        const sorted = [...historyData].sort((a, b) => new Date(a.id) - new Date(b.id));
        const today = new Date();
        const filterByDays = (days) => {
            const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
            return sorted.filter(d => new Date(d.id) >= cutoff);
        };

        const sixWeeksRaw = filterByDays(42);
        const weekMap = new Map();
        sixWeeksRaw.forEach(d => {
            const date = new Date(d.id);
            const day = date.getDay();
            const diff = date.getDate() - (day === 0 ? 6 : day - 1);
            const monday = new Date(date);
            monday.setDate(diff);
            const key = monday.toISOString().split('T')[0];
            if (!weekMap.has(key)) weekMap.set(key, []);
            weekMap.get(key).push(d);
        });

        const weeks = [];
        weekMap.forEach((days, weekStart) => {
            const hrv = days.filter(d => d.hrv != null).map(d => d.hrv);
            if (hrv.length === 0) return;
            weeks.push({
                weekStart,
                tss: days.reduce((s, d) => s + (d.dailyTSS || 0), 0),
                hrv: hrv.reduce((a, b) => a + b, 0) / hrv.length,
                atl: (() => { const v = days.filter(d => d.atl != null).map(d => d.atl); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; })(),
                ctl: (() => { const v = days.filter(d => d.ctl != null).map(d => d.ctl); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; })(),
            });
        });
        weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

        const corrTssHrv = pearson(weeks.map(w => w.tss), weeks.map(w => w.hrv));
        const corrAtlHrv = pearson(weeks.map(w => w.atl), weeks.map(w => w.hrv));
        const corrCtlHrv = pearson(weeks.map(w => w.ctl), weeks.map(w => w.hrv));

        const acuteRaw = filterByDays(21).sort((a, b) => new Date(a.id) - new Date(b.id));
        const lagTss = [], lagHrv = [], lagAtl = [];
        for (let i = 1; i < acuteRaw.length; i++) {
            const diff = Math.round((new Date(acuteRaw[i].id) - new Date(acuteRaw[i - 1].id)) / 86400000);
            if (diff === 1 && acuteRaw[i].hrv != null && acuteRaw[i - 1].dailyTSS != null) {
                lagTss.push(acuteRaw[i - 1].dailyTSS);
                lagHrv.push(acuteRaw[i].hrv);
                lagAtl.push(acuteRaw[i].atl);
            }
        }
        const acuteCorrTss = pearson(lagTss, lagHrv);
        const acuteCorrAtl = pearson(lagAtl, lagHrv);

        const densityRaw = filterByDays(30).sort((a, b) => new Date(a.id) - new Date(b.id));
        let streak = 0;
        const streaks = [];
        densityRaw.forEach(d => {
            if ((d.dailyTSS || 0) > 10) streak++;
            else { if (streak > 0) streaks.push(streak); streak = 0; }
        });
        if (streak > 0) streaks.push(streak);

        const avgStreak = streaks.length ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
        const maxStreak = streaks.length ? Math.max(...streaks) : 0;
        const atlCtlPairs = densityRaw.filter(d => d.atl != null && d.ctl != null && d.ctl > 0);
        const meanAtlCtl = atlCtlPairs.length ? atlCtlPairs.reduce((s, d) => s + d.atl / d.ctl, 0) / atlCtlPairs.length : null;
        const currentAtlCtl = atlCtlPairs.length ? atlCtlPairs[atlCtlPairs.length - 1].atl / atlCtlPairs[atlCtlPairs.length - 1].ctl : null;
        const tss3d = densityRaw.slice(-3).reduce((s, d) => s + (d.dailyTSS || 0), 0);

        const profileRaw = filterByDays(30);
        const pairedRhr = [], pairedHrv = [];
        profileRaw.forEach(d => {
            if (d.restingHR != null && d.hrv != null) { pairedRhr.push(d.restingHR); pairedHrv.push(d.hrv); }
        });
        const corrRhrHrv = pearson(pairedRhr, pairedHrv);
        const hrvVals = profileRaw.filter(d => d.hrv != null).map(d => d.hrv);
        const hrvMean = hrvVals.length ? hrvVals.reduce((a, b) => a + b, 0) / hrvVals.length : 0;
        const hrvSd = hrvVals.length > 1 ? Math.sqrt(hrvVals.reduce((sq, v) => sq + Math.pow(v - hrvMean, 2), 0) / (hrvVals.length - 1)) : 0;
        const cvHrv = hrvMean > 0 ? (hrvSd / hrvMean) * 100 : 0;

        return {
            structural: { periodStart: weeks.length ? weeks[0].weekStart : null, periodEnd: weeks.length ? weeks[weeks.length - 1].weekStart : null, n: weeks.length, corrTssHrv, corrAtlHrv, corrCtlHrv },
            acute: { periodStart: acuteRaw.length ? acuteRaw[0].id : null, periodEnd: acuteRaw.length ? acuteRaw[acuteRaw.length - 1].id : null, nTotal: acuteRaw.length, nPairs: acuteCorrTss.n, corrTss: acuteCorrTss, corrAtl: acuteCorrAtl },
            density: { periodStart: densityRaw.length ? densityRaw[0].id : null, periodEnd: densityRaw.length ? densityRaw[densityRaw.length - 1].id : null, nDays: densityRaw.length, avgStreak, maxStreak, nStreaks: streaks.length, meanAtlCtl, currentAtlCtl, tss3d },
            profile: { periodStart: profileRaw.length ? profileRaw[0].id : null, periodEnd: profileRaw.length ? profileRaw[profileRaw.length - 1].id : null, nDays: profileRaw.length, nPaired: corrRhrHrv.n, nHrv: hrvVals.length, corrRhrHrv, hrvMean, hrvSd, cvHrv }
        };
    }, [historyData]);

    const lt1 = useMemo(() => {
        if (!historyData || historyData.length < 7) return null;
        const FTP = 235;

        // ── Filtro temporal: solo ultimos 90 dias ──
        const now = new Date();
        const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // ── Recopilar actividades de ciclismo ──
        const allActivities = [];
        historyData.forEach(day => {
            if (!day.activities) return;
            const dayDate = new Date(day.id);
            if (dayDate < cutoff90) return; // filtro 90 dias

            day.activities.forEach(a => {
                const type = a.type || '';
                const isBike = type === 'Ride' || type === 'VirtualRide' || type === 'Cycling';
                if (!isBike) return;
                const actName = (a.name || '').toLowerCase();
                const actDesc = (a.description || '').toLowerCase();
                if (actName.includes('sst') || actDesc.includes('sst')) return;

                // IF > 0.78 = demasiado intenso para LT1
                let ifVal = a.icu_intensity != null ? a.icu_intensity : null;
                if (ifVal !== null && ifVal > 2.0) ifVal = ifVal / 100;
                if (ifVal !== null && ifVal > 0.78) return;

                const vi = a.icu_variability_index != null ? a.icu_variability_index : null;
                // Corte maximo absoluto: VI > 1.12 ni se considera
                if (vi !== null && vi > 1.12) return;

                const durationSecs = a.moving_time || a.elapsed_time || 0;
                const durationMins = durationSecs / 60;
                const np = a.icu_weighted_avg_watts || null;
                const ap = a.icu_average_watts || null;
                const fcMedia = a.average_heartrate || null;

                const hrZones = Array.isArray(a.icu_hr_zone_times) ? a.icu_hr_zone_times : null;
                const totalHrSecs = hrZones ? hrZones.reduce((s, z) => s + (z || 0), 0) : 0;
                const z1Secs = hrZones && hrZones[0] ? hrZones[0] : 0;
                const z2Secs = hrZones && hrZones[1] ? hrZones[1] : 0;
                const z3Secs = hrZones && hrZones[2] ? hrZones[2] : 0;
                const z2Pct = totalHrSecs > 0 ? z2Secs / totalHrSecs : 0;
                const z3Pct = totalHrSecs > 0 ? z3Secs / totalHrSecs : 0;
                const z1z2Pct = totalHrSecs > 0 ? (z1Secs + z2Secs) / totalHrSecs : 0;

                // Filtro base permisivo (Nivel C minimo): 60min, NP >= 60% FTP, VI <= 1.15, Z3 <= 35%
                if (durationMins >= 60 && np != null && np > 0 && np >= FTP * 0.60 && z1z2Pct >= 0.45 && vi <= 1.15 && z3Pct <= 0.35) {

                    // ── Clasificacion por niveles de calidad ──
                    // Nivel A: VI <= 1.08, %Z3 <= 15%, duracion >= 90 min, NP >= 65% FTP -> peso 1.0
                    // Nivel B: VI <= 1.12, %Z3 <= 30%, duracion >= 75 min, NP >= 65% FTP -> peso 0.6
                    // Nivel C: VI <= 1.15, %Z3 <= 35%, duracion >= 60 min, NP >= 60% FTP -> peso 0.15
                    let grade = 'C';
                    let qualityWeight = 0.15;

                    const isHighQuality = (vi === null || vi <= 1.12) && np >= FTP * 0.65 && z3Pct <= 0.30 && durationMins >= 75;
                    const isTopQuality = isHighQuality && (vi === null || vi <= 1.08) && z3Pct <= 0.15 && durationMins >= 90;

                    if (isTopQuality) {
                        grade = 'A';
                        qualityWeight = 1.0;
                    } else if (isHighQuality) {
                        grade = 'B';
                        qualityWeight = 0.6;
                    }
                    // else stays C = 0.15

                    allActivities.push({
                        date: day.id, name: a.name || 'Ride',
                        durationMins: Math.round(durationMins),
                        np, ap: ap || 0, vi, fcMedia, ifVal,
                        z2Pct, z3Pct, z1z2Pct,
                        grade, qualityWeight,
                    });
                }
            });
        });

        if (allActivities.length === 0) return null;

        // Ordenar por fecha desc, tomar hasta 12 sesiones
        allActivities.sort((a, b) => b.date.localeCompare(a.date));
        const sessions = allActivities.slice(0, 12);

        // ── Confidence Score (basado en peso acumulado) ──
        const totalQuality = sessions.reduce((s, a) => s + a.qualityWeight, 0);
        const nA = sessions.filter(s => s.grade === 'A').length;
        const nB = sessions.filter(s => s.grade === 'B').length;
        const nC = sessions.filter(s => s.grade === 'C').length;

        let confidence = 'limitada';
        let confidenceColor = 'var(--red)';
        let confidenceText = `${sessions.length} sesiones (${nA}A + ${nB}B + ${nC}C). Peso total: ${totalQuality.toFixed(1)}. Necesitas mas tiradas largas estables.`;
        if (totalQuality >= 3.0) {
            confidence = 'alta';
            confidenceColor = 'var(--green)';
            confidenceText = `${sessions.length} sesiones (${nA}A + ${nB}B + ${nC}C). Peso total: ${totalQuality.toFixed(1)}. Estimacion fiable.`;
        } else if (totalQuality >= 1.5) {
            confidence = 'media';
            confidenceColor = 'var(--yellow)';
            confidenceText = `${sessions.length} sesiones (${nA}A + ${nB}B + ${nC}C). Peso total: ${totalQuality.toFixed(1)}. Razonable, mejorara con mas datos.`;
        }

        // ── NP ponderada solo por calidad (sin duracion) ──
        // LT1 = sum(NP_i * peso_i) / sum(peso_i)
        // Sesiones de 3h no deben dominar tanto el calculo
        const weightedNP = sessions.reduce((s, a) => s + a.np * a.qualityWeight, 0) / totalQuality;
        const avgNP = sessions.reduce((s, a) => s + a.np, 0) / sessions.length;

        // ── Correccion fisiologica por %Z3 (ponderada, factor 0.08) ──
        // Antes 0.25 penalizaba demasiado. 0.08 mantiene correccion sin destruir dato
        const avgZ3 = sessions.reduce((s, a) => s + a.z3Pct * a.qualityWeight, 0) / totalQuality;
        const npCorrected = weightedNP * (1 - 0.08 * avgZ3);

        // ── LT1 Power ──
        const lt1PowerCenter = Math.round(npCorrected / 5) * 5;
        const lt1PowerLow = Math.round((npCorrected * 0.96) / 5) * 5;
        const lt1PowerHigh = Math.round((npCorrected * 1.04) / 5) * 5;

        // ── IF media ──
        const avgIF = sessions.reduce((s, a) => s + (a.ifVal || a.np / FTP), 0) / sessions.length;

        // ── LT1 HR (ponderado por calidad) ──
        const sessionsWithHR = sessions.filter(s => s.fcMedia != null);
        let lt1HR = null, lt1HRLow = null, lt1HRHigh = null;
        if (sessionsWithHR.length > 0) {
            const hrTotalWeight = sessionsWithHR.reduce((s, a) => s + a.qualityWeight, 0);
            const avgFC = sessionsWithHR.reduce((s, a) => s + a.fcMedia * a.qualityWeight, 0) / hrTotalWeight;
            lt1HR = Math.round(avgFC * (1 - 0.1 * avgZ3));
            lt1HRLow = lt1HR - 3;
            lt1HRHigh = lt1HR + 3;
        }

        // ── % FTP y perfil ──
        const lt1PctFTP = Math.round((lt1PowerCenter / FTP) * 100);
        let aerobicProfile = 'medio', lt1FtpRatio = 0.72;
        if (lt1PctFTP < 70) lt1FtpRatio = 0.70;
        else if (lt1PctFTP <= 73) lt1FtpRatio = 0.72;
        else lt1FtpRatio = 0.74;

        if (lt1PctFTP >= 74) { aerobicProfile = 'diesel'; }
        else if (lt1PctFTP >= 70) { aerobicProfile = 'medio'; }
        else { aerobicProfile = 'aerobico base'; }
        
        const ftpFromLT1 = lt1PowerCenter / lt1FtpRatio;
        let blendedFTP = ftpFromLT1;
        if (sstEstimates && sstEstimates.avgFTP) {
            blendedFTP = (0.6 * sstEstimates.avgFTP) + (0.4 * ftpFromLT1);
        }
        const estimatedRealFTP = Math.round(blendedFTP);

        const z2Low = Math.round(lt1PowerCenter * 0.88 / 5) * 5;
        const z2High = Math.round(lt1PowerCenter * 0.97 / 5) * 5;

        let profileText = '';
        if (lt1PctFTP >= 75) profileText = 'Motor aerobico excepcional. Base de elite. Tu eficiencia metabolica es sobresaliente.';
        else if (lt1PctFTP >= 72) profileText = 'Perfil diesel. Gran capacidad para esfuerzos largos, recuperacion eficiente y alta oxidacion de grasas.';
        else if (lt1PctFTP >= 68) profileText = 'Perfil medio-aerobico. Buen equilibrio entre resistencia y potencia. Base aerobica bien desarrollada.';
        else if (lt1PctFTP >= 65) profileText = 'Perfil aerobico base. Buen potencial de mejora en el motor de resistencia. Priorizar volumen Z2.';
        else profileText = 'Base aerobica en fase inicial. Priorizar volumen Z2 para construir eficiencia mitocondrial.';

        const totalDur = sessions.reduce((s, a) => s + a.durationMins, 0);
        let summaryText = `Basado en ${sessions.length} sesiones (${nA}A + ${nB}B + ${nC}C) de los ultimos 90 dias, `;
        summaryText += `NP ponderada por calidad: ${Math.round(weightedNP)} W, corregida por Z3 (${MINUS}${(avgZ3 * 8).toFixed(1)}%): ${Math.round(npCorrected)} W. `;
        summaryText += `LT1 estimado: ${lt1PowerLow}${ENDASH}${lt1PowerHigh} W (${lt1PctFTP}% FTP)`;
        if (lt1HR) summaryText += `, FC ~${lt1HRLow}${ENDASH}${lt1HRHigh} bpm`;
        summaryText += `. Perfil: ${aerobicProfile}. ${profileText}`;
        if (sstEstimates && sstEstimates.avgFTP) {
            summaryText += ` Estimacion FTP refinada con ${sstEstimates.count} sesiones SST (${Math.round(sstEstimates.avgFTP)}W).`;
        }

        return {
            powerCenter: lt1PowerCenter, powerLow: lt1PowerLow, powerHigh: lt1PowerHigh,
            hr: lt1HR, hrLow: lt1HRLow, hrHigh: lt1HRHigh, pctFTP: lt1PctFTP,
            ftp: FTP, estimatedRealFTP, aerobicProfile, lt1FtpRatio,
            z2Range: { low: z2Low, high: z2High },
            confidence, confidenceColor, confidenceText,
            sessions, nA, nB, nC, totalQuality,
            avgNP: Math.round(avgNP), weightedNP: Math.round(weightedNP), npCorrected: Math.round(npCorrected),
            avgIF: avgIF ? (avgIF * 100).toFixed(0) : null, avgZ3Pct: (avgZ3 * 100).toFixed(0),
            totalDur, profileText, summaryText,
            sstFTP: sstEstimates?.avgFTP ? Math.round(sstEstimates.avgFTP) : null,
            sstCount: sstEstimates?.count || 0,
            loadingSst
        };
    }, [historyData, sstEstimates, loadingSst]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                    { id: 'physiology', label: 'Fisiologia', emoji: String.fromCodePoint(0x1F4C8) },
                    { id: 'lt1', label: 'LT1', emoji: String.fromCodePoint(0x1F3AF) },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setLabSubTab(tab.id)}
                        className={`tap-active ${labSubTab !== tab.id ? 'hover-lift' : ''}`}
                        style={{
                            flex: 1, padding: '0.85rem 0.5rem', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: labSubTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                            color: labSubTab === tab.id ? 'var(--cyan)' : 'var(--text-muted)',
                            border: labSubTab === tab.id ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                            boxShadow: labSubTab === tab.id ? '0 8px 16px rgba(0,0,0,0.3)' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.2, 1, 0.3, 1)',
                            cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                        <span>{tab.emoji}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {labSubTab === 'physiology' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!lab ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                            <p style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: '0.5rem' }}>LABORATORIO</p>
                            <p>{'Se requieren al menos 14 dias con HRV, TSS y FC en reposo para generar el analisis.'}</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan)', letterSpacing: '0.2em', margin: 0 }}>
                                    {`Laboratorio ${DASH} Analisis Estadistico Fisiologico`}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                                    {'Metodo: Pearson r. Solo asociacion lineal, sin inferencia causal. Fuente: Intervals.icu.'}
                                </p>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'1. Adaptacion Estructural'}</p>
                                <p style={T.question}>{'Cuando entreno mas durante semanas, mi HRV mejora o empeora?'}</p>
                                <p style={T.meta}>{`Periodo: ${fmtDate(lab.structural.periodStart)} ${DASH} ${fmtDate(lab.structural.periodEnd)} ${DOT} N semanas: ${lab.structural.n} ${DOT} Ventana: 6 semanas / semana ISO`}</p>
                                <div style={divider} />
                                <div style={row}><span style={T.label}>r(TSS_sem, HRV_sem)</span><span style={T.value}>{fmtR(lab.structural.corrTssHrv.r)}</span></div>
                                <div style={row}><span style={T.label}>r(ATL_sem, HRV_sem)</span><span style={T.value}>{fmtR(lab.structural.corrAtlHrv.r)}</span></div>
                                <div style={row}><span style={T.label}>r(CTL_sem, HRV_sem)</span><span style={T.value}>{fmtR(lab.structural.corrCtlHrv.r)}</span></div>
                                <div style={divider} />
                                <p style={T.translation}>{translateStructural(lab.structural.corrTssHrv.r)}</p>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'2. Reactividad Aguda'}</p>
                                <p style={T.question}>{'Lo que entreno ayer afecta a mi HRV de hoy?'}</p>
                                <p style={T.meta}>{`Periodo: ${fmtDate(lab.acute.periodStart)} ${DASH} ${fmtDate(lab.acute.periodEnd)} ${DOT} ${lab.acute.nTotal} dias en ventana ${DOT} N pares consecutivos validos: ${lab.acute.nPairs} ${DOT} Lag 1 dia verificado`}</p>
                                <div style={divider} />
                                <div style={row}><span style={T.label}>r(TSS_d-1, HRV_hoy)</span><span style={T.value}>{fmtR(lab.acute.corrTss.r)}</span></div>
                                <div style={row}><span style={T.label}>r(ATL_hoy, HRV_hoy)</span><span style={T.value}>{fmtR(lab.acute.corrAtl.r)}</span></div>
                                <div style={divider} />
                                <p style={T.translation}>{translateAcute(lab.acute.corrTss.r)}</p>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'3. Densidad y Acumulacion'}</p>
                                <p style={T.question}>{'Estoy acumulando demasiados dias seguidos o demasiada fatiga?'}</p>
                                <p style={T.meta}>{`Periodo: ${fmtDate(lab.density.periodStart)} ${DASH} ${fmtDate(lab.density.periodEnd)} ${DOT} ${lab.density.nDays} dias ${DOT} Criterio dia entreno: TSS > 10`}</p>
                                <div style={divider} />
                                <div style={row}><span style={T.label}>Dias consecutivos (media)</span><span style={T.value}>{lab.density.avgStreak.toFixed(1)}</span></div>
                                <div style={row}><span style={T.label}>Dias consecutivos (max)</span><span style={T.value}>{lab.density.maxStreak}</span></div>
                                <div style={row}><span style={T.label}>TSS acumulado ultimos 3 dias</span><span style={T.value}>{lab.density.tss3d}</span></div>
                                <div style={row}><span style={T.label}>ATL/CTL medio (30d)</span><span style={T.value}>{lab.density.meanAtlCtl !== null ? lab.density.meanAtlCtl.toFixed(2) : DASH}</span></div>
                                <div style={row}><span style={T.label}>ATL/CTL actual</span><span style={T.value}>{lab.density.currentAtlCtl !== null ? lab.density.currentAtlCtl.toFixed(2) : DASH}</span></div>
                                <div style={divider} />
                                <p style={T.translation}>{translateDensity(lab.density.avgStreak, lab.density.maxStreak, lab.density.meanAtlCtl)}</p>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'4. Perfil Autonomico'}</p>
                                <p style={T.question}>{'Mi pulso y mi HRV estan bien sincronizados? Mi sistema es estable?'}</p>
                                <p style={T.meta}>{`Periodo: ${fmtDate(lab.profile.periodStart)} ${DASH} ${fmtDate(lab.profile.periodEnd)} ${DOT} ${lab.profile.nDays} dias ${DOT} N con HRV: ${lab.profile.nHrv} ${DOT} N pareados (RHR+HRV): ${lab.profile.nPaired}`}</p>
                                <div style={divider} />
                                <div style={row}><span style={T.label}>r(RHR, HRV)</span><span style={T.value}>{fmtR(lab.profile.corrRhrHrv.r)}</span></div>
                                <p style={{ ...T.translation, marginTop: '0.25rem', marginBottom: '0.75rem' }}>{translateRhrHrv(lab.profile.corrRhrHrv.r)}</p>
                                <div style={divider} />
                                <div style={row}><span style={T.label}>HRV media (30d)</span><span style={T.value}>{lab.profile.hrvMean.toFixed(1)} ms</span></div>
                                <div style={row}><span style={T.label}>Desviacion tipica HRV</span><span style={T.value}>{lab.profile.hrvSd.toFixed(1)} ms</span></div>
                                <div style={row}><span style={T.label}>CV HRV (variabilidad estructural)</span><span style={T.value}>{lab.profile.cvHrv.toFixed(1)}%</span></div>
                                <div style={divider} />
                                <p style={T.translation}>{translateCvHrv(lab.profile.cvHrv)}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {labSubTab === 'lt1' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!lt1 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                            <p style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: '0.5rem' }}>{`LT1 ${DASH} UMBRAL AEROBICO`}</p>
                            <p>{`Se necesitan sesiones de ciclismo de al menos 60 minutos (${GEQ}45% Z1+Z2, IF ${LEQ} 0.78, NP ${GEQ} 60% FTP, %Z3 ${LEQ} 35%) con potencia normalizada.`}</p>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>{'Se excluyen sesiones SST y rides con VI > 1.15. Sistema de calidad dual (Alta vs Media).'}</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan)', letterSpacing: '0.2em', margin: 0 }}>
                                            {`LT1 ${DASH} Umbral Aerobico`}
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.35rem' }}>
                                            {`Dual A/B/C ${DOT} VI ${LEQ} 1.15 ${DOT} ${GEQ}60 min ${DOT} NP ${GEQ} 60%FTP ${DOT} %Z3 ${LEQ} 35%`}
                                        </p>
                                    </div>
                                    <div style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: `${lt1.confidenceColor}15`, border: `1px solid ${lt1.confidenceColor}40`, display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: lt1.confidenceColor, boxShadow: `0 0 8px ${lt1.confidenceColor}` }} />
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: lt1.confidenceColor }}>{lt1.confidence}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'Perfil Aerobico'}</p>
                                <p style={T.question}>{'Cual es mi rango de potencia y FC en el primer umbral?'}</p>
                                <div style={divider} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ background: 'rgba(6, 182, 212, 0.06)', padding: '1rem 0.75rem', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(6, 182, 212, 0.12)' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--cyan)', marginBottom: '0.4rem' }}>LT1 Potencia</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{`${lt1.powerLow}${ENDASH}${lt1.powerHigh}`}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>vatios</div>
                                    </div>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '1rem 0.75rem', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--red)', marginBottom: '0.4rem' }}>LT1 FC</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{lt1.hrLow && lt1.hrHigh ? `${lt1.hrLow}${ENDASH}${lt1.hrHigh}` : DASH}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>bpm</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ background: 'rgba(168, 85, 247, 0.06)', padding: '0.75rem', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(168, 85, 247, 0.12)' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--purple)', marginBottom: '0.3rem' }}>% FTP</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{lt1.pctFTP}%</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>de {lt1.ftp}W ref</div>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.06)', padding: '0.75rem', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.12)' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--green)', marginBottom: '0.3rem' }}>Perfil</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>{lt1.aerobicProfile}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{`LT1/FTP ${APPROX} ${Math.round(lt1.lt1FtpRatio * 100)}%`}</div>
                                    </div>
                                </div>

                                <div style={row}><span style={T.label}>FTP de referencia</span><span style={T.value}>{lt1.ftp} W</span></div>
                                <div style={row}><span style={T.label}>FTP estimado real</span><span style={{ ...T.value, color: lt1.estimatedRealFTP > lt1.ftp ? 'var(--green)' : '#fff' }}>~{lt1.estimatedRealFTP} W</span></div>
                                
                                {lt1.sstFTP && (
                                    <div style={{ ...row, marginTop: '-0.2rem', paddingBottom: '0.5rem' }}>
                                        <span style={{ ...T.label, fontSize: '0.7rem', opacity: 0.6, paddingLeft: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                            {`${APPROX} 60% SST (${lt1.sstCount} ses) + 40% LT1`}
                                        </span>
                                        <span style={{ ...T.value, fontSize: '0.75rem', opacity: 0.6 }}>{Math.round(lt1.sstFTP)} W</span>
                                    </div>
                                )}
                                {lt1.loadingSst && (
                                    <div style={{ ...row, marginTop: '-0.2rem' }}>
                                        <span style={{ ...T.label, fontSize: '0.65rem', opacity: 0.5, fontStyle: 'italic', paddingLeft: '0.75rem' }}>Analizando series SST...</span>
                                    </div>
                                )}
                                <div style={divider} />

                                <div style={{ padding: '0.6rem 0.85rem', borderRadius: '10px', background: `${lt1.confidenceColor}08`, border: `1px solid ${lt1.confidenceColor}20`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: lt1.confidenceColor, boxShadow: `0 0 10px ${lt1.confidenceColor}`, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                                        {`Confianza ${lt1.confidence}: ${lt1.confidenceText}`}
                                    </span>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}><p style={T.translation}>{lt1.profileText}</p></div>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'Zona Aerobica Optima'}</p>
                                <p style={T.question}>{'A que potencia deberia rodar en mis sesiones de base?'}</p>
                                <div style={divider} />
                                <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(6, 182, 212, 0.08))', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(34, 197, 94, 0.15)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--green)', marginBottom: '0.5rem' }}>Rango Z2 Recomendado</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{`${lt1.z2Range.low}${ENDASH}${lt1.z2Range.high}`} <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>W</span></div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem' }}>{`88${ENDASH}97% de tu LT1 estimado (${lt1.powerCenter} W)`}</div>
                                </div>
                                <div style={divider} />
                                <p style={T.translation}>{'Entrenar en este rango maximiza la oxidacion de grasas y la adaptacion mitocondrial sin generar fatiga residual significativa. Es la zona donde tu motor aerobico se construye de forma mas eficiente.'}</p>
                            </div>

                            <div style={block}>
                                <p style={T.heading}>{'Datos del Calculo'}</p>
                                <p style={T.question}>{'De donde salen estos numeros?'}</p>
                                <p style={T.meta}>{`${lt1.sessions.length} sesiones (${lt1.nA}A + ${lt1.nB}B + ${lt1.nC}C) ${DOT} Peso total: ${lt1.totalQuality.toFixed(1)} ${DOT} NP ponderada: ${lt1.weightedNP} W ${DOT} NP corr: ${lt1.npCorrected} W`}</p>
                                <p style={{ ...T.meta, marginTop: '0.25rem' }}>{`LT1 = sum(NP${TIMES}peso) / sum(peso) ${DOT} NP_corr = NP${TIMES}(1${MINUS}0.08${TIMES}%Z3)`}</p>
                                <p style={{ ...T.meta, marginTop: '0.25rem' }}>{`FTP_final = 0.6${TIMES}Max(SST_sesion ${DOT} NP/0.89) + 0.4${TIMES}FTP_LT1`}</p>
                                <div style={divider} />
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                {['', 'Fecha', 'Dur', 'NP', 'VI', 'FC', '%Z2', '%Z3'].map(h => (
                                                    <th key={h} style={{ textAlign: h === 'Fecha' || h === '' ? 'left' : 'right', padding: '0.4rem 0.3rem', color: '#fff', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', width: h === '' ? '24px' : 'auto' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lt1.sessions.map((s, i) => {
                                                const gradeColors = { A: 'var(--green)', B: 'var(--yellow)', C: 'var(--red)' };
                                                const gc = gradeColors[s.grade] || '#fff';
                                                return (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '0.4rem 0.3rem' }}>
                                                        <span style={{ display: 'inline-block', width: '20px', height: '20px', lineHeight: '20px', textAlign: 'center', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 600, background: `${gc}18`, color: gc, border: `1px solid ${gc}40` }}>{s.grade}</span>
                                                    </td>
                                                    <td style={{ padding: '0.4rem 0.3rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>{fmtDate(s.date)}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)' }}>{s.durationMins}'</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)' }}>{s.np}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>{s.vi != null ? s.vi.toFixed(2) : DASH}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)' }}>{s.fcMedia || DASH}</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>{(s.z2Pct * 100).toFixed(0)}%</td>
                                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>{(s.z3Pct * 100).toFixed(0)}%</td>
                                                </tr>);
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={divider} />
                                <p style={T.translation}>{lt1.summaryText}</p>
                            </div>

                            <div style={{ ...block, background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(168, 85, 247, 0.04))', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                                <p style={T.heading}>{'Resumen del Perfil Aerobico'}</p>
                                <div style={divider} />
                                <div style={row}><span style={T.label}>FTP</span><span style={T.value}>{`~${lt1.ftp} W (ref) / ~${lt1.estimatedRealFTP} W (est)`}</span></div>
                                <div style={row}><span style={T.label}>Rango LT1</span><span style={T.value}>{`${lt1.powerLow}${ENDASH}${lt1.powerHigh} W`}</span></div>
                                {lt1.hr && (<div style={row}><span style={T.label}>FC LT1</span><span style={T.value}>{`${lt1.hrLow}${ENDASH}${lt1.hrHigh} bpm`}</span></div>)}
                                <div style={row}><span style={T.label}>LT1 / FTP</span><span style={T.value}>{lt1.pctFTP}%</span></div>
                                <div style={row}><span style={T.label}>Perfil aerobico</span><span style={{ ...T.value, textTransform: 'capitalize' }}>{lt1.aerobicProfile}</span></div>
                                <div style={row}><span style={T.label}>Zona Z2 optima</span><span style={T.value}>{`${lt1.z2Range.low}${ENDASH}${lt1.z2Range.high} W`}</span></div>
                                <div style={row}><span style={T.label}>Confianza</span><span style={{ ...T.value, color: lt1.confidenceColor, textTransform: 'capitalize' }}>{`${lt1.confidence} (${lt1.sessions.length} sesiones)`}</span></div>
                                <div style={divider} />
                                <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
                                        {`${String.fromCodePoint(0x26A0, 0xFE0F)} Calidad dual (Pesos: A=1.0, B=0.6, C=0.15). NP ponderada corregida Z3 (0.08). ${GEQ}60 min, VI ${LEQ} 1.15, NP ${GEQ} 60% FTP, Z3 ${LEQ} 35%. Ultimos 90 dias. LT1 = rango.`}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
    );
};

export default CoachLabView;
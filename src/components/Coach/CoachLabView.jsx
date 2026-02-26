import React, { useMemo } from 'react';

/**
 * LABORATORIO v3.0 — Clínico y Entendible
 * 
 * Formato por bloque:
 * 1. Periodo analizado
 * 2. Pregunta que responde
 * 3. Resultado numérico (r, N, valores)
 * 4. Traducción fisiológica en 1-2 frases
 */

const CoachLabView = ({ historyData = [] }) => {

    // ─── ENGINE ─────────────────────────────────────────────────────
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
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const fmtR = (r) => r !== null ? r.toFixed(2) : '—';

    // ─── TRANSLATIONS ───────────────────────────────────────────────
    const translateStructural = (r) => {
        if (r === null) return 'No hay suficientes semanas completas para analizar la relación.';
        if (r > 0.4) return `Cuando tu carga semanal aumenta, tu HRV tiende a subir. Tu sistema tolera bien el volumen crónico.`;
        if (r > 0.1) return `La carga semanal sube ligeramente tu HRV. Tu sistema absorbe el volumen sin supresión clara.`;
        if (r > -0.1) return `La carga semanal no cambia tu HRV de forma consistente. Neutral.`;
        if (r > -0.4) return `Cuando subes el volumen semanal, tu HRV baja un poco. Tu sistema nota el estrés acumulado.`;
        return `El aumento de carga suprime claramente tu HRV semana a semana. Monitorear recuperación estructural.`;
    };

    const translateAcute = (r) => {
        if (r === null) return 'No hay suficientes días consecutivos con datos para calcular el impacto agudo.';
        if (r < -0.4) return `Lo que entrenas hoy tiene impacto directo en tu HRV de mañana. Tu sistema es sensible a la carga aguda.`;
        if (r < -0.15) return `La carga de ayer tiene un efecto leve pero real sobre tu HRV de hoy. Sensibilidad aguda moderada.`;
        if (r < 0.15) return `La carga del día anterior apenas afecta tu HRV. Tu sistema no es especialmente sensible a la carga aguda.`;
        return `Curiosamente, cuando entrenas más, tu HRV tiende a subir al día siguiente. Tu recuperación aguda es muy eficiente.`;
    };

    const translateDensity = (mean, max, atlCtl) => {
        const parts = [];
        if (mean > 0) {
            if (mean >= 4) parts.push(`Sueles encadenar ${mean.toFixed(1)} días seguidos de entreno — densidad alta.`);
            else if (mean >= 2.5) parts.push(`Encadenas de media casi ${mean.toFixed(1)} días consecutivos. Ritmo sostenido.`);
            else parts.push(`Tu media es de ${mean.toFixed(1)} días seguidos. Alternan bien carga y descanso.`);
        }
        if (max > 0) parts.push(`Tu racha más larga fue de ${max} días consecutivos.`);
        if (atlCtl !== null) {
            if (atlCtl > 1.25) parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: estás acumulando más fatiga de la que puedes asimilar. Cuidado.`);
            else if (atlCtl > 1.1) parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: en el límite alto del rango fisiológico. Normal en fase de carga.`);
            else if (atlCtl < 0.8) parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: carga muy por debajo de tu nivel crónico. Semana tranquila.`);
            else parts.push(`ATL/CTL = ${atlCtl.toFixed(2)}: carga acumulada bien equilibrada.`);
        }
        return parts.join(' ') || 'Datos insuficientes.';
    };

    const translateRhrHrv = (r) => {
        if (r === null) return 'No hay suficientes días con ambas métricas para calcular la coherencia.';
        if (r < -0.7) return `Cuando tu pulso sube, tu HRV baja — y viceversa. Tu coherencia autonómica es fuerte.`;
        if (r < -0.4) return `Hay una relación inversa moderada entre tu pulso y tu HRV. Sistema razonablemente equilibrado.`;
        if (r < -0.1) return `La relación inversa entre pulso y HRV es débil. Puede haber ruido en los datos o poca variabilidad.`;
        return `Tu pulso y tu HRV no muestran la relación inversa esperada. Revisar calidad de los datos o ventana temporal.`;
    };

    const translateCvHrv = (cv) => {
        if (cv === 0) return 'Sin datos suficientes de HRV.';
        if (cv < 8) return `Tu HRV es muy estable (CV = ${cv.toFixed(1)}%). Poco margen de variación — sistema muy regulado.`;
        if (cv < 12) return `Tu variabilidad eléctrica es estable (CV = ${cv.toFixed(1)}%). Rango fisiológico normal.`;
        if (cv < 18) return `Tu HRV varía bastante (CV = ${cv.toFixed(1)}%). Puede reflejar cargas irregulares o alta sensibilidad.`;
        return `Alta variación de HRV (CV = ${cv.toFixed(1)}%). Puede indicar inestabilidad autonómica o factores externos fuertes.`;
    };

    // ─── CALCULATIONS ───────────────────────────────────────────────
    const lab = useMemo(() => {
        if (!historyData || historyData.length < 14) return null;

        const sorted = [...historyData].sort((a, b) => new Date(a.id) - new Date(b.id));
        const today = new Date();
        const filterByDays = (days) => {
            const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
            return sorted.filter(d => new Date(d.id) >= cutoff);
        };

        // ── 1. ESTRUCTURAL (6 semanas, agrupado por semana ISO) ──
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

        // ── 2. AGUDA (21 días, lag 1 verificado) ──
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

        // ── 3. DENSIDAD (30 días) ──
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

        // ── 4. PERFIL AUTONÓMICO (30 días) ──
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
            structural: {
                periodStart: weeks.length ? weeks[0].weekStart : null,
                periodEnd: weeks.length ? weeks[weeks.length - 1].weekStart : null,
                n: weeks.length,
                corrTssHrv, corrAtlHrv, corrCtlHrv
            },
            acute: {
                periodStart: acuteRaw.length ? acuteRaw[0].id : null,
                periodEnd: acuteRaw.length ? acuteRaw[acuteRaw.length - 1].id : null,
                nTotal: acuteRaw.length,
                nPairs: acuteCorrTss.n,
                corrTss: acuteCorrTss,
                corrAtl: acuteCorrAtl
            },
            density: {
                periodStart: densityRaw.length ? densityRaw[0].id : null,
                periodEnd: densityRaw.length ? densityRaw[densityRaw.length - 1].id : null,
                nDays: densityRaw.length,
                avgStreak, maxStreak, nStreaks: streaks.length,
                meanAtlCtl, currentAtlCtl, tss3d
            },
            profile: {
                periodStart: profileRaw.length ? profileRaw[0].id : null,
                periodEnd: profileRaw.length ? profileRaw[profileRaw.length - 1].id : null,
                nDays: profileRaw.length,
                nPaired: corrRhrHrv.n,
                nHrv: hrvVals.length,
                corrRhrHrv, hrvMean, hrvSd, cvHrv
            }
        };
    }, [historyData]);

    // ─── STYLES ─────────────────────────────────────────────────────
    const block = { padding: '1.25rem 1.25rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' };
    const divider = { height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.75rem 0' };
    const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.3rem 0' };

    const T = {
        heading: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cyan)', margin: 0 },
        question: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: '0.5rem 0 0.75rem' },
        meta: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' },
        label: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' },
        value: { fontSize: '1rem', color: '#fff', fontFamily: 'var(--font-mono)' },
        translation: { fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, marginTop: '0.5rem' },
    };

    if (!lab) return (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
            <p style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: '0.5rem' }}>LABORATORIO</p>
            <p>Se requieren al menos 14 días con HRV, TSS y FC en reposo para generar el análisis.</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Cabecera */}
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan)', letterSpacing: '0.2em', margin: 0 }}>
                    Laboratorio — Análisis Estadístico Fisiológico
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                    Método: Pearson r. Solo asociación lineal, sin inferencia causal. Fuente: Intervals.icu.
                </p>
            </div>

            {/* ═══ 1. ADAPTACIÓN ESTRUCTURAL ═══ */}
            <div style={block}>
                <p style={T.heading}>1. Adaptación Estructural</p>
                <p style={T.question}>¿Cuando entreno más durante semanas, mi HRV mejora o empeora?</p>

                <p style={T.meta}>
                    Periodo: {fmtDate(lab.structural.periodStart)} — {fmtDate(lab.structural.periodEnd)} · N semanas: {lab.structural.n} · Ventana: 6 semanas / semana ISO
                </p>

                <div style={divider} />

                <div style={row}>
                    <span style={T.label}>r(TSS_sem, HRV_sem)</span>
                    <span style={T.value}>{fmtR(lab.structural.corrTssHrv.r)}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>r(ATL_sem, HRV_sem)</span>
                    <span style={T.value}>{fmtR(lab.structural.corrAtlHrv.r)}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>r(CTL_sem, HRV_sem)</span>
                    <span style={T.value}>{fmtR(lab.structural.corrCtlHrv.r)}</span>
                </div>

                <div style={divider} />
                <p style={T.translation}>{translateStructural(lab.structural.corrTssHrv.r)}</p>
            </div>

            {/* ═══ 2. REACTIVIDAD AGUDA ═══ */}
            <div style={block}>
                <p style={T.heading}>2. Reactividad Aguda</p>
                <p style={T.question}>¿Lo que entreno ayer afecta a mi HRV de hoy?</p>

                <p style={T.meta}>
                    Periodo: {fmtDate(lab.acute.periodStart)} — {fmtDate(lab.acute.periodEnd)} · {lab.acute.nTotal} días en ventana · N pares consecutivos válidos: {lab.acute.nPairs} · Lag 1 día verificado
                </p>

                <div style={divider} />

                <div style={row}>
                    <span style={T.label}>r(TSS_d-1, HRV_hoy)</span>
                    <span style={T.value}>{fmtR(lab.acute.corrTss.r)}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>r(ATL_hoy, HRV_hoy)</span>
                    <span style={T.value}>{fmtR(lab.acute.corrAtl.r)}</span>
                </div>

                <div style={divider} />
                <p style={T.translation}>{translateAcute(lab.acute.corrTss.r)}</p>
            </div>

            {/* ═══ 3. DENSIDAD Y ACUMULACIÓN ═══ */}
            <div style={block}>
                <p style={T.heading}>3. Densidad y Acumulación</p>
                <p style={T.question}>¿Estoy acumulando demasiados días seguidos o demasiada fatiga?</p>

                <p style={T.meta}>
                    Periodo: {fmtDate(lab.density.periodStart)} — {fmtDate(lab.density.periodEnd)} · {lab.density.nDays} días · Criterio día entreno: TSS &gt; 10
                </p>

                <div style={divider} />

                <div style={row}>
                    <span style={T.label}>Días consecutivos (media)</span>
                    <span style={T.value}>{lab.density.avgStreak.toFixed(1)}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>Días consecutivos (máx)</span>
                    <span style={T.value}>{lab.density.maxStreak}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>TSS acumulado últimos 3 días</span>
                    <span style={T.value}>{lab.density.tss3d}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>ATL/CTL medio (30d)</span>
                    <span style={T.value}>{lab.density.meanAtlCtl !== null ? lab.density.meanAtlCtl.toFixed(2) : '—'}</span>
                </div>
                <div style={row}>
                    <span style={T.label}>ATL/CTL actual</span>
                    <span style={T.value}>{lab.density.currentAtlCtl !== null ? lab.density.currentAtlCtl.toFixed(2) : '—'}</span>
                </div>

                <div style={divider} />
                <p style={T.translation}>{translateDensity(lab.density.avgStreak, lab.density.maxStreak, lab.density.meanAtlCtl)}</p>
            </div>

            {/* ═══ 4. PERFIL AUTONÓMICO ═══ */}
            <div style={block}>
                <p style={T.heading}>4. Perfil Autonómico</p>
                <p style={T.question}>¿Mi pulso y mi HRV están bien sincronizados? ¿Mi sistema es estable?</p>

                <p style={T.meta}>
                    Periodo: {fmtDate(lab.profile.periodStart)} — {fmtDate(lab.profile.periodEnd)} · {lab.profile.nDays} días · N con HRV: {lab.profile.nHrv} · N pareados (RHR+HRV): {lab.profile.nPaired}
                </p>

                <div style={divider} />

                <div style={row}>
                    <span style={T.label}>r(RHR, HRV)</span>
                    <span style={T.value}>{fmtR(lab.profile.corrRhrHrv.r)}</span>
                </div>
                <p style={{ ...T.translation, marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    {translateRhrHrv(lab.profile.corrRhrHrv.r)}
                </p>

                <div style={divider} />

                <div style={row}>
                    <span style={T.label}>HRV media (30d)</span>
                    <span style={T.value}>{lab.profile.hrvMean.toFixed(1)} ms</span>
                </div>
                <div style={row}>
                    <span style={T.label}>Desviación típica HRV</span>
                    <span style={T.value}>{lab.profile.hrvSd.toFixed(1)} ms</span>
                </div>
                <div style={row}>
                    <span style={T.label}>CV HRV (variabilidad estructural)</span>
                    <span style={T.value}>{lab.profile.cvHrv.toFixed(1)}%</span>
                </div>

                <div style={divider} />
                <p style={T.translation}>{translateCvHrv(lab.profile.cvHrv)}</p>
            </div>

        </div>
    );
};

export default CoachLabView;

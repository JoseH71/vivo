/**
 * VIVO — Report Service v1.0
 * Genera el texto estructurado para el entrenador
 */

export const generateCoachReport = (iea, decision) => {
    if (!iea || !iea.details) return 'No hay datos disponibles para generar el informe.';

    const { details, averages, score, label, message } = iea;
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    let report = `📊 *INFORME VIVO — ${today.toUpperCase()}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // BLOQUE 1: ESTADO Y DECISIÓN
    report += `🎧 *ESTADO AUTONÓMICO*\n`;
    report += `> SCORE IEA: ${score} pts (${label})\n`;
    report += `> DESGLOSE: VFC(${details.hrv?.points}) FC(${details.rhr?.points}) SUE(${details.sleep?.points}) CAR(${details.load?.points})\n`;
    report += `> RECOMENDACIÓN: ${decision?.recommendation?.intensity || 'Consultar con entrenador'}\n`;
    report += `> MENSAJE: ${message}\n\n`;

    // BLOQUE 2: BIO-MÉTRICAS (HOY)
    report += `🧬 *BIO-MÉTRICAS (HOY)*\n`;
    report += `- VFC: ${details.hrv?.value} ms (Z: ${details.hrv?.zScore})\n`;
    report += `- FCR: ${details.rhr?.value} bpm (Base: ${details.rhr?.baseline})\n`;
    report += `- SUEÑO: ${details.sleep?.value}/100\n`;
    report += `- CARGA (TSB): ${details.load?.tsb}\n\n`;

    // BLOQUE 3: INTELIGENCIA IEA (ESTABILIDAD)
    report += `⚡ *ESTABILIDAD ELÉCTRICA*\n`;
    const zoneLabels = {
        stable: 'ESTABLE',
        vigilance: 'VIGILANCIA',
        unstable: 'CAOS ELÉCTRICO',
        saturated: 'SATURACIÓN (Zona Fantasma)'
    };
    report += `- cv-VFC: ${details.stability?.cv}% (${zoneLabels[details.stability?.zone] || details.stability?.zone})\n`;
    if (details.stability?.penalty < 0) report += `- PENALIZACIÓN: ${details.stability?.penalty} pts\n`;

    if (details.safety?.capActive) {
        report += `- RESTRICCIÓN: Cap ${details.safety?.capValue} (${details.safety?.capReason})\n`;
    } else {
        report += `- RESTRICCIÓN: Sin limitaciones activas\n`;
    }

    if (details.safety?.autonomicConflict) report += `- ALERTA: Desacople detectado\n`;
    report += `\n`;

    // BLOQUE 4: ANÁLISIS ESTRUCTURAL (MEDIAS)
    if (averages) {
        const pad = (val, n) => String(val).padEnd(n, ' ');
        report += `📅 *ANÁLISIS ESTRUCTURAL (MEDIAS)*\n`;
        report += `\`Métrica | Hoy | 7d  | 14d | 30d\`\n`;
        report += `\`----------------------------------\`\n`;
        report += `\`VFC:    | ${pad(Math.round(details.hrv?.value), 3)} | ${pad(Math.round(averages.hrv?.d7), 3)} | ${pad(Math.round(averages.hrv?.d14), 3)} | ${pad(Math.round(averages.hrv?.d30), 3)}\`\n`;
        report += `\`FCR:    | ${pad(Math.round(details.rhr?.value), 3)} | ${pad(Math.round(averages.rhr?.d7), 3)} | ${pad(Math.round(averages.rhr?.d14), 3)} | ${pad(Math.round(averages.rhr?.d30), 3)}\`\n`;
        report += `\`SUEÑO:  | ${pad(Math.round(details.sleep?.value), 3)} | ${pad(Math.round(averages.sleep?.d7), 3)} | ${pad(Math.round(averages.sleep?.d14), 3)} | ${pad(Math.round(averages.sleep?.d30), 3)}\`\n\n`;
    }

    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Generado por VIVO v4.0 — Motor Autonómico`;

    return report;
};

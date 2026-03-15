/**
 * VIVO — Coach Analysis View
 * Buscador de actividades históricas con comparativa de series/laps
 * basado en los datos de Intervals.icu (Datos > TRABAJO)
 */
import { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp, Calendar, Zap, Activity, Copy, Check } from 'lucide-react';
import { ATHLETE_ID, INTERVALS_API_KEY } from '../../config/firebase';
import { fetchActivityLaps, parseIntervalSummary } from '../../services/intervalsService';
import { HISTORICAL_SST } from '../../data/historicalSST';

// Las funciones fetchActivityLaps y parseIntervalSummary ahora se importan de intervalsService.js


// ── Formateador de segundos → mm:ss ──────────────────────────────
const formatTime = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const val = (v, decimals = 0, unit = '') => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    const rounded = parseFloat(v).toFixed(decimals);
    return unit ? `${rounded}${unit}` : rounded;
};

// ── Componente: Fila de actividad expandible ───────────────────────
const ActivityRow = ({ activity }) => {
    const isHistorical = activity._isHistorical === true;
    const [expanded, setExpanded] = useState(false);
    const [laps, setLaps] = useState(isHistorical ? activity.intervals : null);
    const [loading, setLoading] = useState(false);

    const toggleExpand = async () => {
        if (!expanded && laps === null && !isHistorical) {
            setLoading(true);

            const rawId = activity.id || activity.activity_id;
            const data = await fetchActivityLaps(rawId);

            // Filtrar solo vueltas de trabajo real (FC media > 135 bpm)
            const workIntervals = data.filter(lap => {
                const hr = lap.average_heartrate ?? lap.avg_hr ?? lap.average_hr ?? 0;
                return hr > 135;
            });

            setLaps(workIntervals);
            setLoading(false);
        }
        setExpanded(!expanded);
    };

    const accentColor = expanded ? 'var(--cyan)' : 'rgba(255,255,255,0.5)';

    return (
        <div style={{ marginBottom: '0.5rem' }}>
            {/* Cabecera de actividad */}
            <button
                onClick={toggleExpand}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: expanded ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${expanded ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: expanded ? '16px 16px 0 0' : '16px',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    color: 'inherit'
                }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                            {activity.name}
                        </span>
                        {isHistorical && (
                            <span style={{
                                fontSize: '0.5rem', fontWeight: 900, color: '#f97316',
                                background: 'rgba(249,115,22,0.15)', padding: '2px 6px',
                                borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>Manual</span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
                        {formatDate(activity.start_date_local)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    {/* NP */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>NP</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                            {val(activity.icu_weighted_avg_watts)}w
                        </div>
                    </div>
                    {/* IF */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>IF</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                            {val(activity.icu_intensity, 2)}
                        </div>
                    </div>
                    {/* TSS */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>TSS</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
                            {val(activity.icu_training_load)}
                        </div>
                    </div>
                    {/* FC media */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>FC</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                            {val(activity.average_heartrate)}
                        </div>
                    </div>

                    {loading
                        ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                        : expanded
                            ? <ChevronUp size={16} style={{ color: accentColor }} />
                            : <ChevronDown size={16} style={{ color: accentColor }} />
                    }
                </div>
            </button>

            {/* Tabla de laps */}
            {expanded && (
                <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(6,182,212,0.2)', borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    padding: '0.5rem',
                    overflowX: 'auto'
                }}>
                    {!laps || laps.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            No se encontraron series. El endpoint de intervals no está disponible para esta actividad.
                            <br />
                            <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>Revisa la consola (F12) para más detalles.</span>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    {['Serie', 'Duración', 'Vatios NP', 'P. Media', 'FC Media', 'FC Máx.', 'Desacople', 'Factor Ef.', 'Cadencia'].map(h => (
                                        <th key={h} style={{
                                            padding: '0.4rem 0.6rem',
                                            color: 'rgba(255,255,255,0.4)',
                                            fontWeight: 700, textTransform: 'uppercase',
                                            fontSize: '0.55rem', letterSpacing: '0.05em',
                                            textAlign: 'right', whiteSpace: 'nowrap'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {laps.map((lap, i) => {
                                    // Nombres exactos de icu_intervals
                                    const duration = lap.moving_time ?? lap.elapsed_time ?? null;
                                    const np = lap.weighted_average_watts ?? lap.average_watts ?? null;
                                    const avgPwr = lap.average_watts ?? null;
                                    const avgHr = lap.average_heartrate ?? null;
                                    const maxHr = lap.max_heartrate ?? null;
                                    const decoupling = lap.decoupling ?? null;
                                    const cadence = lap.average_cadence ?? null;
                                    const efFactor = (np && avgHr) ? (np / avgHr).toFixed(2) : null;
                                    const decoupleColor = decoupling === null ? '#fff' : Math.abs(decoupling) > 8 ? 'var(--red)' : Math.abs(decoupling) > 5 ? 'var(--yellow)' : 'var(--green)';

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textAlign: 'right' }}>
                                                {i + 1}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: '#fff', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                {formatTime(duration)}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 800, textAlign: 'right' }}>
                                                {val(np)}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: '#fff', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                {val(avgPwr)}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'var(--red)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                {val(avgHr)}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                {val(maxHr)}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: decoupleColor, fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right' }}>
                                                {val(decoupling, 1, '%')}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                {efFactor ?? '—'}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                {val(cadence)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Vista Principal ───────────────────────────────────────────────
const CoachAnalysisView = ({ historyData = [] }) => {
    const [query, setQuery] = useState('SST');
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 180);
        return d.toLocaleDateString('sv');
    });
    const [dateTo, setDateTo] = useState(new Date().toLocaleDateString('sv'));
    const [results, setResults] = useState(null);
    const [comparing, setComparing] = useState(false);
    const [comparisonData, setComparisonData] = useState(null);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (!comparisonData || comparisonData.length === 0) return;

        const headers = ['Fecha', 'Actividad', 'Serie', 'Duración', 'Potencia', 'FC Media', 'FC Máx', 'Desacople', 'Temp', 'Eficiencia'];
        const rows = comparisonData.map(row => [
            row.date,
            row.name,
            row.serie,
            row.duration,
            row.power,
            row.hr,
            row.maxHr ?? '—',
            row.decoupling !== null ? `${row.decoupling.toFixed(1)}%` : '—',
            row.temp !== null ? `${row.temp}°` : '—',
            row.efficiency
        ]);

        const tsvContent = [headers, ...rows].map(r => r.join('\t')).join('\n');

        navigator.clipboard.writeText(tsvContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const search = useCallback(() => {
        if (!query.trim()) return;
        const q = query.toLowerCase().trim();
        console.log('[Analysis] Searching for:', q, 'Date range:', dateFrom, 'to', dateTo);

        // 1. Buscar en Intervals (datos en memoria)
        const allActivities = (historyData || []).flatMap(day =>
            (day.activities || []).map(a => ({ ...a, _dayId: day.id }))
        );
        console.log('[Analysis] Total activities in memory:', allActivities.length);

        // 2. Inyectar datos históricos manuales
        const historicalMatches = (HISTORICAL_SST || []).filter(h => {
            const date = (h.start_date_local || '').split('T')[0];
            if (date < dateFrom || date > dateTo) return false;
            const name = (h.name || '').toLowerCase();
            const desc = (h.description || '').toLowerCase();
            return name.includes(q) || desc.includes(q);
        });

        // 3. Buscar en Intervals por fecha/query
        const found = allActivities.filter(a => {
            const date = (a.start_date_local || a._dayId || '').split('T')[0];
            if (date < dateFrom || date > dateTo) return false;
            const name = (a.name || '').toLowerCase();
            const desc = (a.description || '').toLowerCase();
            return name.includes(q) || desc.includes(q);
        });
        console.log('[Analysis] Matches found in Intervals:', found.length, 'Matches in Historical:', historicalMatches.length);

        // 4. Crear set de fechas ya cubiertas por Intervals
        const intervalsDates = new Set(
            found.map(a => (a.start_date_local || a._dayId || '').split('T')[0])
        );

        // 5. Solo inyectar históricos para fechas que NO estén en Intervals
        const deduped = historicalMatches.filter(h => {
            const date = (h.start_date_local || '').split('T')[0];
            return !intervalsDates.has(date);
        });

        // 6. Mezclar y ordenar cronológicamente (más reciente primero)
        const combined = [...found, ...deduped].sort((a, b) => {
            const da = a.start_date_local || a._dayId || '';
            const db = b.start_date_local || b._dayId || '';
            return db.localeCompare(da);
        });

        setResults(combined);
        setComparisonData(null); // Reset al buscar de nuevo
    }, [query, dateFrom, dateTo, historyData]);

    // Búsqueda automática: disparar cuando llegan datos o cambia la query
    // Solo si aún no hemos tenido éxito encontrando nada sólido o es la carga inicial
    useEffect(() => {
        if (historyData && historyData.length > 0) {
            // Si es la carga inicial (null) o si estábamos en vacío pero han llegado datos nuevos
            if (results === null || (results.length === 0 && historyData.length > 0)) {
                search();
            }
        }
    }, [historyData, results, search]);

    // ── Cargar comparativa de series ──
    const loadComparison = useCallback(async () => {
        if (!results || results.length === 0) return;
        setComparing(true);

        const rows = [];

        for (const activity of results) {
            const isHist = activity._isHistorical === true;
            const dateStr = (activity.start_date_local || activity._dayId || '').split('T')[0];
            const formattedDate = dateStr.split('-').reverse().join('-');

            let series = [];

            if (isHist) {
                series = (activity.intervals || []).filter(s => {
                    const hr = s.average_heartrate ?? 0;
                    return hr > 135;
                });
            } else {
                const rawId = activity.id || activity.activity_id;
                const data = await fetchActivityLaps(rawId);
                series = data.filter(lap => {
                    const hr = lap.average_heartrate ?? lap.avg_hr ?? lap.average_hr ?? 0;
                    return hr > 135;
                });
            }

            if (series.length === 0) continue;

            // Datos de nivel de actividad (no por lap individual)
            // Intervals.icu los devuelve en el objeto actividad, no en cada intervalo
            const actDecoupling = activity.decoupling ?? activity.icu_aerobic_decoupling ?? null;
            const actMaxHr = activity.max_heartrate ?? null;
            const actTemp = activity.average_temp ?? activity.average_feels_like ?? null;

            // Una fila por cada serie individual
            series.forEach((s, idx) => {
                const power = s.average_watts ?? s.weighted_average_watts ?? 0;
                const hr = s.average_heartrate ?? 0;
                const duration = s.moving_time ?? s.elapsed_time ?? 0;
                const durationMin = Math.round(duration / 60);
                const efficiency = hr > 0 ? (power / hr).toFixed(2) : '—';

                // Nombres exactos confirmados por API de icu_intervals
                const decoupling = s.decoupling ?? actDecoupling;
                const maxHr = s.max_heartrate ?? actMaxHr;
                const temp = s.average_temp ?? s.average_weather_temp ?? actTemp;

                rows.push({
                    date: formattedDate,
                    name: activity.name || '—',
                    serie: idx + 1,
                    duration: `${durationMin}'`,
                    power,
                    hr,
                    efficiency: parseFloat(efficiency) || 0,
                    decoupling: decoupling !== null ? parseFloat(decoupling) : null,
                    maxHr: maxHr !== null ? Math.round(maxHr) : null,
                    temp: temp !== null ? Math.round(temp) : null,
                    isHistorical: isHist,
                    _sortDate: dateStr,
                });
            });
        }

        // Ordenar de más antigua a más reciente
        rows.sort((a, b) => {
            if (a._sortDate !== b._sortDate) return a._sortDate.localeCompare(b._sortDate);
            return a.serie - b.serie;
        });

        setComparisonData(rows);
        setComparing(false);
    }, [results]);

    const handleKey = (e) => { if (e.key === 'Enter') search(); };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── Buscador ── */}
            <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Search size={14} style={{ color: 'var(--cyan)' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--cyan)' }}>
                        Explorador de Actividades
                    </span>
                </div>

                {/* Input de búsqueda */}
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ej: SST, Z2, Umbral..."
                        style={{
                            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px', color: '#fff',
                            fontSize: '0.9rem', fontWeight: 600,
                            outline: 'none', boxSizing: 'border-box'
                        }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                </div>

                {/* Fechas */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Desde</div>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 0.75rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: '#fff',
                                fontSize: '0.8rem', outline: 'none',
                                boxSizing: 'border-box', colorScheme: 'dark'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Hasta</div>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 0.75rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: '#fff',
                                fontSize: '0.8rem', outline: 'none',
                                boxSizing: 'border-box', colorScheme: 'dark'
                            }}
                        />
                    </div>
                </div>

                <button
                    onClick={search}
                    style={{
                        width: '100%', padding: '0.75rem',
                        background: 'var(--cyan)',
                        border: 'none', borderRadius: '14px',
                        color: '#000', fontSize: '0.85rem', fontWeight: 900,
                        cursor: 'pointer', transition: 'opacity 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <Search size={16} /> Buscar Actividades
                </button>
            </div>

            {/* ── Resultados ── */}
            {results !== null && (
                <div>
                    {/* Header de resultados */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {results.length === 0
                                ? 'Sin resultados'
                                : `${results.length} actividad${results.length > 1 ? 'es' : ''} encontrada${results.length > 1 ? 's' : ''}`}
                        </div>
                        {results.length > 1 && (
                            <button
                                onClick={loadComparison}
                                disabled={comparing}
                                style={{
                                    padding: '0.4rem 1rem', borderRadius: '10px',
                                    background: comparisonData ? 'rgba(34,197,94,0.15)' : 'var(--cyan)',
                                    border: comparisonData ? '1px solid rgba(34,197,94,0.3)' : 'none',
                                    color: comparisonData ? 'var(--green)' : '#000',
                                    fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}
                            >
                                {comparing ? <Loader2 size={12} className="animate-spin" /> : null}
                                {comparisonData ? '✓ Comparativa lista' : comparing ? 'Cargando...' : '⚡ Comparar Series'}
                            </button>
                        )}
                    </div>

                    {/* ── TABLA COMPARATIVA ── */}
                    {comparisonData && comparisonData.length > 0 && (
                        <div className="card-glass animate-fade-in" style={{
                            padding: '0.75rem', borderRadius: '20px', marginBottom: '1rem',
                            overflowX: 'auto'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Zap size={14} style={{ color: 'var(--cyan)' }} />
                                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--cyan)' }}>
                                        Comparativa de Series
                                    </span>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        background: copied ? 'var(--green-soft)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${copied ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
                                        padding: '0.3rem 0.6rem', borderRadius: '8px',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {copied ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} style={{ color: 'var(--cyan)' }} />}
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: copied ? 'var(--green)' : '#fff', textTransform: 'uppercase' }}>
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </span>
                                </button>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {['Fecha', 'Actividad', 'Serie', 'Duración', 'Potencia', 'FC Media', 'FC Máx', 'Desacople', 'Temp', 'Eficiencia'].map(h => (
                                            <th key={h} style={{
                                                padding: '0.5rem 0.5rem',
                                                color: 'rgba(255,255,255,0.4)',
                                                fontWeight: 700, textTransform: 'uppercase',
                                                fontSize: '0.55rem', letterSpacing: '0.05em',
                                                textAlign: h === 'Actividad' ? 'left' : 'right',
                                                whiteSpace: 'nowrap'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, i) => {
                                        const effColor = row.efficiency >= 1.50 ? 'var(--green)' : row.efficiency >= 1.40 ? 'var(--cyan)' : row.efficiency >= 1.30 ? 'var(--yellow)' : 'var(--red)';
                                        const isManual = row.isHistorical;
                                        // Solo mostrar fecha y nombre en la primera serie de cada sesión
                                        const prevRow = i > 0 ? comparisonData[i - 1] : null;
                                        const isFirstOfSession = !prevRow || prevRow.date !== row.date || prevRow.name !== row.name;
                                        const isLastOfSession = i === comparisonData.length - 1 || comparisonData[i + 1].date !== row.date || comparisonData[i + 1].name !== row.name;

                                        return (
                                            <tr key={i} style={{
                                                borderBottom: isLastOfSession ? '2px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.03)',
                                                background: isFirstOfSession && !isLastOfSession ? 'rgba(255,255,255,0.01)' : 'transparent'
                                            }}>
                                                <td style={{ padding: '0.4rem 0.5rem', color: '#fff', fontFamily: 'var(--font-mono)', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.68rem', opacity: isFirstOfSession ? 1 : 0.3 }}>
                                                    {isFirstOfSession ? row.date : ''}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: '#fff', textAlign: 'left', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: isFirstOfSession ? 1 : 0.3 }}>
                                                    {isFirstOfSession ? row.name : ''}
                                                    {isFirstOfSession && isManual && <span style={{ marginLeft: '4px', fontSize: '0.45rem', color: '#f97316', fontWeight: 900 }}>M</span>}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 800, textAlign: 'right' }}>
                                                    {row.serie}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: '#fff', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                    {row.duration}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 800, textAlign: 'right' }}>
                                                    {row.power}w
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--red)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                    {row.hr}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                    {val(row.maxHr)}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: row.decoupling === null ? 'rgba(255,255,255,0.3)' : Math.abs(row.decoupling) > 8 ? 'var(--red)' : Math.abs(row.decoupling) > 5 ? 'var(--yellow)' : 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right' }}>
                                                    {val(row.decoupling, 1, '%')}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                                                    {val(row.temp, 0, '°')}
                                                </td>
                                                <td style={{ padding: '0.4rem 0.5rem', color: effColor, fontFamily: 'var(--font-mono)', fontWeight: 900, textAlign: 'right' }}>
                                                    {row.efficiency}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {results.length === 0 ? (
                        <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: '20px' }}>
                            <Activity size={32} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '0.75rem' }} />
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                                No se encontraron actividades con "{query}" en ese rango.<br />
                                <span style={{ opacity: 0.6 }}>Solo se busca en los datos cargados en caché (últimos 180 días) + datos manuales.</span>
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
                                Pulsa una actividad para ver sus series individuales ↓
                            </div>
                            {results.map(activity => (
                                <ActivityRow key={activity.id} activity={activity} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Estado inicial */}
            {results === null && (
                <div className="card-glass" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '24px', opacity: 0.6 }}>
                    <Zap size={28} style={{ color: 'var(--cyan)', marginBottom: '0.75rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                        Escribe "SST", "Z2" o cualquier término<br />que uses en las descripciones de Intervals.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CoachAnalysisView;

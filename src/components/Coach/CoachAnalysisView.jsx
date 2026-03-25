/**
 * VIVO — Coach Analysis View
 * Buscador de actividades históricas con comparativa de series/laps
 * basado en los datos de Intervals.icu (Datos > TRABAJO)
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp, Calendar, Zap, Activity, Copy, Check } from 'lucide-react';
import { ATHLETE_ID, INTERVALS_API_KEY } from '../../config/firebase';
import { fetchActivityLaps, parseIntervalSummary } from '../../services/intervalsService';
import { HISTORICAL_SST } from '../../data/historicalSST';
import CoachPostWorkoutView from './CoachPostWorkoutView';

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
const ActivityRow = ({ activity, dayData }) => {
    const isHistorical = activity._isHistorical === true;
    const [expanded, setExpanded] = useState(false);
    const [showFullAnalysis, setShowFullAnalysis] = useState(false);
    const [laps, setLaps] = useState(isHistorical ? activity.intervals : null);
    const [loading, setLoading] = useState(false);

    // Evitar parpadeos en carga de series
    const displayLoading = loading && !laps;

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
        if (showFullAnalysis && !expanded) setShowFullAnalysis(false);
        setExpanded(!expanded);
    };

    const toggleFullAnalysis = () => {
        setShowFullAnalysis(!showFullAnalysis);
        if (expanded) setExpanded(false);
    };

    const accentColor = expanded ? 'var(--cyan)' : 'rgba(255,255,255,0.5)';

    return (
        <div style={{ marginBottom: '0.5rem' }}>
            {/* Cabecera de actividad - Contenedor Principal */}
            <div
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: expanded || showFullAnalysis ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${expanded || showFullAnalysis ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: expanded || showFullAnalysis ? '16px 16px 0 0' : '16px',
                    transition: 'all 0.2s'
                }}
            >
                {/* Botón de Expansión (Área de texto) */}
                <div 
                    onClick={toggleExpand}
                    style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
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

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        {/* NP */}
                        <div style={{ textAlign: 'right', minWidth: '35px' }}>
                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>NP</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                                {val(activity.icu_weighted_avg_watts)}
                            </div>
                        </div>
                        {/* IF */}
                        <div style={{ textAlign: 'right', minWidth: '30px' }}>
                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>IF</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                                {val(activity.icu_intensity, 2)}
                            </div>
                        </div>
                        {/* TSS */}
                        <div style={{ textAlign: 'right', minWidth: '30px' }}>
                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>TSS</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
                                {val(activity.icu_training_load)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acciones Separadas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
                    {!isHistorical && dayData && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleFullAnalysis(); }}
                            title="Análisis Completo"
                            style={{
                                background: showFullAnalysis ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                                color: showFullAnalysis ? '#000' : 'var(--cyan)',
                                border: `1px solid ${showFullAnalysis ? 'var(--cyan)' : 'rgba(6,182,212,0.3)'}`,
                                borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Activity size={12} />
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase' }}>Analizar</span>
                        </button>
                    )}

                    <div 
                        onClick={toggleExpand}
                        style={{ cursor: 'pointer', padding: '0.25rem' }}
                    >
                        {displayLoading
                            ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--cyan)' }} />
                            : expanded
                                ? <ChevronUp size={16} style={{ color: accentColor }} />
                                : <ChevronDown size={16} style={{ color: accentColor }} />
                        }
                    </div>
                </div>
            </div>

            {/* Análisis Completo (CoachPostWorkoutView) */}
            {showFullAnalysis && dayData && (
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--cyan)', borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <CoachPostWorkoutView todayData={dayData} dateStr={(activity.start_date_local || activity._dayId || '').split('T')[0]} />
                </div>
            )}

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
        d.setDate(d.getDate() - 730); // 2 años atrás para búsqueda histórica completa
        return d.toLocaleDateString('sv');
    });
    const [dateTo, setDateTo] = useState(new Date().toLocaleDateString('sv'));
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [comparisonData, setComparisonData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Mapa de días para acceso rápido al analizar
    const daysMap = useMemo(() => {
        const map = new Map();
        if (historyData) {
            historyData.forEach(day => {
                map.set(day.id || day.date, day);
            });
        }
        return map;
    }, [historyData]);

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
        setSearching(true);
        console.log('[Analysis] Starting search...');
        
        // Timeout para simular carga y asegurar que el estado se procesa
        setTimeout(() => {
            const q = (query || '').toLowerCase().trim();
            console.log('[Analysis] Searching for:', q || '(all)', 'Range:', dateFrom, 'to', dateTo);

        // Detectar si la query es una fecha tipo DD-MM, DD/MM, YYYY-MM-DD
        const dateMatchStr = q.match(/^(\d{1,4})[-/](\d{1,2})[-/]?(\d{2,4})?$/);
        let matchMonth = null, matchDay = null, matchYear = null;
        if (dateMatchStr) {
            // Caso YYYY-MM-DD
            if (dateMatchStr[1].length === 4) {
                matchYear = dateMatchStr[1];
                matchMonth = dateMatchStr[2].padStart(2, '0');
                matchDay = dateMatchStr[3]?.padStart(2, '0');
            } else {
                // Caso DD-MM or DD-MM-YYYY
                matchDay = dateMatchStr[1].padStart(2, '0');
                matchMonth = dateMatchStr[2].padStart(2, '0');
                if (dateMatchStr[3]) {
                    matchYear = dateMatchStr[3].length === 2 ? '20' + dateMatchStr[3] : dateMatchStr[3];
                }
            }
        }

        // 1. Buscar en Intervals (datos en memoria)
        const allActivities = (historyData || []).flatMap(day =>
            (day.activities || []).map(a => ({ ...a, _dayId: day.id }))
        );
        console.log('[Analysis] Total activities in memory:', allActivities.length);

        // 2. Inyectar datos históricos manuales
        const historicalMatches = (HISTORICAL_SST || []).filter(h => {
            const date = (h.start_date_local || h.date || '').split('T')[0];
            const name = (h.name || '').toLowerCase();
            const desc = (h.description || '').toLowerCase();

            // Si es búsqueda por fecha específica, ignorar el rango de fechas
            if (matchMonth && matchDay) {
                const dateParts = date.split('-'); 
                const mMatch = dateParts[1] === matchMonth;
                const dMatch = dateParts[2] === matchDay;
                const yMatch = matchYear ? dateParts[0] === matchYear : true;
                if (mMatch && dMatch && yMatch) return true;
                if (q.length > 5 && date.includes(q)) return true;
                return false;
            }

            // Para búsquedas de texto, si la fecha está fuera del rango, solo filtrar si el rango ES explícito
            // Pero por defecto, vamos a ser más permisivos
            if (date < dateFrom || date > dateTo) return false;

            return name.includes(q) || desc.includes(q);
        });

        // 3. Buscar en Intervals por fecha/query
        const found = allActivities.filter(a => {
            const date = (a.start_date_local || a._dayId || '').split('T')[0];
            const name = (a.name || '').toLowerCase();
            const desc = (a.description || '').toLowerCase();
            const workoutDesc = (a.workout_description || '').toLowerCase();

            if (matchMonth && matchDay) {
                const dateParts = date.split('-');
                const mMatch = dateParts[1] === matchMonth;
                const dMatch = dateParts[2] === matchDay;
                const yMatch = matchYear ? dateParts[0] === matchYear : true;
                if (mMatch && dMatch && yMatch) return true;
                if (q.length > 5 && date.includes(q)) return true;
                return false;
            }
            if (date < dateFrom || date > dateTo) return false;

            // Si no hay query, mostrar todo lo que esté en el rango
            if (!q) return true;

            const matches = name.includes(q) || desc.includes(q) || workoutDesc.includes(q);
            return matches;
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
        setComparisonData(null); 
        setSearching(false);
        }, 100);
    }, [query, dateFrom, dateTo, historyData]);

    // Búsqueda automática: disparar cuando llegan datos
    // Solo si aún no hemos tenido éxito encontrando nada sólido o es la carga inicial
    useEffect(() => {
        if (historyData && historyData.length > 0 && results === null) {
            console.log('[Analysis] Auto-searching initial query...');
            search();
        }
    }, [historyData, results, search]);

    // ── Cargar comparativa de series ──
    const loadComparison = useCallback(async () => {
        if (!results || results.length === 0) return;
        setComparing(true);

        try {
            const allRows = await Promise.all(results.map(async (activity) => {
                const activityRows = [];
                const isHist = activity._isHistorical === true;
                const dateStr = (activity.start_date_local || activity._dayId || '').split('T')[0];
                const formattedDate = dateStr.split('-').reverse().join('-');

                let series = [];

                if (isHist) {
                    series = (activity.intervals || []).filter(s => {
                        const hr = s.average_heartrate ?? 0;
                        return hr > 115; // Umbral más flexible (antes 135)
                    });
                } else {
                    const rawId = activity.id || activity.activity_id;
                    const data = await fetchActivityLaps(rawId);
                    series = (data || []).filter(lap => {
                        const hr = lap.average_heartrate ?? lap.avg_hr ?? lap.average_hr ?? 0;
                        // Incluir series de TRABAJO (Intervals suele marcarlas) o por FC
                        return lap.type === 'WORK' || hr > 115;
                    });
                }

                if (series.length === 0) return [];

                const actDecoupling = activity.decoupling ?? activity.icu_aerobic_decoupling ?? null;
                const actMaxHr = activity.max_heartrate ?? null;
                const actTemp = activity.average_temp ?? activity.average_weather_temp ?? activity.average_feels_like ?? null;

                series.forEach((s, idx) => {
                    const power = s.average_watts ?? s.weighted_average_watts ?? 0;
                    const hr = s.average_heartrate ?? 0;
                    const duration = s.moving_time ?? s.elapsed_time ?? 0;
                    const durationMin = Math.round(duration / 60);
                    const efficiency = hr > 0 ? (power / hr).toFixed(2) : '—';

                    const decoupling = s.decoupling ?? actDecoupling;
                    const maxHr = s.max_heartrate ?? actMaxHr;
                    const temp = s.average_temp ?? s.average_weather_temp ?? actTemp;

                    activityRows.push({
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

                return activityRows;
            }));

            const flatRows = allRows.flat();
            
            // Ordenar de más antigua a más reciente
            flatRows.sort((a, b) => {
                if (a._sortDate !== b._sortDate) return a._sortDate.localeCompare(b._sortDate);
                return a.serie - b.serie;
            });

            setComparisonData(flatRows);
        } catch (error) {
            console.error('[Analysis] Comparison failed:', error);
        } finally {
            setComparing(false);
        }
    }, [results]);

    const handleKey = (e) => { if (e.key === 'Enter') search(); };

    // Buscar las actividades más recientes completadas para el analizador rápido
    const recentActivities = useMemo(() => {
        if (!historyData || !Array.isArray(historyData)) return [];
        return historyData.filter(day => day.activities && day.activities.length > 0 && day.activities.some(a => (a.icu_training_load || a.tss || 0) > 0)).slice(0, 7); // Útimos 7 días de entreno reales
    }, [historyData]);

    const [selectedRecentDate, setSelectedRecentDate] = useState(() => {
        const todayStr = new Date().toLocaleDateString('sv');
        return todayStr; // Por defecto empezamos con hoy, aunque no haya
    });

    // Cambiar la inicialización para auto-seleccionar el completado más reciente
    useEffect(() => {
        if (recentActivities.length > 0 && selectedRecentDate === new Date().toLocaleDateString('sv')) {
            const todayStr = new Date().toLocaleDateString('sv');
            const hasToday = recentActivities.some(d => (d.id || d.date) === todayStr);
            if (!hasToday) {
                setSelectedRecentDate(recentActivities[0].id || recentActivities[0].date);
            }
        }
    }, [recentActivities, selectedRecentDate]);

    const recentDataToAnalyze = useMemo(() => {
        return recentActivities.find(d => (d.id === selectedRecentDate || d.date === selectedRecentDate)) || null;
    }, [recentActivities, selectedRecentDate]);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>

            {/* ── Analizador de Entrenamientos Recientes ── */}
            {recentActivities.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }} className="hide-scrollbar">
                        {recentActivities.map(day => {
                            const dStr = day.id || day.date;
                            const isSelected = selectedRecentDate === dStr;
                            const d = new Date(dStr);
                            const dayName = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'][d.getDay()];
                            
                            return (
                                <button
                                    key={dStr}
                                    onClick={() => setSelectedRecentDate(dStr)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '12px', border: 'none',
                                        background: isSelected ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                                        color: isSelected ? '#000' : '#fff', opacity: isSelected ? 1 : 0.6,
                                        fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                                        flexShrink: 0
                                    }}
                                >
                                    <span>{dayName} {d.getDate()}</span>
                                    <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>{dStr === new Date().toLocaleDateString('sv') ? 'HOY' : 'COMPLETADO'}</span>
                                </button>
                            );
                        })}
                    </div>
                    {recentDataToAnalyze && (
                        <CoachPostWorkoutView todayData={recentDataToAnalyze} dateStr={selectedRecentDate} />
                    )}
                </div>
            )}


            {/* ── Buscador ── */}
            <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Search size={14} style={{ color: 'var(--cyan)' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--cyan)' }}>
                        Comparador Histórico (Microscopio)
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
                    disabled={searching}
                    style={{
                        width: '100%', padding: '0.75rem',
                        background: searching ? 'rgba(6,182,212,0.5)' : 'var(--cyan)',
                        border: 'none', borderRadius: '14px',
                        color: '#000', fontSize: '0.85rem', fontWeight: 900,
                        cursor: searching ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 
                    {searching ? 'Buscando...' : 'Buscar Actividades'}
                </button>
            </div>

            {/* ── Resultados ── */}
            {searching && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--cyan)', margin: '0 auto' }} />
                </div>
            )}

            {!searching && results !== null && (
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
                                <ActivityRow 
                                    key={activity.id || activity.activity_id + activity.start_date_local} 
                                    activity={activity} 
                                    dayData={daysMap.get(activity._dayId)}
                                />
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
                        Escribe "SST", "Z2" o busca una fecha concreta como "29-01"<br />para ver análisis y series.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CoachAnalysisView;

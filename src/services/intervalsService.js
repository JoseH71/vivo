/**
 * VIVO — Intervals.icu Data Service
 * Fetches wellness + activities data with Firebase cache layer
 */
import { ATHLETE_ID, INTERVALS_API_KEY, APP_ID, SHARED_USER_ID, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const getHeaders = () => {
    try {
        if (!INTERVALS_API_KEY) return {};
        const authStr = btoa('API_KEY:' + INTERVALS_API_KEY.trim());
        return {
            'Authorization': 'Basic ' + authStr,
            'Accept': 'application/json'
        };
    } catch {
        return { 'Accept': 'application/json' };
    }
};

const fetchWithProxy = async (url) => {
    const proxies = [
        'https://corsproxy.io/?url=',
        'https://api.allorigins.win/raw?url=',
        ''
    ];

    for (const proxy of proxies) {
        try {
            const isDirect = !proxy;
            const fullUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), isDirect ? 1000 : 5000);

            const res = await fetch(fullUrl, {
                method: 'GET',
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && (Array.isArray(data) || typeof data === 'object')) {
                    console.log(`[Intervals] ✓ Success via ${isDirect ? 'direct' : 'proxy'}`);
                    return data;
                }
            }
        } catch (e) {
            if (proxy) console.log(`[Intervals] Proxy failed:`, e.message?.slice(0, 50));
        }
    }
    return null;
};

const saveToCache = async (type, newData) => {
    if (!newData || !Array.isArray(newData)) return;

    // Always save to localStorage first for offline/standalone mode
    try {
        const localKey = `vivo_cache_${type}`;
        localStorage.setItem(localKey, JSON.stringify({
            data: newData.slice(0, 150),
            lastUpdated: Date.now()
        }));
    } catch (e) {
        console.warn(`[Intervals] Local cache save error:`, e);
    }

    if (!db) return;
    try {
        const path = `artifacts/${APP_ID}/users/${SHARED_USER_ID}/intervals_cache/${type}`;
        let existing = [];
        try {
            const snap = await getDoc(doc(db, path));
            if (snap.exists() && Array.isArray(snap.data().data)) {
                existing = snap.data().data;
            }
        } catch { /* empty */ }

        const dataMap = new Map();
        existing.forEach(item => {
            const id = item.id || item.date || item.start_date_local?.split('T')[0];
            if (id) dataMap.set(id, item);
        });
        newData.forEach(item => {
            const id = item.id || item.date || item.start_date_local?.split('T')[0];
            if (id) dataMap.set(id, item);
        });

        const merged = Array.from(dataMap.values())
            .sort((a, b) => {
                const dA = a.id || a.date || a.start_date_local || '';
                const dB = b.id || b.date || b.start_date_local || '';
                return dB.localeCompare(dA);
            })
            .slice(0, 150);

        await setDoc(doc(db, path), { data: merged, lastUpdated: Date.now() }, { merge: true });
    } catch (e) {
        console.error(`[Intervals] Cache save error:`, e);
    }
};

const getCacheDoc = async (type) => {
    // 1. Try Firestore
    if (db) {
        try {
            const path = `artifacts/${APP_ID}/users/${SHARED_USER_ID}/intervals_cache/${type}`;
            const snap = await getDoc(doc(db, path));
            if (snap.exists()) return snap.data().data;
        } catch { /* empty */ }
    }

    // 2. Fallback to localStorage
    try {
        const localData = localStorage.getItem(`vivo_cache_${type}`);
        if (localData) {
            const parsed = JSON.parse(localData);
            return parsed.data;
        }
    } catch { /* empty */ }

    return null;
};

const processIntervalsData = (wellness, activities, source) => {
    if (!wellness || !Array.isArray(wellness)) return [];
    activities = activities || [];

    return wellness.map(w => {
        const dayId = w.id || w.date;
        const dayActs = activities.filter(a => a.start_date_local?.startsWith(dayId));
        const dailyTSS = dayActs.reduce((sum, a) => sum + (a.icu_training_load || 0), 0);

        return {
            ...w,
            id: dayId,
            date: dayId,
            hrv: w.hrv || w.hrv_sdnn || w.hrv_rmssd || w.sdnn || w.rmssd || null,
            restingHR: w.restingHR || w.resting_hr || w.avg_hr || w.rhr || null,
            rhr: w.restingHR || w.resting_hr || w.avg_hr || w.rhr || null,
            sleepScore: w.sleepScore || w.sleep_score || w.sleepRanking || null,
            sleepSecs: w.sleepSecs || w.sleep_secs || null,
            ctl: w.ctl || 0,
            atl: w.atl || 0,
            dailyTSS,
            activities: dayActs,
            _source: source
        };
    }).sort((a, b) => b.id.localeCompare(a.id));
};

export const fetchIntervalsData = async (days = 90, startDate = null, endDate = null, force = false) => {
    try {
        let oldest, newest;
        if (startDate && endDate) {
            oldest = startDate;
            newest = endDate;
        } else {
            newest = new Date().toISOString().split('T')[0];
            const oldestDate = new Date();
            oldestDate.setDate(oldestDate.getDate() - days);
            oldest = oldestDate.toISOString().split('T')[0];
        }

        const wellnessUrl = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/wellness?oldest=${oldest}&newest=${newest}`;
        const activitiesUrl = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/activities?oldest=${oldest}&newest=${newest}`;

        // 1. Get cache first
        const [cachedWellness, cachedActivities] = await Promise.all([
            getCacheDoc('wellness'),
            getCacheDoc('activities')
        ]);

        let cacheAgeMins = 999;
        try {
            if (db) {
                const snap = await getDoc(doc(db, `artifacts/${APP_ID}/users/${SHARED_USER_ID}/intervals_cache/wellness`));
                if (snap.exists()) {
                    cacheAgeMins = (Date.now() - (snap.data().lastUpdated || 0)) / 60000;
                }
            } else {
                const localData = localStorage.getItem(`vivo_cache_wellness`);
                if (localData) {
                    const parsed = JSON.parse(localData);
                    cacheAgeMins = (Date.now() - (parsed.lastUpdated || 0)) / 60000;
                }
            }
        } catch { /* empty */ }

        const today = new Date().toISOString().split('T')[0];
        const hasTodayInCache = cachedWellness?.some(w => (w.id || w.date) === today);
        const needsRefresh = force || cacheAgeMins > 15 || !hasTodayInCache;

        // 2. Return cache immediately if available
        if (cachedWellness?.length > 0 && !force) {
            const cachedResult = processIntervalsData(
                cachedWellness.filter(w => {
                    const d = w.id || w.date || '';
                    return d >= oldest && d <= newest;
                }),
                cachedActivities,
                'cached'
            );

            if (needsRefresh) {
                setTimeout(async () => {
                    try {
                        const [w, a] = await Promise.all([
                            fetchWithProxy(wellnessUrl),
                            fetchWithProxy(activitiesUrl)
                        ]);
                        if (w?.length > 0) await saveToCache('wellness', w);
                        if (a?.length > 0) await saveToCache('activities', a);
                    } catch { /* silent */ }
                }, 100);
            }

            return cachedResult;
        }

        // 3. No cache — fetch from network
        const [w, a] = await Promise.all([
            fetchWithProxy(wellnessUrl),
            fetchWithProxy(activitiesUrl)
        ]);

        if (w?.length > 0) {
            await saveToCache('wellness', w);
            if (a) await saveToCache('activities', a);
            return processIntervalsData(w, a, 'network');
        }

        return null;
    } catch (e) {
        console.error('[Intervals] Fatal error:', e);
        return null;
    }
};

export const fetchIntervalsWellness = async (startDate, endDate) => {
    return fetchIntervalsData(null, startDate, endDate, false);
};

export const fetchIntervalsActivities = async (startDate, endDate) => {
    try {
        const url = `https://intervals.icu/api/v1/athlete/` + (typeof ATHLETE_ID === 'string' ? ATHLETE_ID.trim() : ATHLETE_ID) + `/activities?oldest=${startDate}&newest=${endDate}`;
        let activities = await fetchWithProxy(url);

        if (activities && activities.length > 0) {
            saveToCache('activities', activities);
            return activities;
        }

        const cached = await getCacheDoc('activities');
        return (cached || []).filter(a => {
            const date = a.start_date_local?.split('T')[0] || '';
            return date >= startDate && date <= endDate;
        });
    } catch (e) {
        const cached = await getCacheDoc('activities');
        return (cached || []);
    }
};

export const fetchActivityLaps = async (activityId) => {
    // Usar la constante global importada de firebase.js
    const apiKey = INTERVALS_API_KEY || '';
    if (!apiKey || !activityId) return [];

    const authStr = btoa('API_KEY:' + apiKey.trim());
    const headers = { 'Authorization': 'Basic ' + authStr, 'Accept': 'application/json' };

    const id = String(activityId).startsWith('i') ? activityId : `i${activityId}`;
    
    const endpoints = [
        `https://intervals.icu/api/v1/activity/${id}/intervals`,
        `https://intervals.icu/api/v1/activity/${id}/laps`,
    ];

    for (const url of endpoints) {
        try {
            const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl, { headers });
            if (!res.ok) continue;
            
            const data = await res.json();
            
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }

            if (data && typeof data === 'object' && !Array.isArray(data)) {
                const objKeys = Object.keys(data);
                for (const key of objKeys) {
                    if (Array.isArray(data[key]) && data[key].length > 0) {
                        return data[key];
                    }
                }
            }
        } catch (e) {
            console.warn('[Intervals] Laps fetch error:', url, e.message);
        }
    }
    return [];
};

export const parseIntervalSummary = (summary) => {
    if (!Array.isArray(summary)) return [];
    return summary.map((s, i) => {
        const timeMatch = String(s).match(/(\d+)m(\d+)s/);
        const wMatch = String(s).match(/(\d+)w/);
        return {
            _index: i + 1,
            _duration_str: timeMatch ? s : s,
            elapsed_time: timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : null,
            average_watts: wMatch ? parseInt(wMatch[1]) : null,
        };
    }).filter(l => l.elapsed_time && l.elapsed_time > 30);
};

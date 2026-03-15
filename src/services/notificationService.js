/**
 * VIVO — Notification Service v1.0
 * Gestión de permisos, registro de SW, y recordatorios diarios vía Notification API.
 */

// ── Registrar Service Worker ──
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('[SW] Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] ✅ Service Worker registered');
        return registration;
    } catch (e) {
        console.error('[SW] Registration failed:', e);
        return null;
    }
};

// ── Solicitar permiso de notificaciones ──
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('[Notify] Notifications not supported');
        return 'denied';
    }

    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    const permission = await Notification.requestPermission();
    return permission;
};

// ── Verificar si las notificaciones están activas ──
export const isNotificationEnabled = () => {
    return 'Notification' in window && Notification.permission === 'granted';
};

// ── Programar recordatorio diario local ──
// Usa setTimeout/setInterval ya que el Notification API local no tiene
// programación nativa. El SW maneja push notifications del servidor.
export const scheduleLocalReminder = (hour = 7, minute = 30) => {
    const STORAGE_KEY = 'vivo_reminder_enabled';
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // If target time has already passed today, set for tomorrow
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    // Store the config
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: true, hour, minute }));

    setTimeout(() => {
        showLocalNotification();
        // Reschedule for next day
        setInterval(showLocalNotification, 24 * 60 * 60 * 1000);
    }, delay);

    console.log(`[Notify] ⏰ Reminder set for ${target.toLocaleTimeString('es-ES')}`);
    return target;
};

// ── Mostrar notificación local ──
export const showLocalNotification = () => {
    if (!isNotificationEnabled()) return;

    const titles = [
        '🏋️ ¡Buenos días, Jose!',
        '☀️ Tu cuerpo te espera',
        '💪 ¿Cómo te sientes hoy?',
        '🧠 Check-in matutino',
    ];

    const bodies = [
        'Registra tus síntomas y electrolitos para que VIVO pueda cuidarte.',
        'Un minuto de check-in = un día de decisiones inteligentes.',
        'Tu HRV te está esperando. ¿Entramos a ver qué dice tu cuerpo?',
        'No olvides registrar cómo te sientes. Tu futuro yo te lo agradecerá.',
    ];

    const i = Math.floor(Math.random() * titles.length);

    new Notification(titles[i], {
        body: bodies[i],
        icon: '/favicon.svg',
        tag: 'vivo-daily-reminder',
        renotify: true,
    });
};

// ── Obtener configuración guardada ──
export const getReminderConfig = () => {
    const raw = localStorage.getItem('vivo_reminder_enabled');
    if (!raw) return { enabled: false, hour: 7, minute: 30 };
    try {
        return JSON.parse(raw);
    } catch {
        return { enabled: false, hour: 7, minute: 30 };
    }
};

// ── Desactivar recordatorio ──
export const disableReminder = () => {
    localStorage.removeItem('vivo_reminder_enabled');
};

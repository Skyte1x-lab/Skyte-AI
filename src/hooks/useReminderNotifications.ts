import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/** Fires a browser Notification once for each reminder that becomes due while enabled. */
export function useReminderNotifications() {
  const notificationsEnabled = useAppStore((s) => s.settings.notificationsEnabled);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const store = useAppStore.getState();
      store.reminders.forEach((r) => {
        if (!r.done && !r.notified && r.dueAt <= now) {
          new Notification('Skyte AI', { body: r.text, icon: '/favicon.svg' });
          store.updateReminder(r.id, { notified: true });
        }
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);
}

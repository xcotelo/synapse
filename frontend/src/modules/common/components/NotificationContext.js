import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  loadNotes,
  clearNoteReminder,
} from "../../digitalbrain/digitalBrainStorage";

const NOTIFICATIONS_KEY = "synapse.notifications";
const MAX_SETTIMEOUT_MS = 2147483647; // límite de setTimeout en navegadores

const loadStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredNotifications = (items) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
};

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(loadStoredNotifications);
  const scheduledRef = useRef({});

  const persistNotifications = useCallback((items) => {
    setNotifications(items);
    saveStoredNotifications(items);
  }, []);

  const addNotification = useCallback(
    (noteId, noteTitle) => {
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        noteId,
        noteTitle: noteTitle || "Nota sin título",
        createdAt: new Date().toISOString(),
        read: false,
      };
      const current = loadStoredNotifications();
      persistNotifications([newNotif, ...current]);
      return newNotif;
    },
    [persistNotifications]
  );

  const processDueReminder = useCallback(
    (note) => {
      addNotification(note.id, note.title);
      clearNoteReminder(note.id);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Synapse – Recordatorio", {
          body: `"${note.title || "Nota sin título"}" – Es hora de revisar esta nota.`,
          icon: "/favicon.ico",
        });
      }
    },
    [addNotification]
  );

  const checkAndScheduleReminders = useCallback(() => {
    const notes = loadNotes();
    const now = new Date();
    const nowMs = now.getTime();

    // Procesar recordatorios ya vencidos
    const dueNotes = notes.filter(
      (n) => n.reminderAt && new Date(n.reminderAt) <= now
    );
    dueNotes.forEach((note) => processDueReminder(note));

    // Programar recordatorios futuros con setTimeout (disparo exacto a la hora)
    const futureNotes = notes.filter(
      (n) => n.reminderAt && new Date(n.reminderAt) > now
    );
    futureNotes.forEach((note) => {
      const noteId = note.id;
      const reminderMs = new Date(note.reminderAt).getTime();
      const delay = reminderMs - nowMs;

      if (delay > 0 && delay < MAX_SETTIMEOUT_MS) {
        if (scheduledRef.current[noteId]) {
          clearTimeout(scheduledRef.current[noteId]);
        }
        const timeoutId = setTimeout(() => {
          processDueReminder(note);
          delete scheduledRef.current[noteId];
        }, delay);
        scheduledRef.current[noteId] = timeoutId;
      }
    });

    // Limpiar timeouts de notas sin recordatorio (borradas o ya procesadas)
    Object.keys(scheduledRef.current).forEach((noteId) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.reminderAt) {
        clearTimeout(scheduledRef.current[noteId]);
        delete scheduledRef.current[noteId];
      }
    });
  }, [processDueReminder]);

  const markAsRead = useCallback(
    (notifId) => {
      const updated = notifications.map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      );
      persistNotifications(updated);
    },
    [notifications, persistNotifications]
  );

  const markAllAsRead = useCallback(() => {
    persistNotifications(
      notifications.map((n) => ({ ...n, read: true }))
    );
  }, [notifications, persistNotifications]);

  const clearAll = useCallback(() => {
    persistNotifications([]);
  }, [persistNotifications]);

  useEffect(() => {
    checkAndScheduleReminders();
    const interval = setInterval(checkAndScheduleReminders, 10 * 1000);
    return () => {
      clearInterval(interval);
      Object.values(scheduledRef.current).forEach(clearTimeout);
      scheduledRef.current = {};
    };
  }, [checkAndScheduleReminders]);

  const requestNotificationPermission = useCallback(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      requestNotificationPermission,
      refreshReminders: checkAndScheduleReminders,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      requestNotificationPermission,
      checkAndScheduleReminders,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};

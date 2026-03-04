/**
 * Repositorio: persistencia del inbox en localStorage.
 * Solo operaciones de lectura/escritura, sin lógica de dominio.
 */

const INBOX_KEY = 'digitalBrain.inbox';
const LAST_PROCESSED_KEY = 'digitalBrain.lastProcessed';

/**
 * Lee todas las entradas del inbox desde localStorage.
 */
export const loadInbox = () => {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Guarda el array completo de entradas del inbox.
 */
export const saveInbox = (items) => {
  localStorage.setItem(INBOX_KEY, JSON.stringify(items));
};

/**
 * Lee la fecha del último procesado (para el sistema de strikes).
 */
export const loadLastProcessed = () => {
  const val = localStorage.getItem(LAST_PROCESSED_KEY);
  return val ? parseInt(val, 10) : Date.now();
};

/**
 * Actualiza la fecha del último procesado a "ahora".
 */
export const updateLastProcessed = () => {
  localStorage.setItem(LAST_PROCESSED_KEY, Date.now().toString());
};

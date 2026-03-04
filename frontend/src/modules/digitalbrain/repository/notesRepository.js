/**
 * Repositorio: persistencia de notas procesadas en localStorage.
 * Solo operaciones de lectura/escritura, sin lógica de dominio.
 */

const NOTES_KEY = 'digitalBrain.notes';

/**
 * Lee todas las notas procesadas desde localStorage.
 */
export const loadNotes = () => {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const notes = raw ? JSON.parse(raw) : [];
    // Asegurar que todas las notas tengan el campo isRead (migración para notas antiguas)
    return notes.map(note => ({
      ...note,
      isRead: note.isRead !== undefined ? note.isRead : false
    }));
  } catch (e) {
    return [];
  }
};

/**
 * Guarda el array completo de notas procesadas.
 */
export const saveNotes = (items) => {
  localStorage.setItem(NOTES_KEY, JSON.stringify(items));
};

/**
 * Elimina una nota concreta por id.
 */
export const deleteNoteById = (noteId) => {
  const notes = loadNotes();
  const updatedNotes = notes.filter((note) => note.id !== noteId);
  saveNotes(updatedNotes);
  return updatedNotes;
};

/**
 * Marca una nota como leída o no leída (toggle).
 */
export const toggleNoteReadStatus = (noteId) => {
  const notes = loadNotes();
  const updatedNotes = notes.map((note) => {
    if (note.id === noteId) {
      return { ...note, isRead: !note.isRead };
    }
    return note;
  });
  saveNotes(updatedNotes);
  return updatedNotes;
};

/**
 * Marca el recordatorio de una nota como disparado (ya notificado).
 */
export const clearNoteReminder = (noteId) => {
  const notes = loadNotes();
  const updatedNotes = notes.map((note) => {
    if (note.id === noteId && note.reminderAt) {
      const { reminderAt, ...rest } = note;
      return rest;
    }
    return note;
  });
  saveNotes(updatedNotes);
  return updatedNotes;
};

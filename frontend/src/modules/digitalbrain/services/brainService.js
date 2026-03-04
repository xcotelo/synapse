/**
 * Servicio de orquestación: re-exporta funciones del modelo y repositorios
 * para mantener compatibilidad con código existente.
 *
 * Los nuevos componentes deben importar directamente de:
 *   - model/noteModel.js        (lógica de dominio)
 *   - model/trendsModel.js      (tendencias)
 *   - model/exportModel.js      (exportación)
 *   - repository/inboxRepository.js  (persistencia inbox)
 *   - repository/notesRepository.js  (persistencia notas)
 *   - services/brainApiService.js     (llamadas al backend)
 */

// Re-exportaciones para compatibilidad
export { createNoteFromEntry, createInboxEntry, defaultTemplate, extractFirstUrl, extractYouTubeId } from "../model/noteModel";
export { buildTrendsReport } from "../model/trendsModel";
export { exportNotesAsMarkdown, downloadNoteAsFile, downloadNoteDocument } from "../model/exportModel";
export { loadInbox, saveInbox, loadLastProcessed, updateLastProcessed } from "../repository/inboxRepository";
export { loadNotes, saveNotes, deleteNoteById, toggleNoteReadStatus, clearNoteReminder } from "../repository/notesRepository";

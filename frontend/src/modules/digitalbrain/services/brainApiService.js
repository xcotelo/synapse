/**
 * Servicio API: comunicación con el backend REST de Brain.
 * Centraliza todas las llamadas HTTP al backend, aislando los componentes
 * de los detalles de transporte (URLs, configuración de fetch, etc.).
 */
import { appFetch, fetchConfig } from "../../../api/appFetch";

/**
 * Solicita sugerencias de clasificación al backend (IA/reglas).
 * POST /brain/suggestions
 */
export const suggestContent = (rawContent, onSuccess, onErrors) => {
  appFetch(
    "/brain/suggestions",
    fetchConfig("POST", { content: rawContent }),
    onSuccess,
    onErrors
  );
};

/**
 * Vista previa de una URL: extrae título/descripción y un snippet.
 * GET /brain/previews?url=...
 */
export const loadLinkPreview = (url, onSuccess, onErrors) => {
  appFetch(
    `/brain/previews?url=${encodeURIComponent(url)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );
};

/**
 * Sube un archivo y obtiene sugerencias del backend.
 * POST /brain/suggestions/file (multipart/form-data)
 */
export const suggestFromFile = (formData, onSuccess, onErrors) => {
  appFetch(
    "/brain/suggestions/file",
    fetchConfig("POST", formData),
    onSuccess,
    onErrors
  );
};

/**
 * Persiste una nota como fichero Markdown en disco (formato abierto).
 * POST /brain/notes
 */
export const saveNoteToBackend = (note, onSuccess, onErrors) => {
  appFetch(
    "/brain/notes",
    fetchConfig("POST", {
      noteId: note.id,
      entryId: note.entryId,
      title: note.title,
      destination: note.destination,
      type: note.type,
      createdAt: note.createdAt,
      content: note.content,
      tags: note.tags,
      mediaUrl: note.media && note.media.url ? note.media.url : undefined,
      mediaContentType:
        note.media && note.media.contentType ? note.media.contentType : undefined,
    }),
    onSuccess,
    onErrors
  );
};

/**
 * Borra una nota persistida en disco (por storageId).
 * DELETE /brain/notes/:storageId
 */
export const deleteNoteFromBackend = (storageId, onSuccess, onErrors) => {
  appFetch(
    `/brain/notes/${encodeURIComponent(storageId)}`,
    fetchConfig("DELETE"),
    onSuccess,
    onErrors
  );
};

/**
 * Borra un archivo multimedia del backend.
 * DELETE /brain/media/:filename
 */
export const deleteMediaFromBackend = (filename, onSuccess, onErrors) => {
  appFetch(
    `/brain/media/${encodeURIComponent(filename)}`,
    fetchConfig("DELETE"),
    onSuccess,
    onErrors
  );
};

/**
 * Solicita fact-checking del contenido.
 * POST /brain/fact-checks
 */
export const factCheckContent = (content, onSuccess, onErrors) => {
  appFetch(
    "/brain/fact-checks",
    fetchConfig("POST", { content }),
    onSuccess,
    onErrors
  );
};

/**
 * Solicita insights de tendencias generados por IA.
 * POST /brain/trends/insights
 */
export const getTrendsInsights = (params, onSuccess, onErrors) => {
  appFetch(
    "/brain/trends/insights",
    fetchConfig("POST", params),
    onSuccess,
    onErrors
  );
};

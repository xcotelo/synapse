/**
 * API service: communication with the Brain REST backend.
 * Centralizes all HTTP calls to the backend, isolating components
 * from transport details (URLs, fetch config, etc.).
 */
import { appFetch, fetchConfig } from "../../../api/appFetch";

/**
 * Request classification suggestions from the backend (AI/rules).
 * POST /brains/suggestions
 */
export const suggestContent = (rawContent, onSuccess, onErrors) => {
  appFetch(
    "/brains/suggestions",
    fetchConfig("POST", { content: rawContent }),
    onSuccess,
    onErrors
  );
};

/**
 * URL preview: extracts title/description and a snippet.
 * GET /brains/previews?url=...
 */
export const loadLinkPreview = (url, onSuccess, onErrors) => {
  appFetch(
    `/brains/previews?url=${encodeURIComponent(url)}`,
    fetchConfig("GET"),
    onSuccess,
    onErrors
  );
};

/**
 * Upload a file and get suggestions from the backend.
 * POST /brains/suggestions/file (multipart/form-data)
 */
export const suggestFromFile = (formData, onSuccess, onErrors) => {
  appFetch(
    "/brains/suggestions/file",
    fetchConfig("POST", formData),
    onSuccess,
    onErrors
  );
};

/**
 * Persist a note as a Markdown file on disk (open format).
 * POST /brains/notes
 */
export const saveNoteToBackend = (note, onSuccess, onErrors) => {
  appFetch(
    "/brains/notes",
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
 * Delete a persisted note from disk (by storageId).
 * DELETE /brains/notes/:storageId
 */
export const deleteNoteFromBackend = (storageId, onSuccess, onErrors) => {
  appFetch(
    `/brains/notes/${encodeURIComponent(storageId)}`,
    fetchConfig("DELETE"),
    onSuccess,
    onErrors
  );
};

/**
 * Delete a media file from the backend.
 * DELETE /brains/media/:filename
 */
export const deleteMediaFromBackend = (filename, onSuccess, onErrors) => {
  appFetch(
    `/brains/media/${encodeURIComponent(filename)}`,
    fetchConfig("DELETE"),
    onSuccess,
    onErrors
  );
};

/**
 * Request fact-checking of content.
 * POST /brains/fact-checks
 */
export const factCheckContent = (content, onSuccess, onErrors) => {
  appFetch(
    "/brains/fact-checks",
    fetchConfig("POST", { content }),
    onSuccess,
    onErrors
  );
};

/**
 * Request AI-generated trend insights.
 * POST /brains/trends/insights
 */
export const getTrendsInsights = (params, onSuccess, onErrors) => {
  appFetch(
    "/brains/trends/insights",
    fetchConfig("POST", params),
    onSuccess,
    onErrors
  );
};

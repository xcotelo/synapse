/**
 * Modelo de dominio: funciones puras para la lógica de notas y entradas.
 * No tiene efectos secundarios (no accede a localStorage, no hace fetch).
 */

// Fecha/hora en formato ISO
const nowIso = () => new Date().toISOString();

/**
 * Extrae la primera URL encontrada en un texto.
 */
export const extractFirstUrl = (text) => {
  if (!text) return null;
  const match = text.match(/(https?:\/\/\S+|www\.\S+)/i);
  if (!match) return null;
  let url = match[0];
  url = url.replace(/[),.;!?\]]+$/g, "");
  if (/^www\./i.test(url)) {
    url = `http://${url}`;
  }
  return url;
};

/**
 * Extrae el ID de un vídeo de YouTube a partir de una URL.
 */
export const extractYouTubeId = (urlOrText) => {
  if (!urlOrText) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = urlOrText.match(regExp);
  return match ? match[1] : null;
};

/**
 * Clasifica el tipo de contenido según el texto introducido.
 * Devuelve: 'video' | 'link' | 'tarea' | 'codigo' | 'nota' | 'texto'
 */
export const detectEntryType = (content) => {
  if (!content) {
    return 'texto';
  }

  const trimmed = content.trim();
  const firstUrl = extractFirstUrl(trimmed);

  if (firstUrl) {
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(firstUrl)) {
      return 'video';
    }
    return 'link';
  }

  if (/^\s*(- \[ \]|\[ \]\s|TODO[:\s])/im.test(trimmed)) {
    return 'tarea';
  }

  if (/```[a-z]*[\s\S]*```/m.test(trimmed) || /\b(function|const|let|var|class)\b/.test(trimmed)) {
    return 'codigo';
  }

  return 'nota';
};

/**
 * Construye un objeto de entrada de inbox a partir del texto original.
 */
export const createInboxEntry = (rawContent, source = 'manual') => {
  const type = detectEntryType(rawContent);
  return {
    id: Date.now().toString(),
    rawContent,
    type,
    createdAt: nowIso(),
    source,
    status: 'inbox',
  };
};

/**
 * Construye una nota procesada a partir de una entrada del inbox.
 */
export const createNoteFromEntry = (
  entry,
  { title, tags, structuredContent, mediaUrl, mediaContentType, type: noteType, reminderAt }
) => {
  return {
    id: `note-${Date.now().toString()}`,
    entryId: entry.id,
    title: title || 'Nota sin título',
    destination: 'nota',
    tags: tags || [],
    content: structuredContent || entry.rawContent,
    type: noteType || entry.type,
    createdAt: nowIso(),
    isRead: false,
    media: mediaUrl ? { url: mediaUrl, contentType: mediaContentType || '' } : undefined,
    reminderAt: reminderAt || undefined,
  };
};

/**
 * Template por defecto para el contenido estructurado de una nota.
 */
export const defaultTemplate = (title, rawContent) => {
  return `# ${title}

## Contenido original

${rawContent}


`;
};

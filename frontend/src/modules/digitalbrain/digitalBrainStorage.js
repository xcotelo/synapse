// Claves bajo las que guardamos la información en localStorage
const INBOX_KEY = 'digitalBrain.inbox'; // entradas pendientes (inbox)
const NOTES_KEY = 'digitalBrain.notes'; // notas ya procesadas

// Fecha/hora en formato ISO, para guardar cuándo se creó cada elemento
const nowIso = () => new Date().toISOString();

// Lee todas las entradas del inbox desde localStorage
export const loadInbox = () => {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Guarda el array completo de entradas del inbox
export const saveInbox = (items) => {
  localStorage.setItem(INBOX_KEY, JSON.stringify(items));
};

// Lee todas las notas procesadas desde localStorage
export const loadNotes = () => {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Guarda el array completo de notas procesadas
export const saveNotes = (items) => {
  localStorage.setItem(NOTES_KEY, JSON.stringify(items));
};

// Clasificación básica del tipo de contenido según el texto introducido
export const detectEntryType = (content) => {
  if (!content) {
    return 'texto';
  }

  const trimmed = content.trim();
  const urlRegex = /https?:\/\/\S+/i; // patrón muy simple para detectar URLs
  const hasUrl = urlRegex.test(trimmed);

  // Si es URL de vídeo conocida
  if (hasUrl && (/youtube\.com|youtu\.be|vimeo\.com/i.test(trimmed))) {
    return 'video';
  }

  // Si hay URL pero no parece vídeo, lo tratamos como enlace genérico
  if (hasUrl) {
    return 'link';
  }

  // Lista de tareas típica (- [ ] / TODO: ...)
  if (/^\s*(- \[ \]|\[ \]\s|TODO[:\s])/im.test(trimmed)) {
    return 'tarea';
  }

  // Heurística muy básica para detectar código
  if (/```[a-z]*[\s\S]*```/m.test(trimmed) || /\b(function|const|let|var|class)\b/.test(trimmed)) {
    return 'codigo';
  }

  return 'nota';
};

// Construye un objeto de entrada de inbox a partir del texto original
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

// Construye una nota procesada a partir de una entrada del inbox
export const createNoteFromEntry = (entry, { title, destination, tags, structuredContent }) => {
  return {
    id: `note-${Date.now().toString()}`,
    entryId: entry.id,
    title: title || 'Nota sin título',
    destination: destination || 'nota',
    tags: tags || [],
    content: structuredContent || entry.rawContent,
    type: entry.type,
    createdAt: nowIso(),
  };
};

// Convierte todas las notas en un único texto Markdown exportable
export const exportNotesAsMarkdown = (notes) => {
  const lines = [];
  notes.forEach((note) => {
    lines.push(`# ${note.title || 'Nota sin título'}`);
    lines.push('');
    if (note.tags && note.tags.length > 0) {
      lines.push(`Etiquetas: ${note.tags.map((t) => `#${t}`).join(' ')}`);
      lines.push('');
    }
    lines.push(note.content || '');
    lines.push('\n---\n');
  });

  return lines.join('\n');
};

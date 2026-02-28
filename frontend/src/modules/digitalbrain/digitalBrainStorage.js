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
export const createNoteFromEntry = (
  entry,
  { title, destination, tags, structuredContent, mediaUrl, mediaContentType, type: noteType }
) => {
  return {
    id: `note-${Date.now().toString()}`,
    entryId: entry.id,
    title: title || 'Nota sin título',
    destination: destination || 'nota',
    tags: tags || [],
    content: structuredContent || entry.rawContent,
    type: noteType || entry.type,
    createdAt: nowIso(),
    isRead: false, // Por defecto, las notas no están leídas
    media: mediaUrl ? { url: mediaUrl, contentType: mediaContentType || '' } : undefined,
  };
};

// Elimina una nota concreta por id
export const deleteNoteById = (noteId) => {
  const notes = loadNotes();
  const updatedNotes = notes.filter((note) => note.id !== noteId);
  saveNotes(updatedNotes);
  return updatedNotes;
};

// Marca una nota como leída o no leída
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

const stripDiacritics = (value) => {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const STOPWORDS = new Set(
  [
    // ES
    'de', 'la', 'el', 'y', 'o', 'a', 'en', 'un', 'una', 'unos', 'unas', 'por', 'para',
    'con', 'sin', 'del', 'al', 'se', 'su', 'sus', 'es', 'son', 'ser', 'fue', 'era',
    'que', 'como', 'cuando', 'donde', 'porque', 'qué', 'cómo', 'cuándo', 'dónde',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'lo', 'las', 'los',
    'más', 'menos', 'muy', 'ya', 'también', 'pero', 'si', 'no', 'sí',
    // EN (típico en contenido técnico)
    'the', 'and', 'or', 'to', 'in', 'of', 'for', 'with', 'without', 'is', 'are', 'was',
    'be', 'as', 'on', 'at', 'by', 'from', 'it', 'this', 'that', 'these', 'those',
  ].map((w) => stripDiacritics(w))
);

const normalizeTopic = (raw) => {
  const t = stripDiacritics(raw)
    .toLowerCase()
    .replace(/[^a-z0-9+._-]+/g, ' ')
    .trim();
  return t;
};

const bucketTopic = (topic) => {
  const t = normalizeTopic(topic);
  if (!t) return '';

  // Agrupaciones pequeñas para evitar ruido en contenido técnico.
  const aliases = [
    { keys: ['ia', 'ai', 'llm', 'gpt', 'chatgpt', 'llama', 'mistral', 'qwen', 'phi'], value: 'ia' },
    { keys: ['backend', 'api', 'spring', 'springboot', 'java', 'node', 'express'], value: 'backend' },
    { keys: ['frontend', 'react', 'ui', 'ux'], value: 'frontend' },
    { keys: ['devops', 'docker', 'kubernetes', 'k8s', 'ci', 'cd'], value: 'devops' },
    { keys: ['seguridad', 'security', 'ciberseguridad', 'auth', 'oauth', 'jwt'], value: 'seguridad' },
  ];

  for (const group of aliases) {
    if (group.keys.includes(t)) return group.value;
  }

  return t;
};

const extractTopicsFromText = (text, maxTopics = 6) => {
  const clean = stripDiacritics(text)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^a-z0-9+._-]+/g, ' ');

  const tokens = clean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 4)
    .filter((t) => !STOPWORDS.has(t));

  const freq = new Map();
  for (const token of tokens) {
    const bucketed = bucketTopic(token);
    if (!bucketed) continue;
    freq.set(bucketed, (freq.get(bucketed) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopics)
    .map(([t]) => t);
};

const extractTopicsFromItem = (item) => {
  if (!item) return [];

  const topics = new Set();

  const tags = Array.isArray(item.tags) ? item.tags : [];
  tags.forEach((t) => {
    const bucketed = bucketTopic(t);
    if (bucketed) topics.add(bucketed);
  });

  const type = item.type ? bucketTopic(item.type) : '';
  if (type && type !== 'link' && type !== 'nota' && type !== 'texto') {
    topics.add(type);
  }

  const title = item.title || '';
  const text = item.content || item.rawContent || '';
  const combined = `${title}\n${text}`.slice(0, 1500);

  extractTopicsFromText(combined).forEach((t) => topics.add(t));
  return [...topics].filter(Boolean);
};

const trendArrow = (trend) => {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
};

/**
 * Genera un “Radar de tendencias” personal a partir de entradas (inbox) y/o notas.
 * - Basado en frecuencia por ventanas temporales (determinista; sin IA).
 * - Prioriza tags cuando existen.
 */
export const buildTrendsReport = (items, options = {}) => {
  const windowDays = Number.isFinite(options.windowDays) ? options.windowDays : 14;
  const maxTopics = Number.isFinite(options.maxTopics) ? options.maxTopics : 7;

  const now = new Date();
  const end = now.getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recentStart = end - windowMs;
  const prevStart = recentStart - windowMs;

  const recentCounts = new Map();
  const previousCounts = new Map();
  let analyzed = 0;

  (items || []).forEach((item) => {
    const createdAt = item && item.createdAt ? new Date(item.createdAt).getTime() : NaN;
    if (!Number.isFinite(createdAt)) return;
    if (createdAt < prevStart || createdAt > end) return;

    analyzed += 1;

    const topics = new Set(extractTopicsFromItem(item));
    if (topics.size === 0) return;

    const isRecent = createdAt >= recentStart;
    const target = isRecent ? recentCounts : previousCounts;

    topics.forEach((t) => {
      target.set(t, (target.get(t) || 0) + 1);
    });
  });

  const allTopics = new Set([...recentCounts.keys(), ...previousCounts.keys()]);
  const ranked = [...allTopics]
    .map((t) => {
      const r = recentCounts.get(t) || 0;
      const p = previousCounts.get(t) || 0;
      return { topic: t, recent: r, previous: p, total: r + p };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, maxTopics);

  const topics = ranked.map((x) => {
    const recent = x.recent;
    const previous = x.previous;
    let trend = 'stable';

    if (previous === 0 && recent > 0) {
      trend = 'up';
    } else if (recent === 0 && previous > 0) {
      trend = 'down';
    } else if (previous > 0) {
      const ratio = recent / previous;
      const delta = recent - previous;
      if (ratio >= 1.5 && delta >= 1) trend = 'up';
      else if (ratio <= 0.67 && delta <= -1) trend = 'down';
    }

    return {
      topic: x.topic,
      trend,
      arrow: trendArrow(trend),
      recentCount: recent,
      previousCount: previous,
      explanation: `${recent} en los últimos ${windowDays} días vs ${previous} en los ${windowDays} anteriores`,
    };
  });

  const ups = topics.filter((t) => t.trend === 'up');
  const downs = topics.filter((t) => t.trend === 'down');

  const insights = [];
  if (ups.length > 0) {
    insights.push(`Aumenta tu interés reciente en: ${ups.map((t) => t.topic).join(', ')}.`);
  }
  if (downs.length > 0) {
    insights.push(`Disminuye tu interés reciente en: ${downs.map((t) => t.topic).join(', ')}.`);
  }
  if (insights.length === 0 && topics.length > 0) {
    insights.push('Tu interés se mantiene bastante estable en este periodo.');
  }

  const recommendations = [];
  if (ups[0]) {
    recommendations.push(`Crear una nota índice para “${ups[0].topic}” (conceptos, enlaces y checklist).`);
  }
  if (ups[1]) {
    recommendations.push(`Convertir 1–2 entradas recientes de “${ups[1].topic}” en notas más atómicas y enlazadas.`);
  }
  if (downs[0]) {
    recommendations.push(`Si “${downs[0].topic}” ya no te aporta, archívalo o etiqueta una nota resumen para no perderlo.`);
  }

  return {
    generatedAt: now.toISOString(),
    windowDays,
    totalItemsAnalyzed: analyzed,
    topics,
    insights,
    recommendations: recommendations.slice(0, 3),
  };
};

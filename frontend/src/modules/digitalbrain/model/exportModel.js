/**
 * Modelo de dominio: exportación de notas a ficheros descargables.
 * Funciones que generan contenido descargable (Markdown, documentos originales).
 */

/**
 * Convierte un array de notas en un único texto Markdown exportable.
 */
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

/**
 * Descarga una sola nota como archivo .md (tecla D en Arcade).
 */
export const downloadNoteAsFile = (note) => {
  if (!note) return;
  const lines = [];
  lines.push(`# ${note.title || 'Nota sin título'}`);
  lines.push('');
  if (note.tags && note.tags.length > 0) {
    lines.push(`Etiquetas: ${note.tags.map((t) => `#${t}`).join(' ')}`);
    lines.push('');
  }
  lines.push(note.content || '');
  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const name = (note.title || note.id || 'nota').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim() || 'nota';
  const filename = `${name.slice(0, 80)}.md`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Descarga el documento original (archivo subido) cuando la nota tiene media.url.
 */
export const downloadNoteDocument = (note) => {
  if (!note?.media?.url) return;
  const mediaUrl = note.media.url;
  let filename;
  try {
    const pathname = new URL(mediaUrl, window.location.origin).pathname;
    filename = pathname.split('/').filter(Boolean).pop() || null;
  } catch {
    filename = null;
  }
  if (!filename) {
    const safe = (note.title || note.id || 'documento').replace(/[^\p{L}\p{N}\s._-]/gu, '_').slice(0, 80);
    filename = safe || 'documento';
  } else {
    filename = filename.split('?')[0] || filename;
  }

  fetch(mediaUrl, { credentials: 'include' })
    .then((res) => {
      if (!res.ok) throw new Error('Descarga fallida');
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'documento';
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => {});
};

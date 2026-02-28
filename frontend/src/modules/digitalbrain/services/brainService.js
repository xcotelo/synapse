// Re-exportar funciones de digitalBrainStorage
export {
  createNoteFromEntry,
  loadInbox,
  loadNotes,
  saveNotes,
  saveInbox,
} from "../digitalBrainStorage";

// Template por defecto para el contenido estructurado
export const defaultTemplate = (title, rawContent) => {
  return `# ${title}

## Contenido original

${rawContent}


`;
};

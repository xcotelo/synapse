import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { exportNotesAsMarkdown, loadNotes, saveNotes, toggleNoteReadStatus } from "../digitalBrainStorage";
import MarkdownRenderer from "./MarkdownRenderer";

// Pantalla para navegar el conocimiento ya procesado: aquí solo
// trabajamos con notas que ya han salido del inbox.
const DigitalBrainKnowledge = () => {
  // Notas procesadas cargadas desde localStorage
  const [notes, setNotes] = useState([]);
  // Texto de búsqueda libre
  const [query, setQuery] = useState("");
  // Filtro por etiqueta concreta
  const [tagFilter, setTagFilter] = useState("");
  // Id de la nota actualmente seleccionada en la lista
  const [selectedId, setSelectedId] = useState(null);

  // Cargamos todas las notas una vez al montar el componente
  useEffect(() => {
    const loadedNotes = loadNotes();
    setNotes(loadedNotes);
    // Si no hay nota seleccionada y hay notas, seleccionar la primera
    if (!selectedId && loadedNotes.length > 0) {
      setSelectedId(loadedNotes[0].id);
    }
  }, []);
  
  // Actualizar selectedNote cuando cambian las notas
  useEffect(() => {
    if (selectedId) {
      const currentNote = notes.find(n => n.id === selectedId);
      if (!currentNote && notes.length > 0) {
        // Si la nota seleccionada ya no existe, seleccionar la primera
        setSelectedId(notes[0].id);
      }
    } else if (notes.length > 0) {
      // Si no hay nota seleccionada pero hay notas, seleccionar la primera
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  // Conjunto de todas las etiquetas existentes, para el desplegable
  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [notes]);

  // Aplicamos filtros de texto y etiqueta sobre la lista de notas, y ordenamos (leídas al final)
  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      const matchesQuery = query
        ? (note.title || "").toLowerCase().includes(query.toLowerCase()) ||
          (note.content || "").toLowerCase().includes(query.toLowerCase())
        : true;

      const matchesTag = tagFilter
        ? (note.tags || []).includes(tagFilter)
        : true;

      return matchesQuery && matchesTag;
    });
    
    // Ordenar: no leídas primero, luego leídas (ambas ordenadas por fecha, más recientes primero)
    return filtered.sort((a, b) => {
      // Si una está leída y la otra no, la no leída va primero
      if (a.isRead && !b.isRead) return 1;
      if (!a.isRead && b.isRead) return -1;
      // Si ambas tienen el mismo estado de lectura, ordenar por fecha (más recientes primero)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [notes, query, tagFilter]);

  // Nota seleccionada que mostramos en detalle a la derecha
  const selectedNote = useMemo(() => {
    if (!selectedId && filteredNotes.length > 0) {
      return filteredNotes[0];
    }
    const found = filteredNotes.find((n) => n.id === selectedId);
    // Si la nota seleccionada ya no está en la lista filtrada, usar la primera disponible
    return found || (filteredNotes.length > 0 ? filteredNotes[0] : null);
  }, [filteredNotes, selectedId]);

  // Genera y descarga un único fichero Markdown con todas las notas
  const handleExport = () => {
    const markdown = exportNotesAsMarkdown(notes);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "digital-brain-notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Marca una nota como leída o no leída
  const handleToggleRead = (noteId, e) => {
    e.stopPropagation(); // Evita que se seleccione la nota al hacer clic en el checkbox
    const updatedNotes = toggleNoteReadStatus(noteId);
    setNotes(updatedNotes);
    
    // Si la nota que se marcó como leída es la seleccionada, mantenerla seleccionada
    // pero actualizar el estado para que se refleje en la vista
    if (selectedId === noteId) {
      // El selectedNote se actualizará automáticamente por el useMemo
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Conocimiento procesado</h2>
        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={handleExport}
          >
            Exportar a Markdown
          </button>
          <Link to="/brain/inbox" className="btn btn-sm btn-primary">
            Ir al inbox
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-muted">
          Aún no has procesado ninguna entrada. Empieza en el {" "}
          <Link to="/brain/inbox">inbox</Link>.
        </p>
      ) : (
        <div className="row">
          <div className="col-12 col-lg-4 mb-3">
            <div className="mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por texto..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <select
                className="form-select"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              >
                <option value="">Todas las etiquetas</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <ul className="list-group" style={{ maxHeight: "50vh", overflowY: "auto" }}>
              {filteredNotes.map((note) => (
                <li
                  key={note.id}
                  className={`list-group-item list-group-item-action ${
                    selectedNote && selectedNote.id === note.id ? "active" : ""
                  } ${note.isRead ? "note-read" : ""}`}
                  onClick={() => setSelectedId(note.id)}
                  style={{ 
                    cursor: "pointer",
                    opacity: note.isRead ? 0.6 : 1,
                    backgroundColor: note.isRead ? "#f8f9fa" : "inherit",
                    textDecoration: note.isRead ? "line-through" : "none",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={note.isRead || false}
                          onChange={(e) => handleToggleRead(note.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: "pointer", marginTop: "2px" }}
                          title={note.isRead ? "Marcar como no leída" : "Marcar como leída"}
                        />
                        <div className={`fw-bold ${note.isRead ? "text-muted" : ""}`} style={{ textDecoration: note.isRead ? "line-through" : "none" }}>
                          {note.title || "Nota sin título"}
                        </div>
                      </div>
                      <small className={`d-block ${note.isRead ? "text-muted" : ""}`} style={{ textDecoration: note.isRead ? "line-through" : "none" }}>
                        {note.destination} • {note.type}
                      </small>
                    </div>
                    <small className="text-muted ms-2" style={{ textDecoration: note.isRead ? "line-through" : "none" }}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-12 col-lg-8">
            {selectedNote ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className={`h5 mb-0 ${selectedNote.isRead ? "text-muted" : ""}`} style={{ textDecoration: selectedNote.isRead ? "line-through" : "none" }}>
                    {selectedNote.title || "Nota sin título"}
                  </h3>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedNote.isRead || false}
                      onChange={(e) => handleToggleRead(selectedNote.id, e)}
                      id={`read-checkbox-${selectedNote.id}`}
                      style={{ cursor: "pointer", width: "1.2rem", height: "1.2rem" }}
                    />
                    <label 
                      className="form-check-label ms-2" 
                      htmlFor={`read-checkbox-${selectedNote.id}`}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {selectedNote.isRead ? "Leída" : "Marcar como leída"}
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className={`badge bg-${selectedNote.destination === "apunte" ? "primary" : selectedNote.destination === "idea" ? "info" : selectedNote.destination === "recurso" ? "success" : "warning"}`}>
                      {selectedNote.destination}
                    </span>
                    <span className="badge bg-secondary">
                      {selectedNote.type}
                    </span>
                  </div>
                  {selectedNote.tags && selectedNote.tags.length > 0 && (
                    <div className="mb-3">
                      {selectedNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge bg-light text-dark border me-1 mb-1"
                          style={{ fontSize: "0.85rem" }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div 
                  className="card border-0 shadow-sm p-4" 
                  style={{ 
                    backgroundColor: selectedNote.isRead ? "#e9ecef" : "#f8f9fa",
                    opacity: selectedNote.isRead ? 0.7 : 1,
                  }}
                >
                  <div style={{ textDecoration: selectedNote.isRead ? "line-through" : "none" }}>
                    <MarkdownRenderer content={selectedNote.content} />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted mb-0">No hay ninguna nota seleccionada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalBrainKnowledge;


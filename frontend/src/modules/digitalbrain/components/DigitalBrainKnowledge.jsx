import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { exportNotesAsMarkdown, loadNotes } from "../digitalBrainStorage";

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
    setNotes(loadNotes());
  }, []);

  // Conjunto de todas las etiquetas existentes, para el desplegable
  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [notes]);

  // Aplicamos filtros de texto y etiqueta sobre la lista de notas
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesQuery = query
        ? (note.title || "").toLowerCase().includes(query.toLowerCase()) ||
          (note.content || "").toLowerCase().includes(query.toLowerCase())
        : true;

      const matchesTag = tagFilter
        ? (note.tags || []).includes(tagFilter)
        : true;

      return matchesQuery && matchesTag;
    });
  }, [notes, query, tagFilter]);

  // Nota seleccionada que mostramos en detalle a la derecha
  const selectedNote = useMemo(() => {
    if (!selectedId && filteredNotes.length > 0) {
      return filteredNotes[0];
    }
    return filteredNotes.find((n) => n.id === selectedId) || null;
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
                  }`}
                  onClick={() => setSelectedId(note.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">
                        {note.title || "Nota sin título"}
                      </div>
                      <small className="d-block">
                        {note.destination} • {note.type}
                      </small>
                    </div>
                    <small className="text-muted ms-2">
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
                <h3 className="h5">{selectedNote.title}</h3>
                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className="mb-2">
                    {selectedNote.tags.map((tag) => (
                      <span
                        key={tag}
                        className="badge bg-secondary me-1 mb-1"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <pre
                  className="mt-3"
                  style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}
                >
                  {selectedNote.content}
                </pre>
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


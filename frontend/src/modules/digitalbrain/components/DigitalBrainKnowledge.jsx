import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { exportNotesAsMarkdown, loadNotes, saveNotes, toggleNoteReadStatus, deleteNoteById } from "../digitalBrainStorage";
import MarkdownRenderer from "./MarkdownRenderer";

// Pantalla para navegar el conocimiento ya procesado: aquí solo
// trabajamos con notas que ya han salido del inbox.
const DigitalBrainKnowledge = () => {
  // Notas procesadas cargadas desde localStorage
  const [notes, setNotes] = useState([]);
  // Id de la nota actualmente seleccionada en la lista
  const [selectedId, setSelectedId] = useState(null);
  // Categoría actualmente seleccionada
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Resumen por categorías: web, vídeos, música, otras
  const categorySummary = useMemo(() => {
    const summary = {
      web: 0,
      videos: 0,
      musica: 0,
      otras: 0,
    };

    notes.forEach((note) => {
      const type = note.type || "";
      const hasAudio = note.media && note.media.contentType && note.media.contentType.startsWith("audio/");

      if (type === "link") {
        summary.web += 1;
      } else if (type === "video") {
        summary.videos += 1;
      } else if (hasAudio) {
        summary.musica += 1;
      } else {
        summary.otras += 1;
      }
    });

    return summary;
  }, [notes]);

  // Cargamos todas las notas una vez al montar el componente
  useEffect(() => {
    const loadedNotes = loadNotes();
    setNotes(loadedNotes);
  }, []);
  
  // Actualizar selectedNote cuando cambian las notas
  useEffect(() => {
    if (selectedId) {
      const currentNote = notes.find(n => n.id === selectedId);
      if (!currentNote && notes.length > 0) {
        // Si la nota seleccionada ya no existe, seleccionar la primera
        setSelectedId(notes[0].id);
      }
    }
  }, [notes, selectedId]);

  const categorizeNote = (note) => {
    const type = note.type || "";
    const isAudio =
      note.media &&
      note.media.contentType &&
      note.media.contentType.startsWith("audio/");

    if (type === "link") return "web";
    if (type === "video") return "videos";
    if (isAudio) return "musica";
    return "otras";
  };

  // Notas filtradas por categoría (y ordenadas: no leídas primero)
  const filteredNotes = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    const filtered = notes.filter((note) => categorizeNote(note) === selectedCategory);

    return filtered.sort((a, b) => {
      if (a.isRead && !b.isRead) return 1;
      if (!a.isRead && b.isRead) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [notes, selectedCategory]);

  // Nota seleccionada que mostramos en detalle a la derecha
  const selectedNote = useMemo(() => {
    if (!selectedId && filteredNotes.length > 0) {
      return filteredNotes[0];
    }
    const found = filteredNotes.find((n) => n.id === selectedId);
    // Si la nota seleccionada ya no está en la lista filtrada, usar la primera disponible
    return found || (filteredNotes.length > 0 ? filteredNotes[0] : null);
  }, [filteredNotes, selectedId]);

  // Si cambia la categoría y la nota seleccionada ya no pertenece, seleccionar la primera de la categoría
  useEffect(() => {
    if (!selectedCategory) {
      setSelectedId(null);
      return;
    }
    if (filteredNotes.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = filteredNotes.some((n) => n.id === selectedId);
    if (!stillExists) {
      setSelectedId(filteredNotes[0].id);
    }
  }, [selectedCategory, filteredNotes, selectedId]);

  const handleDeleteSelected = () => {
    if (!selectedNote) return;
    const updatedNotes = deleteNoteById(selectedNote.id);
    setNotes(updatedNotes);
    if (updatedNotes.length > 0) {
      setSelectedId(updatedNotes[0].id);
    } else {
      setSelectedId(null);
    }
  };

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
          <div className="col-12 mb-3">
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`card text-center shadow-sm w-100 ${selectedCategory === "web" ? "border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCategory((prev) => (prev === "web" ? null : "web"))}
                >
                  <div className="card-body">
                    <h6 className="card-title mb-1">WEB</h6>
                    <div className="display-6">{categorySummary.web}</div>
                  </div>
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`card text-center shadow-sm w-100 ${selectedCategory === "videos" ? "border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCategory((prev) => (prev === "videos" ? null : "videos"))}
                >
                  <div className="card-body">
                    <h6 className="card-title mb-1">VÍDEOS</h6>
                    <div className="display-6">{categorySummary.videos}</div>
                  </div>
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`card text-center shadow-sm w-100 ${selectedCategory === "musica" ? "border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCategory((prev) => (prev === "musica" ? null : "musica"))}
                >
                  <div className="card-body">
                    <h6 className="card-title mb-1">MÚSICA</h6>
                    <div className="display-6">{categorySummary.musica}</div>
                  </div>
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`card text-center shadow-sm w-100 ${selectedCategory === "otras" ? "border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCategory((prev) => (prev === "otras" ? null : "otras"))}
                >
                  <div className="card-body">
                    <h6 className="card-title mb-1">OTRAS</h6>
                    <div className="display-6">{categorySummary.otras}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          {selectedCategory && (
          <div className="col-12 col-lg-4 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-semibold text-uppercase">
                {selectedCategory === "web"
                  ? "Web"
                  : selectedCategory === "videos"
                  ? "Vídeos"
                  : selectedCategory === "musica"
                  ? "Música"
                  : "Otras"}
              </div>
              <span className="badge bg-secondary">{filteredNotes.length}</span>
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
                    opacity: 1,
                    backgroundColor: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="fw-bold">
                          {note.title || "Nota sin título"}
                        </div>
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
          )}

          {selectedCategory && (
          <div className="col-12 col-lg-8">
            {selectedNote ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className={`h5 mb-0 ${selectedNote.isRead ? "text-muted" : ""}`} style={{ textDecoration: selectedNote.isRead ? "line-through" : "none" }}>
                    {selectedNote.title || "Nota sin título"}
                  </h3>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check mb-0">
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
                    <div className="form-check mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`delete-checkbox-${selectedNote.id}`}
                        onChange={handleDeleteSelected}
                        style={{ cursor: "pointer", width: "1.2rem", height: "1.2rem" }}
                      />
                      <label
                        className="form-check-label ms-2 text-danger"
                        htmlFor={`delete-checkbox-${selectedNote.id}`}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        Borrar este conocimiento
                      </label>
                    </div>
                  </div>
                </div>
                {selectedNote.media && selectedNote.media.url && (
                  <div className="mb-3">
                    {selectedNote.media.contentType && selectedNote.media.contentType.startsWith("audio/") ? (
                      <audio controls style={{ width: "100%" }} src={selectedNote.media.url}>
                        Your browser does not support the audio element.
                      </audio>
                    ) : selectedNote.media.contentType && selectedNote.media.contentType.startsWith("video/") ? (
                      <video controls style={{ width: "100%", maxHeight: "400px" }} src={selectedNote.media.url}>
                        Your browser does not support the video tag.
                      </video>
                    ) : null}
                  </div>
                )}
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
          )}
        </div>
      )}
    </div>
  );
};

export default DigitalBrainKnowledge;


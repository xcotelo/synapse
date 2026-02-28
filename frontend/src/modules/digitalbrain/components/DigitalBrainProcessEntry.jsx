import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { appFetch, fetchConfig } from "../../../backend/appFetch";

import {
  createNoteFromEntry,
  loadInbox,
  loadNotes,
  saveNotes,
  saveInbox,
  defaultTemplate,
} from "../services/brainService";

export const DigitalBrainProcessEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(undefined);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("apunte");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  useEffect(() => {
    const inbox = loadInbox();
    const found = inbox.find((item) => item.id === id);

    // No se ha encontrado la entrada
    if (!found) {
      setEntry(null);
      return;
    }

    // Guardamos la entrada original
    setEntry(found);

    // Pedimos sugerencias al backend (IA/reglas)
    setLoadingSuggestion(true);
    setSuggestionError(null);

    appFetch(
      "/brain/suggest",
      fetchConfig("POST", { content: found.rawContent }),
      (data) => {
        setAiSuggestion(data);

        // Usamos las sugerencias para pre-rellenar el formulario
        const baseTitle = data.title || (found.type === "tarea" ? "Tarea" : "Nota");
        setTitle(baseTitle);
        if (data.destination) {
          setDestination(data.destination);
        }
        if (data.tags && Array.isArray(data.tags)) {
          setTags(data.tags.join(", "));
        }

        const summaryPart = data.summary ? `\n\n## Resumen (sugerido por IA)\n\n${data.summary}\n` : "";
        setContent(defaultTemplate(baseTitle, found.rawContent + summaryPart));
        setLoadingSuggestion(false);
      },
      () => {
        // Si la "IA" falla, seguimos con el comportamiento básico
        const baseTitle = found.type === "tarea" ? "Tarea" : "Nota";
        setTitle(baseTitle);
        setContent(defaultTemplate(baseTitle, found.rawContent));
        setSuggestionError("No se pudieron cargar sugerencias automáticas.");
        setLoadingSuggestion(false);
      }
    );
  }, [id]);

  // Al guardar, creamos una nota nueva a partir de la entrada
  // y la movemos del inbox a la colección de notas procesadas
  const handleSave = (e) => {
    e.preventDefault();
    if (!entry) return;

    // 1. Cargar datos actuais
    const notes = loadNotes();
    const inbox = loadInbox();

    // 2. Crear nota estructurada a partir da entrada e os campos do formulario
    const note = createNoteFromEntry(entry, {
      title,
      destination,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      structuredContent: content,
      type: aiSuggestion && aiSuggestion.type ? aiSuggestion.type : entry.type,
    });

    // 3. Actualizar a lista de notas procesadas e eliminar a entrada do inbox
    const updatedNotes = [note, ...notes];
    const updatedInbox = inbox.filter((item) => item.id !== entry.id);

    // 4. Gardar cambios
    saveNotes(updatedNotes);
    saveInbox(updatedInbox);

    // 5. Ir á pantalla de coñecemento
    navigate("/brain/knowledge");
  };

  // Versión recortada del texto original para mostrar como vista previa
  const rawPreview = useMemo(() => {
    if (!entry) return "";
    return entry.rawContent.length > 400
      ? `${entry.rawContent.substring(0, 400)}...`
      : entry.rawContent;
  }, [entry]);

  const getTypeBadgeColor = (type) => {
    const colors = {
      link: "primary",
      video: "danger",
      tarea: "warning",
      codigo: "info",
      nota: "secondary",
    };
    return colors[type] || "secondary";
  };

  const getTypeIcon = (type) => {
    const icons = {
      link: "🔗",
      video: "🎥",
      tarea: "✓",
      codigo: "💻",
      nota: "📝",
    };
    return icons[type] || "📄";
  };

  // Mostrar estado de carga mientras se busca la entrada
  if (entry === undefined) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando entrada...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si no se encontró la entrada
  if (entry === null) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">⚠️ Entrada no encontrada</h4>
          <p className="mb-0">
            No se ha encontrado la entrada. Vuelve al {" "}
            <Link to="/brain/inbox" className="alert-link">inbox</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: "1200px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">
          <span style={{ fontSize: "1.8rem" }}>🤖</span> Procesar con IA
        </h2>
        <Link to="/brain/inbox" className="btn btn-outline-secondary">
          ← Volver al inbox
        </Link>
      </div>

      <div className="row g-4">
        {/* Panel izquierdo: Entrada original y sugerencias de IA */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom">
              <h3 className="h6 mb-0">
                <span className="me-2">{getTypeIcon(entry.type)}</span>
                Entrada original
              </h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <span
                  className={`badge bg-${getTypeBadgeColor(entry.type)} text-uppercase me-2`}
                >
                  {entry.type}
                </span>
                <small className="text-muted">
                  {new Date(entry.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
              <div
                className="p-3 bg-light rounded"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "300px",
                  overflowY: "auto",
                  fontSize: "0.9rem",
                }}
              >
                {rawPreview}
              </div>

              {/* Sugerencias de IA */}
              {loadingSuggestion && (
                <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="text-primary">
                      <strong>🤖 Analizando con Claude AI...</strong>
                    </span>
                  </div>
                  <small className="text-muted d-block mt-2">
                    Extrayendo contenido y clasificando...
                  </small>
                </div>
              )}

              {aiSuggestion && !loadingSuggestion && (
                <div className="mt-4 p-3 bg-success bg-opacity-10 rounded border border-success border-opacity-25">
                  <h5 className="h6 mb-3">
                    <span>✨</span> Sugerencias de IA
                  </h5>
                  <div className="small">
                    <div className="mb-2">
                      <strong>Tipo detectado:</strong>{" "}
                      <span className={`badge bg-${getTypeBadgeColor(aiSuggestion.type)}`}>
                        {aiSuggestion.type}
                      </span>
                    </div>
                    {aiSuggestion.summary && (
                      <div className="mb-2">
                        <strong>Resumen:</strong>
                        <p className="mb-0 mt-1">{aiSuggestion.summary}</p>
                      </div>
                    )}
                    {aiSuggestion.destination && (
                      <div className="mb-2">
                        <strong>Destino sugerido:</strong>{" "}
                        <span className="badge bg-info">{aiSuggestion.destination}</span>
                      </div>
                    )}
                    {aiSuggestion.tags && aiSuggestion.tags.length > 0 && (
                      <div>
                        <strong>Etiquetas sugeridas:</strong>
                        <div className="mt-1">
                          {aiSuggestion.tags.map((tag, idx) => (
                            <span key={idx} className="badge bg-secondary me-1">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {suggestionError && (
                <div className="mt-4 alert alert-warning" role="alert">
                  <small>{suggestionError}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho: Formulario de edición */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom">
              <h3 className="h6 mb-0">
                <span>📝</span> Transformar en conocimiento
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label htmlFor="title-input" className="form-label fw-semibold">
                    Título de la nota
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    className="form-control form-control-lg"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título descriptivo..."
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="destination-select" className="form-label fw-semibold">
                    Destino
                  </label>
                  <select
                    id="destination-select"
                    className="form-select"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="apunte">📚 Apunte de estudio</option>
                    <option value="idea">💡 Idea conectada</option>
                    <option value="recurso">🔗 Recurso / referencia</option>
                    <option value="tarea">✓ Lista de tareas</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="tags-input" className="form-label fw-semibold">
                    Etiquetas
                  </label>
                  <input
                    id="tags-input"
                    type="text"
                    className="form-control"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Separadas por comas: sistemas operativos, round-robin..."
                  />
                  <small className="text-muted">
                    Servirán para relacionar esta nota con otras más adelante.
                  </small>
                </div>

                <div className="mb-4">
                  <label htmlFor="content-textarea" className="form-label fw-semibold">
                    Contenido estructurado (Markdown)
                  </label>
                  <textarea
                    id="content-textarea"
                    className="form-control"
                    rows="12"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                  />
                  <small className="text-muted">
                    Usa títulos, listas y enlaces en Markdown. Esta será la versión
                    reutilizable de la nota.
                  </small>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Link to="/brain/inbox" className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                  <button type="submit" className="btn btn-primary btn-lg px-4">
                    <span>💾</span> Guardar nota y sacar del inbox
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainProcessEntry;


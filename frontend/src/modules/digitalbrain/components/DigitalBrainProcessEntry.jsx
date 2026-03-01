import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import "./ProcessEntryDatepicker.css";
import { appFetch, fetchConfig } from "../../../backend/appFetch";
import {
  createNoteFromEntry,
  loadInbox,
  loadNotes,
  saveNotes,
  saveInbox,
  defaultTemplate,
  updateLastProcessed,
  extractFirstUrl,
  extractYouTubeId,
} from "../services/brainService";
import { useNotifications } from "../../common/components/NotificationContext";

registerLocale("es", es);
setDefaultLocale("es");

export const DigitalBrainProcessEntry = ({ entryId: entryIdProp, batchMode, onAfterSave }) => {
  const { id: idFromParams } = useParams();
  const navigate = useNavigate();
  const id = batchMode ? entryIdProp : idFromParams;
  const { requestNotificationPermission, refreshReminders } = useNotifications();
  const [entry, setEntry] = useState(undefined);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [content, setContent] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  // Estados para Fact-Checking
  const [factCheckResults, setFactCheckResults] = useState(null);
  const [loadingFactCheck, setLoadingFactCheck] = useState(false);
  const [factCheckError, setFactCheckError] = useState(null);

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

    // Si la entrada ya tiene una sugerencia (por ejemplo, tras subir un archivo), la reutilizamos.
    if (found.aiSuggestion) {
      const data = found.aiSuggestion;
      setAiSuggestion(data);

      const baseTitle = data.title || (found.type === "tarea" ? "Tarea" : "Nota");
      setTitle(baseTitle);
      if (data.tags && Array.isArray(data.tags)) {
        setTags(data.tags.join(", "));
      }

      // Si viene un Markdown completo desde IA (detailedContent), lo usamos.
      // Si no, caemos al template.
      if (data.detailedContent) {
        setContent(data.detailedContent);
      } else {
        const summaryPart = data.summary
          ? `\n\n## Resumen (sugerido por IA)\n\n${data.summary}\n`
          : "";
        setContent(defaultTemplate(baseTitle, found.rawContent + summaryPart));
      }
      setLoadingSuggestion(false);
      setSuggestionError(null);
      return;
    }

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
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
      structuredContent: content,
      type: aiSuggestion && aiSuggestion.type ? aiSuggestion.type : entry.type,
      mediaUrl: entry.media && entry.media.url ? entry.media.url : undefined,
      mediaContentType:
        entry.media && entry.media.contentType ? entry.media.contentType : undefined,
    });

    // 3. Actualizar a lista de notas procesadas e eliminar a entrada do inbox
    const updatedNotes = [note, ...notes];
    const updatedInbox = inbox.filter((item) => item.id !== entry.id);

    // 4. Gardar cambios
    saveNotes(updatedNotes);
    saveInbox(updatedInbox);

    if (note.reminderAt) {
      refreshReminders();
    }

    // Resetear strikes
    updateLastProcessed();

    // 4.1 Persistir también en formato abierto (Markdown en disco) via backend.
    // Best-effort: si falla, la app sigue funcionando con localStorage.
    appFetch(
      "/brain/notes",
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
      (data) => {
        if (!data || !data.storageId) return;

        // Guardar el storageId en la nota (localStorage) para poder borrarla del disco.
        try {
          const current = loadNotes();
          const patched = current.map((n) =>
            n.id === note.id ? { ...n, storageId: data.storageId } : n
          );
          saveNotes(patched);
        } catch (err) {
          // Ignorar: no bloquea UX
        }
      },
      () => {
        // Ignorar: no bloquea UX
      }
    );

    // 5. En modo lote llamamos al callback; si no, ir a arcade
    if (batchMode && onAfterSave) {
      onAfterSave();
    } else {
      navigate("/brain/arcade");
    }
  };

  const handleFactCheck = () => {
    if (!content.trim()) return;

    setLoadingFactCheck(true);
    setFactCheckError(null);
    setFactCheckResults(null);

    appFetch(
      "/brain/fact-check",
      fetchConfig("POST", { content: content }),
      (data) => {
        if (data && data.claims) {
          setFactCheckResults(data.claims);
        } else {
          setFactCheckError("No se pudieron extraer afirmaciones para verificar.");
        }
        setLoadingFactCheck(false);
      },
      () => {
        setFactCheckError("Error al conectar con el servicio de fact-checking.");
        setLoadingFactCheck(false);
      }
    );
  };

  const applyCorrection = (original, correction) => {
    if (!correction) return;
    const newContent = content.replace(original, correction);
    setContent(newContent);
    // Eliminar la afirmación de la lista de resultados para indicar que ya se trató
    setFactCheckResults(prev => prev.filter(c => c.originalText !== original));
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
      <div className="container mt-4 process-entry-page">
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
      <div className="container mt-4 process-entry-page">
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
    <div className={`container synapse-brain-page process-entry-page ${batchMode ? "synapse-brain-page--batch" : ""}`} style={{ maxWidth: "1200px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4 synapse-animate-in">
        <h2 className="synapse-brain-title mb-0 d-flex align-items-center gap-2">
          <span aria-hidden>🤖</span> Procesar con IA
        </h2>
        {batchMode ? (
          <Link to="/brain/inbox" className="btn btn-outline-secondary synapse-brain-btn">
            Cancelar y volver al inbox
          </Link>
        ) : (
          <Link to="/brain/inbox" className="btn btn-outline-primary synapse-brain-btn">
            ← Volver al inbox
          </Link>
        )}
      </div>

      <div className="row g-4">
        {/* Panel izquierdo: Entrada original y sugerencias de IA */}
        <div className="col-12 col-lg-5">
          <div className="card synapse-brain-card h-100 synapse-animate-in synapse-animate-in-delay-1">
            <div className="card-header">
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

              {/* Renderizado de Video/Audio (YouTube o Nativo) */}
              {entry.type === "video" && (
                <div className="mt-3 rounded overflow-hidden shadow-sm">
                  {extractYouTubeId(entry.rawContent) ? (
                    <iframe
                      width="100%"
                      height="240"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(entry.rawContent)}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : entry.media && entry.media.url ? (
                    <video
                      src={entry.media.url}
                      controls
                      width="100%"
                      style={{ maxHeight: "300px", backgroundColor: "#000" }}
                    />
                  ) : null}
                </div>
              )}

              {entry.type === "audio" && entry.media && entry.media.url && (
                <div className="mt-3 p-2 bg-light rounded border">
                  <audio src={entry.media.url} controls className="w-100" />
                </div>
              )}

              {/* Sugerencias de IA */}
              {loadingSuggestion && (
                <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="text-primary">
                      <strong>🤖 Analizando con Llama AI...</strong>
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
          <div className="card synapse-brain-card synapse-animate-in synapse-animate-in-delay-2">
            <div className="card-header">
              <h3 className="h6 mb-0">
                <span aria-hidden>📝</span> Transformar en conocimiento
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

                <div className="mb-3 process-entry-reminder-wrap">
                  <label htmlFor="reminder-input" className="form-label fw-semibold">
                    Recordatorio
                  </label>
                  <DatePicker
                    id="reminder-input"
                    selected={reminderAt ? new Date(reminderAt) : null}
                    onChange={(d) => setReminderAt(d ? d.toISOString().slice(0, 16) : "")}
                    onFocus={requestNotificationPermission}
                    minDate={new Date()}
                    showTimeSelect
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="dd/MM/yyyy HH:mm"
                    locale="es"
                    className="form-control process-entry-datepicker-input"
                    calendarClassName="process-entry-datepicker-calendar"
                    placeholderText="dd/mm/aaaa, --:--"
                  />
                  <small className="text-muted">
                    Te avisaremos en el momento exacto con una notificación del sistema.
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

                <div className="d-flex flex-wrap gap-2 justify-content-between">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-info"
                      onClick={handleFactCheck}
                      disabled={loadingFactCheck || !content.trim()}
                    >
                      {loadingFactCheck ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Verificando...
                        </>
                      ) : (
                        <>
                          <span>🔍</span> Verificar información
                        </>
                      )}
                    </button>
                  </div>
                  <div className="d-flex gap-2">
                    <Link to="/brain/inbox" className="btn btn-outline-secondary">
                      Cancelar
                    </Link>
                    <button type="submit" className="btn btn-primary synapse-brain-btn px-4">
                      <span aria-hidden>💾</span> {batchMode ? "Guardar y siguiente" : "Guardar nota y sacar del inbox"}
                    </button>
                  </div>
                </div>

                {/* Resultados de Fact-Checking */}
                {factCheckError && (
                  <div className="alert alert-danger mt-3 mb-0">
                    <small>{factCheckError}</small>
                  </div>
                )}

                {factCheckResults && factCheckResults.length > 0 && (
                  <div className="mt-4 p-4 rounded-4 border-0 shadow-sm" style={{
                    background: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="h6 mb-0 d-flex align-items-center">
                        <span className="me-2">⚖️</span> Resultados de Verificación (Beta)
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-sm"
                        onClick={() => setFactCheckResults(null)}
                      ></button>
                    </div>

                    <div className="list-group list-group-flush bg-transparent">
                      {factCheckResults.map((claim, idx) => {
                        const isFalse = claim.status === 'false';
                        const isSuspicious = claim.status === 'suspicious';
                        const isTrue = claim.status === 'true';

                        return (
                          <div key={idx} className="list-group-item bg-transparent border-0 px-0 py-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className={`badge ${isTrue ? 'bg-success' : isFalse ? 'bg-danger' : 'bg-warning text-dark'
                                } text-uppercase px-2 py-1`}>
                                {isTrue ? '✓ Verdad' : isFalse ? '✘ Falso' : '⚠ Dudoso'}
                              </span>
                            </div>
                            <p className="mb-2 fw-semibold" style={{ fontSize: '0.95rem' }}>"{claim.originalText}"</p>
                            <div className="p-2 rounded bg-white bg-opacity-50 small mb-2 border">
                              <strong>Análisis:</strong> {claim.explanation}
                            </div>
                            {(isFalse || isSuspicious) && claim.correction && (
                              <div className="d-flex flex-column gap-2 mt-2">
                                <div className="p-2 rounded bg-info bg-opacity-10 border border-info border-opacity-25 small">
                                  <strong>Corrección sugerida:</strong> {claim.correction}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-info text-white align-self-end mt-1"
                                  onClick={() => applyCorrection(claim.originalText, claim.correction)}
                                >
                                  Aplicar corrección
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <small className="text-muted d-block mt-3 text-center">
                      ⚠ La verificación es realizada por IA y puede contener imprecisiones.
                    </small>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainProcessEntry;


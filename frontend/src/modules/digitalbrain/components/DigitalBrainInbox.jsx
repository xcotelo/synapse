import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import { createInboxEntry, loadInbox, saveInbox, loadNotes } from "../digitalBrainStorage";
import { appFetch, fetchConfig } from "../../../backend/appFetch";
import "./FileDropZone.css";

// Collemos o input do usuario e gárdase como entrada pendente
const DigitalBrainInbox = () => {
  // Texto actual do textarea
  const [input, setInput] = useState("");
  // Lista de entradas pendentes almacenadas en localStorage
  const [inbox, setInbox] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [previewLoading, setPreviewLoading] = useState({});
  const [previewError, setPreviewError] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const navigate = useNavigate();

  // Cargamos as entradas xa gardadas no localStorage ao montar o componente
  useEffect(() => {
    setInbox(loadInbox());
  }, []);

  // Mantener sincronizado el inbox con localStorage al volver a la pestaña/ventana
  useEffect(() => {
    const refreshInbox = () => setInbox(loadInbox());

    window.addEventListener("focus", refreshInbox);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        refreshInbox();
      }
    });

    return () => {
      window.removeEventListener("focus", refreshInbox);
    };
  }, []);

  // Engade unha nova entrada ao inbox a partir do textarea.
  // Importante para el reto: capturamos sin fricción y procesamos más tarde.
  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const entry = createInboxEntry(input.trim());   // Crea a nova entrada
    const updated = [entry, ...inbox]; // Engade a nova entrada al inicio de la lista
    setInbox(updated);
    saveInbox(updated);
    setInput("");
  };

  // Elimina unha entrada concreta do inbox
  const handleDiscard = (id) => {
    const updated = inbox.filter((item) => item.id !== id);
    setInbox(updated);
    saveInbox(updated);
  };

  const handleClearAll = () => {
    if (inbox.length === 0) return;
    const ok = window.confirm(
      `Vas a vaciar el inbox (${inbox.length} entradas). ¿Continuar?`
    );
    if (!ok) return;
    setInbox([]);
    saveInbox([]);
  };

  const handleDiscardOlderThan = (days) => {
    if (inbox.length === 0) return;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const older = inbox.filter((i) => {
      const t = Date.parse(i.createdAt);
      return Number.isFinite(t) ? t < cutoff : false;
    });
    if (older.length === 0) {
      window.alert(`No hay entradas de más de ${days} días.`);
      return;
    }
    const ok = window.confirm(
      `Vas a descartar ${older.length} entradas de más de ${days} días. ¿Continuar?`
    );
    if (!ok) return;
    const updated = inbox.filter((i) => !older.some((o) => o.id === i.id));
    setInbox(updated);
    saveInbox(updated);
  };

  // Navega a la pantalla de procesado para esa entrada
  const handleProcess = (id) => {
    navigate(`/brain/process/${id}`);
  };

  const extractFirstUrl = (text) => {
    if (!text) return null;
    const match = text.match(/(https?:\/\/\S+|www\.\S+)/i);
    if (!match) return null;
    let url = match[0];
    // Quitar puntuación típica al final
    url = url.replace(/[),.;!?\]]+$/g, "");
    if (/^www\./i.test(url)) {
      url = `http://${url}`;
    }
    return url;
  };

  const handleLoadPreview = (id) => {
    const item = inbox.find((i) => i.id === id);
    if (!item) return;
    if (item.linkPreview) return;

    const url = extractFirstUrl(item.rawContent);
    if (!url) {
      setPreviewError((prev) => ({ ...prev, [id]: "No se encontró una URL." }));
      return;
    }

    setPreviewLoading((prev) => ({ ...prev, [id]: true }));
    setPreviewError((prev) => ({ ...prev, [id]: null }));

    appFetch(
      `/brain/preview?url=${encodeURIComponent(url)}`,
      fetchConfig("GET"),
      (data) => {
        const current = loadInbox();
        const updated = current.map((x) =>
          x.id === id ? { ...x, linkPreview: data } : x
        );
        saveInbox(updated);
        setInbox(updated);
        setPreviewLoading((prev) => ({ ...prev, [id]: false }));
      },
      () => {
        setPreviewLoading((prev) => ({ ...prev, [id]: false }));
        setPreviewError((prev) => ({ ...prev, [id]: "No se pudo cargar la vista previa." }));
      }
    );
  };

  // Sube un archivo (mp3/mp4). La IA puede sugerir, pero el usuario valida en “Procesar”.
  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Procesar cada archivo seleccionado
    Array.from(files).forEach(file => processFile(file));

    // Permitir volver a seleccionar el mismo archivo si es necesario
    event.target.value = "";
  };

  // Función genérica para procesar un archivo
  const processFile = (file) => {
    const formData = new FormData();
    formData.append("file", file);

    // Crear la entrada en el inbox inmediatamente para que aparezca siempre en "pendientes de procesar"
    const inbox = loadInbox();

    let fileType = "nota";
    if (file.type) {
      if (file.type.startsWith("video")) {
        fileType = "video";
      } else if (file.type.startsWith("audio")) {
        fileType = "audio";
      }
    }

    const inboxEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      rawContent: `Archivo subido: ${file.name}`,
      type: fileType,
      createdAt: new Date().toISOString(),
      source: "upload",
      status: "inbox",
    };

    const updatedInbox = [inboxEntry, ...inbox];
    saveInbox(updatedInbox);
    setInbox(updatedInbox);

    appFetch(
      "/brain/suggest/file",
      fetchConfig("POST", formData),
      (response) => {
        if (!response) return;

        // Guardar la sugerencia y el mediaUrl dentro de la entrada del inbox.
        // El usuario confirmará/editará todo en la pantalla de “Procesar”.
        const currentInbox = loadInbox();
        const updated = currentInbox.map((item) => {
          if (item.id !== inboxEntry.id) return item;
          return {
            ...item,
            type: response.type || item.type,
            aiSuggestion: response,
            media: response.mediaUrl
              ? { url: response.mediaUrl, contentType: response.mediaContentType || file.type }
              : item.media,
          };
        });
        saveInbox(updated);
        setInbox(updated);
      },
      (error) => {
        console.error("Error procesando archivo con IA:", error);
      }
    );
  };

  // Handlers para Drag and Drop robustos para evitar "convulsiones" (flickering)
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Importante: no quitar esto, permite el drop
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => processFile(file));
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      link: "primary",
      video: "danger",
      audio: "success",
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
      audio: "🎧",
      tarea: "✓",
      codigo: "💻",
      nota: "📝",
    };
    return icons[type] || "📄";
  };

  const notesCount = loadNotes().length;

  const filteredInbox = useMemo(() => {
    let items = [...inbox];

    if (typeFilter !== "all") {
      items = items.filter((i) => (i.type || "") === typeFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter((i) => (i.rawContent || "").toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      const ta = Date.parse(a.createdAt);
      const tb = Date.parse(b.createdAt);
      const aTime = Number.isFinite(ta) ? ta : 0;
      const bTime = Number.isFinite(tb) ? tb : 0;
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return items;
  }, [inbox, query, sortOrder, typeFilter]);

  const ageLabel = (createdAt) => {
    const t = Date.parse(createdAt);
    if (!Number.isFinite(t)) return "";
    const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "hoy";
    if (days === 1) return "ayer";
    return `hace ${days} días`;
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "900px" }}>
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="card-title mb-0">
              <span style={{ fontSize: "1.8rem" }}>🧠</span> Cerebro Digital – Inbox
            </h2>
            <Link
              to="/brain/knowledge"
              className="btn btn-outline-primary btn-lg"
            >
              <span>📚</span> Ver Notas Clasificadas
              {notesCount > 0 && (
                <span className="badge bg-primary ms-2">{notesCount}</span>
              )}
            </Link>
          </div>
          <p className="text-muted mb-4">
            Captura aquí cualquier texto, enlace, idea rápida, código, etc. sin
            interrumpir lo que estás haciendo. La IA puede analizar y proponer sugerencias, y tú decides
            cuándo y cómo convertirlo en conocimiento.
          </p>

          <form onSubmit={handleAdd}>
            <div className="mb-3">
              <label htmlFor="content-input" className="form-label fw-semibold">
                Nuevo contenido
              </label>
              <textarea
                id="content-input"
                className="form-control form-control-lg"
                rows="5"
                placeholder="Pega un enlace (https://...), una idea, un fragmento de texto, código..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ fontSize: "1rem", resize: "vertical" }}
              />
              <small className="text-muted">
                💡 Tip: Puedes pegar URLs de páginas web o videos. Puedes cargar una vista previa para ver título y descripción.
              </small>
            </div>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <button type="submit" className="btn btn-primary btn-lg px-4">
                <span>✨</span> Añadir al inbox
              </button>
            </div>

            <div
              className={`file-drop-zone ${isDragging ? "dragging" : ""}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input-hidden").click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  document.getElementById("file-input-hidden").click();
                }
              }}
              tabIndex="0"
              role="button"
              aria-label="Subir archivos"
              style={{
                marginTop: "1.5rem",
                position: "relative",
                minHeight: "180px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: isDragging ? "2px solid #007bff" : "2px dashed #007bff",
                borderRadius: "12px",
                backgroundColor: isDragging ? "rgba(0, 123, 255, 0.08)" : "#fafafa",
                transition: "background-color 0.2s ease",
                cursor: "pointer",
                padding: "20px",
                outline: "none",
                overflow: "hidden"
              }}
            >
              {/* Overlay invisible que captura todos los eventos durante el drag para evitar parpadeos */}
              {isDragging && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    pointerEvents: "none"
                  }}
                />
              )}

              <div className="file-drop-zone-content" style={{ textAlign: "center", zIndex: 2, pointerEvents: "none" }}>
                <div className="file-drop-zone-icon" style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>
                  {isDragging ? "🎁" : "📁"}
                </div>
                <div className="file-drop-zone-text" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#007bff" }}>
                  {isDragging ? "¡Sueltalo aquí mismo!" : "Arrastra tus archivos aquí"}
                </div>
                <div className="file-drop-zone-subtext" style={{ color: "#555", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                  O haz clic para explorar tus documentos
                </div>
              </div>
              <input
                id="file-input-hidden"
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>
            <small className="text-muted d-block mt-2">
              Los archivos se analizarán automáticamente por la IA para extraer su conocimiento.
            </small>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="h5 mb-0 d-flex align-items-center">
              <span className="me-2">📥</span>
              Entradas pendientes de procesar
              {inbox.length > 0 && (
                <span className="badge bg-primary ms-2">{inbox.length}</span>
              )}
            </h3>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDiscardOlderThan(30)}
                disabled={inbox.length === 0}
              >
                Descartar &gt; 30d
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleClearAll}
                disabled={inbox.length === 0}
              >
                Vaciar inbox
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {inbox.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "4rem", opacity: 0.3 }}>📭</div>
              <p className="text-muted mt-3 mb-0">No hay entradas en el inbox todavía.</p>
              <p className="text-muted small mb-3">¡Añade tu primera entrada arriba!</p>
              {notesCount > 0 && (
                <Link to="/brain/knowledge" className="btn btn-primary">
                  <span>📚</span> Ver {notesCount} nota{notesCount !== 1 ? 's' : ''} clasificada{notesCount !== 1 ? 's' : ''}
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="p-3 border-bottom bg-body">
                <div className="row g-2 align-items-end">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Buscar</label>
                    <input
                      className="form-control"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar texto dentro del inbox..."
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small text-muted mb-1">Tipo</label>
                    <select
                      className="form-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="link">Link</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="tarea">Tarea</option>
                      <option value="codigo">Código</option>
                      <option value="nota">Nota</option>
                      <option value="texto">Texto</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small text-muted mb-1">Orden</label>
                    <select
                      className="form-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="newest">Más nuevas primero</option>
                      <option value="oldest">Más antiguas primero</option>
                    </select>
                  </div>
                </div>
                {(query.trim() || typeFilter !== "all") && (
                  <div className="small text-muted mt-2">
                    Mostrando {filteredInbox.length} de {inbox.length}.
                  </div>
                )}
              </div>

              <div className="list-group list-group-flush">
              {filteredInbox.map((item) => (
                <div
                  key={item.id}
                  className="list-group-item list-group-item-action"
                  style={{ borderLeft: `4px solid var(--bs-${getTypeBadgeColor(item.type)})` }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 me-3">
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: "1.2rem" }}>
                          {getTypeIcon(item.type)}
                        </span>
                        <span
                          className={`badge bg-${getTypeBadgeColor(item.type)} text-uppercase`}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {item.type}
                        </span>
                        <small className="text-muted ms-2">
                          {new Date(item.createdAt).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                        <span className="badge text-bg-light ms-2" title="Antigüedad">
                          {ageLabel(item.createdAt)}
                        </span>
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          maxWidth: "100%",
                          wordBreak: "break-word",
                          lineHeight: "1.5",
                          color: "#333",
                        }}
                      >
                        {item.rawContent.length > 200 ? (
                          <>
                            {item.rawContent.substring(0, 200)}...
                            <span className="text-muted small"> (mostrar más)</span>
                          </>
                        ) : (
                          item.rawContent
                        )}
                      </div>
                      {item.aiSuggestion && (
                        <div className="mt-2">
                          <span className="badge text-bg-success">Sugerencia lista</span>
                        </div>
                      )}

                      {(item.type === "link" || extractFirstUrl(item.rawContent)) && (
                        <div className="mt-3">
                          {item.linkPreview ? (
                            <div className="p-2 border rounded bg-light">
                              <div className="small fw-semibold">
                                {item.linkPreview.title || "Vista previa"}
                              </div>
                              {item.linkPreview.description && (
                                <div className="small text-muted mt-1">
                                  {item.linkPreview.description}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleLoadPreview(item.id)}
                                disabled={!!previewLoading[item.id]}
                              >
                                {previewLoading[item.id] ? "Cargando..." : "Cargar vista previa"}
                              </button>
                              {previewError[item.id] && (
                                <small className="text-danger">{previewError[item.id]}</small>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleProcess(item.id)}
                      >
                        <span>🤖</span> Procesar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDiscard(item.id)}
                      >
                        <span>🗑️</span> Descartar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainInbox;
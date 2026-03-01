import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import { createInboxEntry, loadInbox, saveInbox, loadNotes, loadLastProcessed, extractFirstUrl, extractYouTubeId } from "../digitalBrainStorage";
import { appFetch, fetchConfig } from "../../../backend/appFetch";
import "./FileDropZone.css";
import micIcon from "../../../assets/mic.svg";

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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState(null);
  const [micError, setMicError] = useState(null);
  const dragCounter = useRef(0);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

  // Cargamos as entradas xa gardadas no localStorage ao montar o componente
  useEffect(() => {
    setInbox(loadInbox());
  }, []);

  // Liberar micrófono al desmontar
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
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

  // Navega a la pantalla de procesado para esa entrada
  const handleProcess = (id) => {
    navigate(`/brain/process/${id}`);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredInbox.map((i) => i.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleProcessSelected = () => {
    if (selectedIds.size === 0) return;
    const ids = filteredInbox.filter((i) => selectedIds.has(i.id)).map((i) => i.id);
    if (ids.length === 0) return;
    navigate("/brain/process/batch", { state: { ids } });
  };

  const getYouTubeEmbedUrl = (id) => {
    return id ? `https://www.youtube.com/embed/${id}` : null;
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

  // Grabar nota de voz: permisos y MediaRecorder
  const requestMicPermission = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("Tu navegador no soporta grabación de audio.");
      setMicPermission("denied");
      return;
    }
    setMicError(null);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        setMicPermission("granted");
        setMicError(null);
        startVoiceRecording();
      })
      .catch((err) => {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMicError("Se ha denegado el acceso al micrófono. Actívalo en la configuración del navegador.");
          setMicPermission("denied");
        } else if (err.name === "NotFoundError") {
          setMicError("No se encontró ningún micrófono.");
          setMicPermission("denied");
        } else {
          setMicError(err.message || "No se pudo acceder al micrófono.");
          setMicPermission("denied");
        }
      });
  };

  const startVoiceRecording = () => {
    if (micPermission === "denied") return;
    if (!streamRef.current) {
      requestMicPermission();
      return;
    }
    setMicError(null);
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      if (chunksRef.current.length === 0) return;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const ext = recorder.mimeType.includes("webm") ? "webm" : "ogg";
      const file = new File([blob], `nota-voz-${Date.now()}.${ext}`, { type: blob.type });
      processFile(file);
    };
    recorder.start();
    setIsRecording(true);
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }
    if (micPermission === null) {
      requestMicPermission();
      return;
    }
    if (micPermission === "granted") {
      startVoiceRecording();
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

  const strikesCount = useMemo(() => {
    const last = loadLastProcessed();
    const diff = Date.now() - last;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return days > 0 ? days : 0;
  }, [inbox]); // Se recalcula cuando cambia el inbox (potencial procesado)

  const ageLabel = (createdAt) => {
    const t = Date.parse(createdAt);
    if (!Number.isFinite(t)) return "";
    const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "hoy";
    if (days === 1) return "ayer";
    return `hace ${days} días`;
  };

  return (
    <div className="synapse-brain-page--retro-stage">
      <div className="synapse-brain-page synapse-brain-page--retro">
        <div className="inbox-page inbox-page--retro synapse-animate-in">
        {/* Hero: título + enlace a Conocimiento */}
        <header className="inbox-hero">
          <div className="inbox-hero__title-wrap">
            <h1 className="inbox-hero__title">Inbox</h1>
            <p className="inbox-hero__subtitle">
              Captura texto, enlaces o ideas. La IA analiza y sugiere; tú decides cuándo convertirlo en conocimiento.
            </p>
          </div>
          <Link to="/brain/arcade" className="inbox-hero__action">
            <span aria-hidden>📚</span> Ver notas clasificadas
            {notesCount > 0 && (
              <span className="badge bg-primary rounded-pill">{notesCount}</span>
            )}
          </Link>
        </header>

        {/* Captura rápida */}
        <section className="inbox-capture synapse-animate-in synapse-animate-in-delay-1">
          <form onSubmit={handleAdd}>
            <label htmlFor="content-input" className="inbox-capture__label">
              Nuevo contenido
            </label>
            <textarea
              id="content-input"
              className="inbox-capture__textarea"
              rows={4}
              placeholder="Pega un enlace, una idea, un fragmento de texto o código..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <p className="inbox-capture__hint">
              💡 Puedes pegar URLs de páginas o vídeos y cargar una vista previa.
            </p>
            <div className="inbox-capture__actions">
              <button
                type="button"
                className={`inbox-capture__mic-btn ${isRecording ? "inbox-capture__mic-btn--recording" : ""}`}
                onClick={handleMicClick}
                disabled={micPermission === "denied"}
                title={isRecording ? "Detener grabación" : "Grabar nota de voz"}
                aria-label={isRecording ? "Detener grabación" : "Grabar nota de voz"}
              >
                <img src={micIcon} alt="" width="20" height="20" className="inbox-capture__mic-icon" />
                <span className="inbox-capture__mic-label">
                  {isRecording ? "Detener" : "Nota de voz"}
                </span>
              </button>
              <button type="submit" className="btn btn-primary synapse-brain-btn">
                <span aria-hidden>✨</span> Añadir al inbox
              </button>
            </div>
            {micError && (
              <p className="inbox-capture__mic-error small text-danger mb-0 mt-2">
                {micError}
              </p>
            )}
          </form>
        </section>

        {/* Zona de archivos */}
        <div
          className={`file-drop-zone ${isDragging ? "dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input-hidden").click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById("file-input-hidden").click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Subir archivos"
        >
          {isDragging && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
          )}
          <div className="file-drop-zone-content">
            <div className="file-drop-zone-icon" aria-hidden>
              {isDragging ? "🎁" : "📁"}
            </div>
            <div className="file-drop-zone-text">
              {isDragging ? "¡Suéltalo aquí!" : "Arrastra archivos aquí"}
            </div>
            <div className="file-drop-zone-subtext">
              O haz clic para explorar · La IA extraerá el conocimiento automáticamente
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

        {/* Lista de entradas pendientes */}
        <section className="inbox-list-section synapse-animate-in synapse-animate-in-delay-2">
          <div className="inbox-list-section__toolbar">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              <h2 className="h6 mb-0 fw-bold d-flex align-items-center gap-2">
                <span aria-hidden>📥</span>
                Pendientes de procesar
                {inbox.length > 0 && (
                  <span className="badge bg-primary rounded-pill">{inbox.length}</span>
                )}
              </h2>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                {filteredInbox.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={selectAllFiltered}
                    >
                      Seleccionar todo
                    </button>
                    {selectedIds.size > 0 && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={clearSelection}
                        >
                          Quitar selección
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={handleProcessSelected}
                        >
                          <span aria-hidden>🤖</span> Procesar {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                        </button>
                      </>
                    )}
                  </>
                )}
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
            <div className="inbox-list-section__filters row g-2">
              <div className="col-12 col-md-4">
                <label className="form-label small mb-1">Buscar</label>
                <input
                  className="form-control form-control-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en el inbox..."
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Tipo</label>
                <select
                  className="form-select form-select-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="tarea">Tarea</option>
                  <option value="codigo">Código</option>
                  <option value="nota">Otro</option>
                  <option value="texto">Texto</option>
                </select>
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Orden</label>
                <select
                  className="form-select form-select-sm"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Más nuevas primero</option>
                  <option value="oldest">Más antiguas primero</option>
                </select>
              </div>
            </div>
            {(query.trim() || typeFilter !== "all") && (
              <div className="small mt-2">
                Mostrando {filteredInbox.length} de {inbox.length}.
              </div>
            )}
          </div>

          {inbox.length === 0 ? (
            <div className="inbox-list-section__empty synapse-animate-in">
              <div className="inbox-list-section__empty-icon" aria-hidden>📭</div>
              <p className="mb-1">No hay entradas en el inbox.</p>
              <p className="small mb-3">Añade contenido arriba o arrastra archivos.</p>
              {notesCount > 0 && (
                <Link to="/brain/arcade" className="btn btn-primary btn-sm">
                  Ver {notesCount} nota{notesCount !== 1 ? "s" : ""} clasificada{notesCount !== 1 ? "s" : ""}
                </Link>
              )}
            </div>
          ) : (
            <div className="synapse-stagger-children">
              {filteredInbox.map((item) => (
                <div
                  key={item.id}
                  className={`inbox-item synapse-inbox-item ${selectedIds.has(item.id) ? "synapse-inbox-item--selected" : ""}`}
                  style={{ borderLeft: `4px solid var(--bs-${getTypeBadgeColor(item.type)})` }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-start gap-2 flex-grow-1 me-3">
                      <label className="synapse-inbox-item__checkbox-label mb-0 mt-1">
                        <input
                          type="checkbox"
                          className="form-check-input synapse-inbox-item__checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`Seleccionar entrada ${item.id}`}
                        />
                      </label>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
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
                          <small className="ms-2">
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
                          }}
                        >
                          {item.rawContent.length > 200 ? (
                            <>
                              {item.rawContent.substring(0, 200)}...
                              <span className="small"> (mostrar más)</span>
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
                                  <div className="small mt-1">
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
          )}
        </section>
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainInbox;
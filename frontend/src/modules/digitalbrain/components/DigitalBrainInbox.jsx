import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { createInboxEntry, loadInbox, saveInbox, loadNotes, saveNotes, createNoteFromEntry } from "../digitalBrainStorage";
import { appFetch, fetchConfig } from "../../../backend/appFetch";

// Collemos o input do usuario e gárdase como entrada pendente
const DigitalBrainInbox = () => {
  // Texto actual do textarea
  const [input, setInput] = useState("");
  // Lista de entradas pendentes almacenadas en localStorage
  const [inbox, setInbox] = useState([]);
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

  // Procesa automáticamente una entrada del inbox
  const processEntryAutomatically = (entry) => {
    // Llamar al backend para obtener sugerencias de IA
    appFetch(
      "/brain/suggest",
      fetchConfig("POST", { content: entry.rawContent }),
      (response) => {
        if (response) {
          // Crear nota procesada automáticamente
          const notes = loadNotes();
          const inbox = loadInbox();
          
          const note = createNoteFromEntry(entry, {
            title: response.title || entry.rawContent.substring(0, 50),
            destination: response.destination || "apunte",
            tags: response.tags || [],
            structuredContent: response.detailedContent || `# ${response.title || "Nota"}\n\n${response.summary || entry.rawContent}`,
          });

          // Guardar nota y eliminar del inbox
          const updatedNotes = [note, ...notes];
          const updatedInbox = inbox.filter((item) => item.id !== entry.id);
          
          saveNotes(updatedNotes);
          saveInbox(updatedInbox);
          setInbox(updatedInbox);
        }
      },
      (error) => {
        console.error("Error procesando entrada automáticamente:", error);
      }
    );
  };

  // Engade unha nova entrada ao inbox a partir do textarea y la procesa automáticamente
  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const entry = createInboxEntry(input.trim());   // Crea a nova entrada
    const updated = [entry, ...inbox]; // Engade a nova entrada al inicio de la lista
    setInbox(updated);
    saveInbox(updated);
    setInput("");

    // Procesar automáticamente en segundo plano
    processEntryAutomatically(entry);
  };

  // Elimina unha entrada concreta do inbox
  const handleDiscard = (id) => {
    const updated = inbox.filter((item) => item.id !== id);
    setInbox(updated);
    saveInbox(updated);
  };

  // Navega a la pantalla de procesado para esa entrada
  const handleProcess = (id) => {
    navigate(`/brain/process/${id}`);
  };

  // Sube un archivo (mp3/mp4) y lo procesa con IA generando directamente una nota
  const handleFileUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Crear la entrada en el inbox inmediatamente para que aparezca siempre en "pendientes de procesar"
    const notes = loadNotes();
    const inbox = loadInbox();

    const inboxEntry = {
      id: Date.now().toString(),
      rawContent: `Archivo subido: ${file.name}`,
      type: file.type && file.type.startsWith("video") ? "video" : "nota",
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
        const notes = loadNotes();
        const note = createNoteFromEntry(inboxEntry, {
          title: response.title || file.name,
          destination: response.destination || "apunte",
          tags: response.tags || [],
          structuredContent:
            response.detailedContent ||
            `# ${response.title || file.name}\n\n## Resumen\n\n${response.summary || "Contenido generado a partir de los metadatos del archivo."}`,
          mediaUrl: response.mediaUrl,
          mediaContentType: response.mediaContentType || file.type,
        });

        const updatedNotes = [note, ...notes];
        saveNotes(updatedNotes);

        // Si el procesado fue correcto, eliminamos la entrada del inbox (igual que con texto/URLs)
        const currentInbox = loadInbox();
        const cleanedInbox = currentInbox.filter((item) => item.id !== inboxEntry.id);
        saveInbox(cleanedInbox);
        setInbox(cleanedInbox);
      },
      (error) => {
        console.error("Error procesando archivo con IA:", error);
      }
    );

    // Permitir volver a seleccionar el mismo archivo si es necesario
    event.target.value = "";
  };

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

  const notesCount = loadNotes().length;

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
            interrumpir lo que estás haciendo. La IA analizará y clasificará automáticamente el contenido
            y lo guardará directamente en tu conocimiento.
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
                💡 Tip: Puedes pegar URLs de páginas web o videos. El sistema extraerá el contenido automáticamente.
              </small>
            </div>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <button type="submit" className="btn btn-primary btn-lg px-4">
                <span>✨</span> Añadir y procesar con IA
              </button>
              <div>
                <label className="btn btn-outline-secondary btn-lg mb-0">
                  <span>📎</span> Añadir mp3/mp4
                  <input
                    type="file"
                    accept="audio/mpeg,video/mp4"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
                <small className="d-block text-muted mt-1">
                  Los audios se analizarán por metadatos (artista, título, etc.) y los vídeos por el contexto del nombre del archivo.
                </small>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom">
          <h3 className="h5 mb-0 d-flex align-items-center">
            <span className="me-2">📥</span>
            Entradas pendientes de procesar
            {inbox.length > 0 && (
              <span className="badge bg-primary ms-2">{inbox.length}</span>
            )}
          </h3>
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
            <div className="list-group list-group-flush">
              {inbox.map((item) => (
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
                    </div>
                    <div className="d-flex flex-column gap-2">
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
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainInbox;
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  buildTrendsReport,
  deleteNoteById,
  exportNotesAsMarkdown,
  loadInbox,
  loadNotes,
  toggleNoteReadStatus,
} from "../digitalBrainStorage";
import MarkdownRenderer from "./MarkdownRenderer";
import "./DigitalBrainKnowledge.css";
import { appFetch, fetchConfig } from "../../../backend/appFetch";

// Pantalla para navegar el conocimiento ya procesado: aquí solo
// trabajamos con notas que ya han salido del inbox.
const DigitalBrainKnowledge = () => {
  const [notes, setNotes] = useState([]);
  const [inboxEntries, setInboxEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    setNotes(loadNotes());
    setInboxEntries(loadInbox());
  }, []);

  const handleRefreshLocalData = () => {
    setNotes(loadNotes());
    setInboxEntries(loadInbox());
  };

  const trendsReport = useMemo(() => {
    const items = [...(notes || []), ...(inboxEntries || [])];
    return buildTrendsReport(items, { windowDays: 14, maxTopics: 7 });
  }, [notes, inboxEntries]);

  const maxTrendCount = useMemo(() => {
    const totals = (trendsReport?.topics || []).map(
      (t) => (t.recentCount || 0) + (t.previousCount || 0)
    );
    return totals.length > 0 ? Math.max(...totals, 1) : 1;
  }, [trendsReport]);

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
      const hasAudio =
        note.media &&
        note.media.contentType &&
        note.media.contentType.startsWith("audio/");

      if (type === "link") {
        summary.web += 1;
      } else if (type === "video") {
        summary.videos += 1;
      } else if (type === "audio") {
        summary.musica += 1;
      } else if (hasAudio) {
        summary.musica += 1;
      } else {
        summary.otras += 1;
      }
    });

    return summary;
  }, [notes]);

  useEffect(() => {
    if (!selectedId) return;
    const currentNote = notes.find((n) => n.id === selectedId);
    if (!currentNote && notes.length > 0) {
      setSelectedId(notes[0].id);
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
    if (type === "audio") return "musica";
    if (isAudio) return "musica";
    return "otras";
  };

  const filteredNotes = useMemo(() => {
    if (!selectedCategory) return [];

    const filtered = notes.filter(
      (note) => categorizeNote(note) === selectedCategory
    );

    return filtered.sort((a, b) => {
      if (a.isRead && !b.isRead) return 1;
      if (!a.isRead && b.isRead) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [notes, selectedCategory]);

  const selectedNote = useMemo(() => {
    if (!selectedId && filteredNotes.length > 0) return filteredNotes[0];
    const found = filteredNotes.find((n) => n.id === selectedId);
    return found || (filteredNotes.length > 0 ? filteredNotes[0] : null);
  }, [filteredNotes, selectedId]);

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

    const deleteNoteLocally = () => {
      const updatedNotes = deleteNoteById(selectedNote.id);
      setNotes(updatedNotes);
      if (updatedNotes.length > 0) {
        setSelectedId(updatedNotes[0].id);
      } else {
        setSelectedId(null);
      }
    };

    const deleteStorageNote = (onDone) => {
      if (!selectedNote.storageId) {
        onDone();
        return;
      }

      appFetch(
        `/brain/notes/${encodeURIComponent(selectedNote.storageId)}`,
        fetchConfig("DELETE"),
        () => onDone(),
        () => onDone()
      );
    };

    const deleteMediaIfAny = (onDone) => {
      const mediaUrl =
        selectedNote.media && selectedNote.media.url ? selectedNote.media.url : "";
      const marker = "/api/brain/media/";
      const markerIndex = mediaUrl.indexOf(marker);

      // Solo podemos borrar ficheros que fueron subidos/guardados por nuestro backend.
      if (markerIndex === -1) {
        onDone();
        return;
      }

      const filename = mediaUrl
        .substring(markerIndex + marker.length)
        .split("?")[0];
      if (!filename) {
        onDone();
        return;
      }

      appFetch(
        `/brain/media/${encodeURIComponent(filename)}`,
        fetchConfig("DELETE"),
        () => onDone(),
        () => onDone()
      );
    };

    // Best-effort: borramos fichero Markdown y media (si existe) y luego limpiamos localStorage.
    deleteStorageNote(() => {
      deleteMediaIfAny(() => {
        deleteNoteLocally();
      });
    });
  };

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

  const handleToggleRead = (noteId, e) => {
    e?.stopPropagation?.();
    const updatedNotes = toggleNoteReadStatus(noteId);
    setNotes(updatedNotes);
  };

  return (
    <div className="container synapse-brain-page">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3 dbk-topbar synapse-animate-in">
        <div>
          <h2 className="synapse-brain-title mb-1">Conocimiento procesado</h2>
          <p className="synapse-brain-subtitle text-muted mb-0">
            Explora tus notas por categoría y revisa el contenido procesado.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleExport}
            disabled={notes.length === 0}
          >
            Exportar a Markdown
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleRefreshLocalData}
            title="Recarga inbox y notas desde localStorage"
          >
            Actualizar
          </button>
          <Link to="/brain/inbox" className="btn btn-sm btn-primary synapse-brain-btn">
            Ir al inbox
          </Link>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="text-muted small fw-semibold">RADAR DE TENDENCIAS PERSONAL</div>
              <div className="text-muted small">
                Basado en {trendsReport.totalItemsAnalyzed} items.
              </div>
            </div>
          </div>

          {trendsReport.totalItemsAnalyzed === 0 ? (
            <div className="text-muted small mt-2">
              Aún no hay suficiente historial reciente para detectar tendencias.
            </div>
          ) : (
            <div className="mt-2">
              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div className="small fw-semibold mb-1">📈 Tendencias</div>
                  {trendsReport.topics.length === 0 ? (
                    <div className="text-muted small">No se detectaron temas claros.</div>
                  ) : (
                    <div>
                      <div className="d-flex gap-3 flex-wrap text-muted small mb-2">
                        <span>
                          <span className="badge text-bg-primary me-1"> </span>
                          Reciente
                        </span>
                        <span>
                          <span className="badge text-bg-secondary me-1"> </span>
                          Anterior
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {trendsReport.topics.map((t) => {
                          const total = (t.recentCount || 0) + (t.previousCount || 0);
                          const scale = maxTrendCount || 1;
                          const recentPct = Math.round(((t.recentCount || 0) / scale) * 100);
                          const prevPct = Math.round(((t.previousCount || 0) / scale) * 100);

                          return (
                            <div key={t.topic} className="pb-2 border-bottom">
                              <div className="d-flex justify-content-between align-items-baseline gap-2">
                                <div className="text-truncate">
                                  <span className="fw-semibold">{t.topic}</span>{" "}
                                  <span className="text-muted">({total})</span>
                                </div>
                                <div className="fw-semibold" aria-label={t.trend}>
                                  {t.arrow}
                                </div>
                              </div>

                              <div className="mt-1">
                                <div className="progress" style={{ height: 8 }} aria-label="Reciente">
                                  <div
                                    className="progress-bar bg-primary"
                                    role="progressbar"
                                    style={{ width: `${Math.min(100, Math.max(0, recentPct))}%` }}
                                    aria-valuenow={t.recentCount || 0}
                                    aria-valuemin={0}
                                    aria-valuemax={scale}
                                  />
                                </div>
                                <div className="progress mt-1" style={{ height: 8 }} aria-label="Anterior">
                                  <div
                                    className="progress-bar bg-secondary"
                                    role="progressbar"
                                    style={{ width: `${Math.min(100, Math.max(0, prevPct))}%` }}
                                    aria-valuenow={t.previousCount || 0}
                                    aria-valuemin={0}
                                    aria-valuemax={scale}
                                  />
                                </div>
                                <div className="text-muted small mt-1">{t.explanation}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-12 col-lg-6">
                  <div className="small fw-semibold mb-1">💡 Insights</div>
                  {trendsReport.insights.length === 0 ? (
                    <div className="text-muted small">—</div>
                  ) : (
                    <ul className="mb-2">
                      {trendsReport.insights.map((i, idx) => (
                        <li key={idx} className="small">{i}</li>
                      ))}
                    </ul>
                  )}

                  <div className="small fw-semibold mb-1">🎯 Recomendaciones</div>
                  {trendsReport.recommendations.length === 0 ? (
                    <div className="text-muted small">—</div>
                  ) : (
                    <ul className="mb-0">
                      {trendsReport.recommendations.map((r, idx) => (
                        <li key={idx} className="small">{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="alert alert-info mb-0">
          Aún no has procesado ninguna entrada. Empieza en el{" "}
          <Link to="/brain/inbox">inbox</Link>.
        </div>
      ) : (
        <div className="row">
          <div className="col-12 mb-3 dbk-categoryGrid">
            <div className="row g-3 synapse-stagger-children">
              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`dbk-categoryCard card w-100 ${
                    selectedCategory === "web" ? "dbk-categoryCard--active" : ""
                  }`}
                  aria-pressed={selectedCategory === "web"}
                  onClick={() =>
                    setSelectedCategory((prev) => (prev === "web" ? null : "web"))
                  }
                >
                  <div className="card-body py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted small fw-semibold dbk-categoryLabel">
                          WEB
                        </div>
                        <div className="h2 mb-0">{categorySummary.web}</div>
                      </div>
                      <div className="fs-3" aria-hidden>
                        🌐
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`dbk-categoryCard card w-100 ${
                    selectedCategory === "videos" ? "dbk-categoryCard--active" : ""
                  }`}
                  aria-pressed={selectedCategory === "videos"}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === "videos" ? null : "videos"
                    )
                  }
                >
                  <div className="card-body py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted small fw-semibold dbk-categoryLabel">
                          VÍDEOS
                        </div>
                        <div className="h2 mb-0">{categorySummary.videos}</div>
                      </div>
                      <div className="fs-3" aria-hidden>
                        🎬
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`dbk-categoryCard card w-100 ${
                    selectedCategory === "musica"
                      ? "dbk-categoryCard--active"
                      : ""
                  }`}
                  aria-pressed={selectedCategory === "musica"}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === "musica" ? null : "musica"
                    )
                  }
                >
                  <div className="card-body py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted small fw-semibold dbk-categoryLabel">
                          MÚSICA
                        </div>
                        <div className="h2 mb-0">{categorySummary.musica}</div>
                      </div>
                      <div className="fs-3" aria-hidden>
                        🎵
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="col-6 col-md-3">
                <button
                  type="button"
                  className={`dbk-categoryCard card w-100 ${
                    selectedCategory === "otras" ? "dbk-categoryCard--active" : ""
                  }`}
                  aria-pressed={selectedCategory === "otras"}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === "otras" ? null : "otras"
                    )
                  }
                >
                  <div className="card-body py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted small fw-semibold dbk-categoryLabel">
                          OTRAS
                        </div>
                        <div className="h2 mb-0">{categorySummary.otras}</div>
                      </div>
                      <div className="fs-3" aria-hidden>
                        📦
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {!selectedCategory && (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-muted">
                  Selecciona una categoría para ver la lista y el detalle de tus
                  notas.
                </div>
              </div>
            </div>
          )}

          {selectedCategory && (
            <div className="col-12 col-lg-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-body d-flex justify-content-between align-items-center">
                  <div className="fw-semibold text-uppercase">
                    {selectedCategory === "web"
                      ? "Web"
                      : selectedCategory === "videos"
                      ? "Vídeos"
                      : selectedCategory === "musica"
                      ? "Música"
                      : "Otras"}
                  </div>
                  <span className="badge text-bg-secondary">
                    {filteredNotes.length}
                  </span>
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="card-body text-muted">
                    No hay notas en esta categoría.
                  </div>
                ) : (
                  <ul className="list-group list-group-flush dbk-notesList">
                    {filteredNotes.map((note) => {
                      const isActive = selectedNote && selectedNote.id === note.id;
                      const isUnread = !note.isRead;

                      return (
                        <li
                          key={note.id}
                          className={`list-group-item list-group-item-action dbk-noteItem ${
                            isActive ? "active" : ""
                          } ${note.isRead ? "dbk-noteItem--read" : ""} ${
                            isUnread ? "dbk-noteItem--unread" : ""
                          }`}
                          onClick={() => setSelectedId(note.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <div
                                className={`dbk-noteTitle fw-semibold text-truncate ${
                                  note.isRead ? "text-muted" : ""
                                }`}
                              >
                                {note.title || "Nota sin título"}
                              </div>
                              <div
                                className={`small ${
                                  isActive ? "text-white-50" : "text-muted"
                                }`}
                              >
                                {note.destination} • {note.type}
                              </div>
                            </div>
                            <div
                              className={`small text-nowrap ${
                                isActive ? "text-white-50" : "text-muted"
                              }`}
                            >
                              {new Date(note.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {selectedCategory && (
            <div className="col-12 col-lg-8">
              {selectedNote ? (
                <>
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div style={{ minWidth: 0 }}>
                          <h3
                            className={`h5 mb-1 dbk-detailTitle ${
                              selectedNote.isRead ? "text-muted" : ""
                            }`}
                            style={{
                              textDecoration: selectedNote.isRead
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {selectedNote.title || "Nota sin título"}
                          </h3>
                          <div className="small text-muted">
                            {new Date(selectedNote.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedNote.isRead || false}
                              onChange={(e) => handleToggleRead(selectedNote.id, e)}
                              id={`read-switch-${selectedNote.id}`}
                              style={{ cursor: "pointer" }}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`read-switch-${selectedNote.id}`}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              {selectedNote.isRead ? "Leída" : "No leída"}
                            </label>
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={handleDeleteSelected}
                          >
                            Borrar este conocimiento
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedNote.media && selectedNote.media.url && (
                    <div className="mb-3">
                      {selectedNote.media.contentType &&
                      selectedNote.media.contentType.startsWith("audio/") ? (
                        <audio
                          controls
                          className="w-100"
                          src={selectedNote.media.url}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      ) : selectedNote.media.contentType &&
                        selectedNote.media.contentType.startsWith("video/") ? (
                        <video
                          controls
                          className="w-100"
                          style={{ maxHeight: "400px" }}
                          src={selectedNote.media.url}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : null}
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`badge bg-${
                          selectedNote.destination === "apunte"
                            ? "primary"
                            : selectedNote.destination === "idea"
                            ? "info"
                            : selectedNote.destination === "recurso"
                            ? "success"
                            : "warning"
                        }`}
                      >
                        {selectedNote.destination}
                      </span>
                      <span className="badge text-bg-secondary">
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
              
                    className={`bg-white card border-0 shadow-sm p-4 dbk-contentCard ${
                      selectedNote.isRead ? "dbk-contentCard--read" : ""
                    }`}
                  >
                    <div
                      style={{
                        textDecoration: selectedNote.isRead
                          ? "line-through"
                          : "none",
                      }}
                    >
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

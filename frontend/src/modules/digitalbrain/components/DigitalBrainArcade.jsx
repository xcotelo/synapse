import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotifications } from "../../common/components/NotificationContext";
import { useUser } from "../../common/components/UserContext";
import {
  buildTrendsReport,
  deleteNoteById,
  downloadNoteAsFile,
  downloadNoteDocument,
  extractFirstUrl,
  extractYouTubeId,
  loadInbox,
  loadNotes,
  toggleNoteReadStatus,
} from "../digitalBrainStorage";
import { appFetch, fetchConfig } from "../../../backend/appFetch";
import MarkdownRenderer from "./MarkdownRenderer";
import "./DigitalBrainArcade.css";

const categorizeNote = (note) => {
  const type = note.type || "";
  const isAudio =
    note.media &&
    note.media.contentType &&
    note.media.contentType.startsWith("audio/");
  if (type === "link") return "web";
  if (type === "video") return "videos";
  if (type === "audio") return "audio";
  if (isAudio) return "audio";
  return "otras";
};

const MENU_OPTIONS = [
  { id: "videos", label: "VIDEO" },
  { id: "audio", label: "AUDIO" },
  { id: "web", label: "WEB" },
  { id: "otras", label: "OTROS" },
];

const getYoutubeIdFromNote = (note) => {
  if (!note) return null;
  return extractYouTubeId(note.content) || extractYouTubeId(note.title);
};

const isNoteAudio = (note) =>
  note &&
  (note.type === "audio" ||
    (note.media &&
      note.media.contentType &&
      String(note.media.contentType).startsWith("audio/")));
const isNoteVideo = (note) =>
  note &&
  (note.type === "video" ||
    (note.media &&
      note.media.contentType &&
      String(note.media.contentType).startsWith("video/")));

const DigitalBrainArcade = () => {
  const [notes, setNotes] = useState([]);
  const [viewMode, setViewMode] = useState("menu");
  const [category, setCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedNote, setSelectedNote] = useState(null);
  const [buttonAPressed, setButtonAPressed] = useState(false);
  const [buttonBPressed, setButtonBPressed] = useState(false);
  const [arrowUpPressed, setArrowUpPressed] = useState(false);
  const [arrowDownPressed, setArrowDownPressed] = useState(false);
  const [radarVisible, setRadarVisible] = useState(false);
  const [radarExiting, setRadarExiting] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const keyRepeatRef = useRef(null);
  const detailContentRef = useRef(null);
  const selectedItemRef = useRef(null);
  const cabinetRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logOut } = useUser();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotificationsForNote,
    requestNotificationPermission,
  } = useNotifications();

  const handleLogout = useCallback(() => {
    logOut();
    navigate("/");
  }, [logOut, navigate]);

  const SCROLL_STEP = 56;

  const [inboxEntries, setInboxEntries] = useState([]);

  /* Entrada: delay mínimo para que la transición de aparición se vea (0.45s) */
  useEffect(() => {
    if (viewMode !== "menu") {
      setRadarVisible(false);
      return;
    }
    const t = setTimeout(() => setRadarVisible(true), 60);
    return () => clearTimeout(t);
  }, [viewMode]);

  /* Salida: desmontar el radar solo cuando la animación de salida haya terminado (0.45s) */
  useEffect(() => {
    if (viewMode === "menu") {
      setRadarExiting(false);
      return;
    }
    if (!radarExiting) return;
    const t = setTimeout(() => setRadarExiting(false), 520);
    return () => clearTimeout(t);
  }, [viewMode, radarExiting]);

  useEffect(() => {
    setNotes(loadNotes());
    setInboxEntries(loadInbox());
  }, []);

  /* Si llegamos con ?noteId=... (p. ej. desde notificación del header), abrir esa nota en detalle en la arcade */
  useEffect(() => {
    const noteId = searchParams.get("noteId");
    if (!noteId || notes.length === 0) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const noteCategory = categorizeNote(note);
    const notesInCategory = notes.filter((n) => categorizeNote(n) === noteCategory);
    const idx = notesInCategory.findIndex((n) => n.id === note.id);
    setRadarExiting(true);
    setCategory(noteCategory);
    setSelectedIndex(idx >= 0 ? idx : 0);
    setSelectedNote(note);
    setViewMode("detail");
    setSearchParams({}, { replace: true });
  }, [notes, searchParams, setSearchParams]);

  /* Centrar la vista en la máquina al cargar la página */
  useEffect(() => {
    if (!cabinetRef.current) return;
    cabinetRef.current.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  }, []);

  /* Al entrar en detalle tipo link: abrir en navegador. Al salir de detalle: cerrar modal. */
  useEffect(() => {
    if (viewMode !== "detail" || !selectedNote) {
      setMediaModalOpen(false);
      return;
    }
    if (selectedNote.type === "link") {
      const url = extractFirstUrl(selectedNote.content || selectedNote.rawContent || "");
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [viewMode, selectedNote]);

  const trendsReport = useMemo(() => {
    const items = [...(notes || []), ...(inboxEntries || [])];
    return buildTrendsReport(items, { windowDays: 14, maxTopics: 7 });
  }, [notes, inboxEntries]);

  const radarModel = useMemo(() => {
    const topics = (trendsReport?.topics || []).slice(0, 7).map((t) => ({
      ...t,
      displayTopic: t.topic,
    }));
    const n = topics.length;
    if (n < 3) return { enabled: false, topics: [] };

    const scale = Math.max(
      1,
      ...topics.map((t) => Math.max(t.recentCount || 0, t.previousCount || 0))
    );
    const w = 300;
    const h = 300;
    const cx = w / 2;
    const cy = h / 2;
    const r = 100;
    const labelR = r + 22;
    const angleFor = (idx) => -Math.PI / 2 + (idx * 2 * Math.PI) / n;
    const pointAt = (idx, value01) => {
      const a = angleFor(idx);
      const rr = r * Math.max(0, Math.min(1, value01));
      return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
    };
    const labelAt = (idx) => {
      const a = angleFor(idx);
      return {
        x: cx + Math.cos(a) * labelR,
        y: cy + Math.sin(a) * labelR,
        anchor: Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end",
      };
    };
    const toPointsString = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const ringPoints = (k, rings = 4) => {
      const v = k / rings;
      const pts = topics.map((_, idx) => pointAt(idx, v));
      return toPointsString(pts);
    };
    const recentPts = topics.map((t, idx) => pointAt(idx, (t.recentCount || 0) / scale));
    const prevPts = topics.map((t, idx) => pointAt(idx, (t.previousCount || 0) / scale));
    const labels = topics.map((t, idx) => {
      const pos = labelAt(idx);
      const text = (t.displayTopic || t.topic || "").toString();
      const clipped = text.length > 18 ? `${text.slice(0, 18)}…` : text;
      return { ...pos, topic: t.topic, text: clipped };
    });
    const axes = topics.map((_, idx) => {
      const a = angleFor(idx);
      return { x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r };
    });
    return {
      enabled: true,
      w,
      h,
      cx,
      cy,
      rings: 4,
      ringPoints,
      axes,
      labels,
      recentPolygon: toPointsString(recentPts),
      previousPolygon: toPointsString(prevPts),
    };
  }, [trendsReport]);

  /* Mantener el elemento seleccionado visible: hacer scroll en la pantalla cuando cambia la selección */
  useEffect(() => {
    if (viewMode !== "menu" && viewMode !== "list" && viewMode !== "notifications") return;
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, viewMode]);

  const filteredNotes = useMemo(() => {
    if (!category) return [];
    return notes.filter((n) => categorizeNote(n) === category);
  }, [notes, category]);

  const maxIndex =
    viewMode === "menu"
      ? MENU_OPTIONS.length - 1
      : viewMode === "notifications"
        ? Math.max(0, notifications.length - 1)
        : Math.max(0, filteredNotes.length - 1);

  const moveSelection = useCallback(
    (direction) => {
      setSelectedIndex((prev) => {
        const next = direction === "up" ? prev - 1 : prev + 1;
        return Math.max(0, Math.min(maxIndex, next));
      });
    },
    [maxIndex]
  );

  const handleAccept = useCallback(() => {
    if (viewMode === "menu") {
      const opt = MENU_OPTIONS[selectedIndex];
      setRadarExiting(true);
      setCategory(opt.id);
      setSelectedIndex(0);
      setViewMode("list");
    } else if (viewMode === "list" && filteredNotes[selectedIndex]) {
      setSelectedNote(filteredNotes[selectedIndex]);
      setViewMode("detail");
    } else if (viewMode === "notifications" && notifications[selectedIndex]) {
      const notif = notifications[selectedIndex];
      markAsRead(notif.id);
      const note = notes.find((n) => n.id === notif.noteId);
      if (note) {
        const noteCategory = categorizeNote(note);
        const notesInCategory = notes.filter((n) => categorizeNote(n) === noteCategory);
        const idx = notesInCategory.findIndex((n) => n.id === note.id);
        setRadarExiting(true);
        setCategory(noteCategory);
        setSelectedIndex(idx >= 0 ? idx : 0);
        setSelectedNote(note);
        setViewMode("detail");
      } else {
        setViewMode("menu");
        setSelectedIndex(0);
      }
    } else if (viewMode === "detail" && selectedNote) {
      if (
        isNoteAudio(selectedNote) ||
        isNoteVideo(selectedNote) ||
        getYoutubeIdFromNote(selectedNote)
      ) {
        setMediaModalOpen(true);
      } else if (selectedNote.type !== "link" && selectedNote.media?.url) {
        downloadNoteDocument(selectedNote);
      }
    }
  }, [viewMode, selectedIndex, filteredNotes, selectedNote, notifications, notes, markAsRead]);

  const handleBack = useCallback(() => {
    if (viewMode === "list") {
      setViewMode("menu");
      setCategory(null);
      setSelectedIndex(0);
    } else if (viewMode === "detail") {
      setViewMode("list");
      setSelectedNote(null);
    } else if (viewMode === "notifications") {
      setViewMode("menu");
      setSelectedIndex(0);
    }
  }, [viewMode]);

  const handleToggleRead = useCallback(() => {
    const noteToToggle = viewMode === "detail" ? selectedNote : (filteredNotes[selectedIndex] ?? null);
    if (!noteToToggle) return;
    const updated = toggleNoteReadStatus(noteToToggle.id);
    setNotes(updated);
    if (viewMode === "detail") {
      const next = updated.find((n) => n.id === noteToToggle.id);
      if (next) setSelectedNote(next);
    }
  }, [viewMode, selectedNote, filteredNotes, selectedIndex]);

  const handleDelete = useCallback(() => {
    const noteToDelete = viewMode === "detail" ? selectedNote : (filteredNotes[selectedIndex] ?? null);
    if (!noteToDelete) return;

    const deleteNoteLocally = () => {
      const updated = deleteNoteById(noteToDelete.id);
      removeNotificationsForNote(noteToDelete.id);
      setNotes(updated);
      if (viewMode === "detail") {
        setViewMode("list");
        setSelectedNote(null);
        const stillInCategory = updated.filter((n) => categorizeNote(n) === category);
        setSelectedIndex(Math.min(selectedIndex, Math.max(0, stillInCategory.length - 1)));
      } else {
        const stillInCategory = updated.filter((n) => categorizeNote(n) === category);
        if (stillInCategory.length === 0) {
          setViewMode("menu");
          setCategory(null);
          setSelectedIndex(0);
        } else {
          setSelectedIndex(Math.min(selectedIndex, Math.max(0, stillInCategory.length - 1)));
        }
      }
    };

    const deleteStorageNote = (onDone) => {
      if (!noteToDelete.storageId) {
        onDone();
        return;
      }
      appFetch(
        `/brain/notes/${encodeURIComponent(noteToDelete.storageId)}`,
        fetchConfig("DELETE"),
        () => onDone(),
        () => onDone()
      );
    };

    const deleteMediaIfAny = (onDone) => {
      const mediaUrl = noteToDelete.media?.url ?? "";
      const marker = "/api/brain/media/";
      const markerIndex = mediaUrl.indexOf(marker);
      if (markerIndex === -1) {
        onDone();
        return;
      }
      const filename = mediaUrl.substring(markerIndex + marker.length).split("?")[0];
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

    deleteStorageNote(() => {
      deleteMediaIfAny(() => {
        deleteNoteLocally();
      });
    });
  }, [viewMode, selectedNote, filteredNotes, selectedIndex, category, removeNotificationsForNote]);

  const scrollDetailContent = useCallback((direction) => {
    const el = detailContentRef.current;
    if (!el) return;
    const amount = direction === "up" ? -SCROLL_STEP : SCROLL_STEP;
    el.scrollBy({ top: amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "w") {
        e.preventDefault();
        setArrowUpPressed(true);
        if (viewMode === "detail") {
          scrollDetailContent("up");
          if (keyRepeatRef.current) clearTimeout(keyRepeatRef.current);
          keyRepeatRef.current = setTimeout(() => {
            const repeat = () => {
              scrollDetailContent("up");
              keyRepeatRef.current = setTimeout(repeat, 120);
            };
            keyRepeatRef.current = setTimeout(repeat, 400);
          }, 400);
        } else {
          moveSelection("up");
          if (keyRepeatRef.current) clearTimeout(keyRepeatRef.current);
          keyRepeatRef.current = setTimeout(() => {
            const repeat = () => {
              moveSelection("up");
              keyRepeatRef.current = setTimeout(repeat, 120);
            };
            keyRepeatRef.current = setTimeout(repeat, 400);
          }, 400);
        }
      } else if (key === "s") {
        e.preventDefault();
        setArrowDownPressed(true);
        if (viewMode === "detail") {
          scrollDetailContent("down");
          if (keyRepeatRef.current) clearTimeout(keyRepeatRef.current);
          keyRepeatRef.current = setTimeout(() => {
            const repeat = () => {
              scrollDetailContent("down");
              keyRepeatRef.current = setTimeout(repeat, 120);
            };
            keyRepeatRef.current = setTimeout(repeat, 400);
          }, 400);
        } else {
          moveSelection("down");
          if (keyRepeatRef.current) clearTimeout(keyRepeatRef.current);
          keyRepeatRef.current = setTimeout(() => {
            const repeat = () => {
              moveSelection("down");
              keyRepeatRef.current = setTimeout(repeat, 120);
            };
            keyRepeatRef.current = setTimeout(repeat, 400);
          }, 400);
        }
      } else if (key === "a") {
        e.preventDefault();
        setButtonAPressed(true);
        handleAccept();
      } else if (key === "b") {
        e.preventDefault();
        setButtonBPressed(true);
        if (mediaModalOpen) {
          setMediaModalOpen(false);
        } else {
          handleBack();
        }
      } else if (key === "d") {
        e.preventDefault();
        if (viewMode === "notifications") {
          clearAll();
          setViewMode("menu");
          setSelectedIndex(0);
        } else if (viewMode === "detail" && selectedNote) {
          downloadNoteAsFile(selectedNote);
        }
      } else if (key === "l") {
        e.preventDefault();
        if (viewMode === "notifications") {
          markAllAsRead();
        } else if ((viewMode === "list" && filteredNotes[selectedIndex]) || (viewMode === "detail" && selectedNote)) {
          handleToggleRead();
        }
      } else if (key === "n") {
        e.preventDefault();
        if (viewMode === "notifications") {
          handleBack();
        } else {
          requestNotificationPermission();
          setSelectedIndex(0);
          setViewMode("notifications");
        }
      } else if (key === "o") {
        e.preventDefault();
        handleLogout();
      } else if (key === "x") {
        e.preventDefault();
        if ((viewMode === "list" && filteredNotes[selectedIndex]) || (viewMode === "detail" && selectedNote)) {
          handleDelete();
        } else {
          handleLogout();
        }
      }
    };

    const onKeyUp = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "w") {
        setArrowUpPressed(false);
        if (keyRepeatRef.current) {
          clearTimeout(keyRepeatRef.current);
          keyRepeatRef.current = null;
        }
      } else if (key === "s") {
        setArrowDownPressed(false);
        if (keyRepeatRef.current) {
          clearTimeout(keyRepeatRef.current);
          keyRepeatRef.current = null;
        }
      } else if (key === "a") setButtonAPressed(false);
      else if (key === "b") setButtonBPressed(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (keyRepeatRef.current) clearTimeout(keyRepeatRef.current);
    };
  }, [viewMode, moveSelection, handleAccept, handleBack, scrollDetailContent, mediaModalOpen, clearAll, markAllAsRead, handleLogout]);

  const handleJoystickMouseDown = (direction) => {
    if (direction === "up") {
      setArrowUpPressed(true);
      setTimeout(() => setArrowUpPressed(false), 150);
    } else {
      setArrowDownPressed(true);
      setTimeout(() => setArrowDownPressed(false), 150);
    }
    if (viewMode === "detail") {
      scrollDetailContent(direction);
    } else {
      moveSelection(direction);
    }
  };

  return (
    <div className="arcade-page">
      <div className="arcade-page__main">
        <div className="arcade-page__main-left">
          {(viewMode === "menu" || radarExiting) && (
            <div
              className={`arcade-radar-panel ${
                viewMode === "menu" && radarVisible && !radarExiting
                  ? "arcade-radar-panel--visible"
                  : radarExiting
                    ? "arcade-radar-panel--leaving"
                    : ""
              }`}
            >
              <div className="arcade-radar-panel__title">RADAR</div>
              {radarModel.enabled ? (
                <div className="arcade-radar-panel__chart">
                  <svg
                    className="arcade-radar-panel__svg"
                    viewBox={`0 0 ${radarModel.w} ${radarModel.h}`}
                    role="img"
                    aria-label="Gráfica radar de tendencias (estilo arcade)"
                  >
                    {[1, 2, 3, 4].map((k) => (
                      <polygon
                        key={k}
                        points={radarModel.ringPoints(k, radarModel.rings)}
                        fill="none"
                        className="arcade-radar-panel__ring"
                      />
                    ))}
                    {radarModel.axes.map((a, idx) => (
                      <line
                        key={idx}
                        x1={radarModel.cx}
                        y1={radarModel.cy}
                        x2={a.x2}
                        y2={a.y2}
                        className="arcade-radar-panel__axis"
                      />
                    ))}
                    <polygon
                      points={radarModel.previousPolygon}
                      className="arcade-radar-panel__polygon arcade-radar-panel__polygon--previous"
                    />
                    <polygon
                      points={radarModel.recentPolygon}
                      className="arcade-radar-panel__polygon arcade-radar-panel__polygon--recent"
                    />
                    {radarModel.labels.map((l) => (
                      <text
                        key={l.topic}
                        x={l.x}
                        y={l.y}
                        textAnchor={l.anchor}
                        dominantBaseline="middle"
                        className="arcade-radar-panel__label"
                      >
                        {l.text}
                      </text>
                    ))}
                  </svg>
                </div>
              ) : (
                <p className="arcade-radar-panel__empty">3+ temas para radar</p>
              )}
            </div>
          )}
        </div>

        <div className="arcade-cabinet" ref={cabinetRef}>
        <div className="arcade-cabinet__marquee">
          <span className="arcade-cabinet__marquee-text">SYNAPSE</span>
          <span className="arcade-cabinet__marquee-sub">KNOWLEDGE</span>
          <span className="arcade-cabinet__marquee-stars">★ ★ ★ ★ ★</span>
        </div>

        <div className="arcade-cabinet__screen-frame">
          <div className="arcade-screen-frame__actions">
            <div className="arcade-notif-wrap" aria-label="Notificaciones">
              <button
                type="button"
                className="arcade-notif-trigger"
                onClick={() => {
                  requestNotificationPermission();
                  setSelectedIndex(0);
                  setViewMode("notifications");
                }}
                aria-expanded={viewMode === "notifications"}
                title="Notificaciones [N] Abre la pantalla de notificaciones"
              >
                <span className="arcade-notif-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                </span>
                {unreadCount > 0 && (
                  <span className="arcade-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
            </div>
            <div className="arcade-logout-wrap" aria-label="Cerrar sesión">
              <button
                type="button"
                className="arcade-logout-trigger"
                onClick={handleLogout}
                title="Cerrar sesión [O] o [X] en menú"
              >
                <span className="arcade-logout-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
          <div className="arcade-cabinet__screen">
            {viewMode === "menu" && (
              <div className="arcade-screen arcade-screen--menu">
                <div className="arcade-screen__title">SELECCIONA TIPO</div>
                <ul className="arcade-screen__list">
                  {MENU_OPTIONS.map((opt, i) => (
                    <li
                      key={opt.id}
                      ref={i === selectedIndex ? selectedItemRef : null}
                      className={`arcade-screen__item ${i === selectedIndex ? "arcade-screen__item--selected" : ""}`}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
                <div className="arcade-screen__hint">[A] Aceptar · [B] Atrás · [O] Cerrar sesión</div>
              </div>
            )}

            {viewMode === "list" && (
              <div className="arcade-screen arcade-screen--list">
                <div className="arcade-screen__title">
                  {MENU_OPTIONS.find((o) => o.id === category)?.label ?? category}
                </div>
                {filteredNotes.length === 0 ? (
                  <p className="arcade-screen__empty">No hay notas en esta categoría.</p>
                ) : (
                  <ul className="arcade-screen__list">
                    {filteredNotes.map((note, i) => (
                      <li
                        key={note.id}
                        ref={i === selectedIndex ? selectedItemRef : null}
                        className={`arcade-screen__item ${i === selectedIndex ? "arcade-screen__item--selected" : ""} ${note.isRead ? "arcade-screen__item--read" : ""}`}
                      >
                        {(note.title || "Sin título").slice(0, 40)}
                        {(note.title || "").length > 40 ? "…" : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="arcade-screen__hint">[A] Ver · [L] Leído · [X] Eliminar · [B] Atrás · [O] Cerrar sesión</div>
              </div>
            )}

            {viewMode === "detail" && selectedNote && (
              <div className={`arcade-screen arcade-screen--detail ${selectedNote.isRead ? "arcade-screen--detail-read" : ""}`}>
                <div className="arcade-screen__detail-type">{selectedNote.type || "nota"}</div>
                <div className="arcade-screen__detail-title">{selectedNote.title || "Sin título"}</div>
                <div ref={detailContentRef} className="arcade-screen__detail-content">
                  {selectedNote.media?.url && selectedNote.type === "audio" && (
                    <audio src={selectedNote.media.url} controls className="arcade-screen__audio" />
                  )}
                  <MarkdownRenderer content={selectedNote.content || ""} />
                </div>
                <div className="arcade-screen__hint">
                  {isNoteAudio(selectedNote) ||
                  isNoteVideo(selectedNote) ||
                  getYoutubeIdFromNote(selectedNote)
                    ? "[A] Reproducir · "
                    : selectedNote.type !== "link" && selectedNote.media?.url
                      ? "[A] Descargar doc · "
                      : ""}
                  [D] Markdown · [L] Leído · [X] Eliminar · [W/S] Scroll · [B] Atrás · [O] Cerrar sesión
                </div>
              </div>
            )}

            {viewMode === "notifications" && (
              <div className="arcade-screen arcade-screen--notifications">
                <div className="arcade-screen__title">NOTIFICACIONES</div>
                {notifications.length === 0 ? (
                  <p className="arcade-screen__empty">No hay notificaciones</p>
                ) : (
                  <ul className="arcade-screen__list">
                    {notifications.map((notif, i) => (
                      <li
                        key={notif.id}
                        ref={i === selectedIndex ? selectedItemRef : null}
                        className={`arcade-screen__item arcade-screen__item--notif ${i === selectedIndex ? "arcade-screen__item--selected" : ""} ${notif.read ? "arcade-screen__item--read" : ""}`}
                      >
                        <span className="arcade-screen__item-notif-title">{(notif.noteTitle || "Sin título").slice(0, 36)}{(notif.noteTitle || "").length > 36 ? "…" : ""}</span>
                        <span className="arcade-screen__item-notif-time">
                          {new Date(notif.createdAt).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="arcade-screen__hint">
                  [A] Abrir · [B] Atrás · [L] Marcar leídas · [D] Borrar todas · [O] Cerrar sesión
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arista de 90° entre pantalla (vertical) y panel de botones (horizontal) */}
        <div className="arcade-cabinet__edge" aria-hidden />

        <div className="arcade-cabinet__controls-wrap">
          <div className="arcade-cabinet__controls-side arcade-cabinet__controls-side--left" aria-hidden />
          <div className="arcade-cabinet__controls-side arcade-cabinet__controls-side--right" aria-hidden />
        <div className="arcade-cabinet__controls">
          <div className="arcade-cabinet__controls-inner">
          <div className="arcade-arrows" role="group" aria-label="Flechas arriba y abajo">
            <button
              type="button"
              className={`arcade-arrow arcade-arrow--up ${arrowUpPressed ? "arcade-arrow--pressed" : ""}`}
              onClick={() => handleJoystickMouseDown("up")}
              aria-label="Arriba"
            >
              <span className="arcade-arrow__triangle" aria-hidden />
              <span className="arcade-arrow__symbol" aria-hidden>▲</span>
            </button>
            <button
              type="button"
              className={`arcade-arrow arcade-arrow--down ${arrowDownPressed ? "arcade-arrow--pressed" : ""}`}
              onClick={() => handleJoystickMouseDown("down")}
              aria-label="Abajo"
            >
              <span className="arcade-arrow__triangle" aria-hidden />
              <span className="arcade-arrow__symbol" aria-hidden>▼</span>
            </button>
          </div>

          <div className="arcade-buttons">
            <button
              type="button"
              className={`arcade-btn arcade-btn--a ${buttonAPressed ? "arcade-btn--pressed" : ""}`}
              onClick={() => {
                setButtonAPressed(true);
                setTimeout(() => setButtonAPressed(false), 150);
                handleAccept();
              }}
              aria-label="Botón A - Aceptar"
            >
              <span className="arcade-btn__label">A</span>
            </button>
            <button
              type="button"
              className={`arcade-btn arcade-btn--b ${buttonBPressed ? "arcade-btn--pressed" : ""}`}
              onClick={() => {
                setButtonBPressed(true);
                setTimeout(() => setButtonBPressed(false), 150);
                handleBack();
              }}
              aria-label="Botón B - Atrás"
            >
              <span className="arcade-btn__label">B</span>
            </button>
          </div>
          </div>
        </div>
        </div>
      </div>

        <div className="arcade-page__main-right" aria-hidden />
      </div>

      <p className="arcade-page__keys">
        [W/S] Navegar · [A] Aceptar · [B] Atrás · [N] Notificaciones · [O] Cerrar sesión · En lista/detalle: [L] Leído · [X] Eliminar · [D] Markdown · En notif: [L] Leídas · [D] Borrar
      </p>

      {/* Modal de reproducción: ampliación de pantalla arcade (audio/video/YouTube) */}
      {mediaModalOpen && selectedNote && (
        <div
          className="arcade-media-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Reproducción"
        >
          <div className="arcade-media-modal__backdrop" onClick={() => setMediaModalOpen(false)} />
          <div className="arcade-media-modal__frame">
            <div className="arcade-media-modal__bezel">
              <div
                className={`arcade-media-modal__screen ${
                  isNoteAudio(selectedNote) ? "arcade-media-modal__screen--audio" : ""
                }`}
              >
                {getYoutubeIdFromNote(selectedNote) ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${getYoutubeIdFromNote(selectedNote)}?autoplay=1`}
                    title="YouTube"
                    className="arcade-media-modal__iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : isNoteVideo(selectedNote) && selectedNote.media?.url ? (
                  <video
                    src={selectedNote.media.url}
                    controls
                    autoPlay
                    className="arcade-media-modal__video"
                  />
                ) : isNoteAudio(selectedNote) && selectedNote.media?.url ? (
                  <div className="arcade-media-modal__audio-wrap">
                    <p className="arcade-media-modal__title">{selectedNote.title || "Audio"}</p>
                    <audio
                      src={selectedNote.media.url}
                      controls
                      autoPlay
                      className="arcade-media-modal__audio"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="arcade-media-modal__close"
              onClick={() => setMediaModalOpen(false)}
              aria-label="Cerrar"
            >
              [B] Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalBrainArcade;

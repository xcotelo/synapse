import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loadNotes } from "../digitalBrainStorage";
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
  { id: "otras", label: "NOTA" },
];

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
  const keyRepeatRef = useRef(null);
  const detailContentRef = useRef(null);
  const selectedItemRef = useRef(null);

  const SCROLL_STEP = 56;

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  /* Mantener el elemento seleccionado visible: hacer scroll en la pantalla cuando cambia la selección */
  useEffect(() => {
    if (viewMode !== "menu" && viewMode !== "list") return;
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, viewMode]);

  const filteredNotes = useMemo(() => {
    if (!category) return [];
    return notes.filter((n) => categorizeNote(n) === category);
  }, [notes, category]);

  const maxIndex = viewMode === "menu" ? MENU_OPTIONS.length - 1 : Math.max(0, filteredNotes.length - 1);

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
      setCategory(opt.id);
      setSelectedIndex(0);
      setViewMode("list");
    } else if (viewMode === "list" && filteredNotes[selectedIndex]) {
      setSelectedNote(filteredNotes[selectedIndex]);
      setViewMode("detail");
    }
  }, [viewMode, selectedIndex, filteredNotes]);

  const handleBack = useCallback(() => {
    if (viewMode === "list") {
      setViewMode("menu");
      setCategory(null);
      setSelectedIndex(0);
    } else if (viewMode === "detail") {
      setViewMode("list");
      setSelectedNote(null);
    }
  }, [viewMode]);

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
        handleBack();
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
  }, [viewMode, moveSelection, handleAccept, handleBack, scrollDetailContent]);

  const handleJoystickMouseDown = (direction) => {
    if (viewMode === "detail") {
      scrollDetailContent(direction);
    } else {
      moveSelection(direction);
    }
  };

  return (
    <div className="arcade-page">
      <div className="arcade-page__back">
        <Link to="/brain/knowledge" className="arcade-page__back-link">
          ← Conocimiento
        </Link>
      </div>

      <div className="arcade-cabinet">
        <div className="arcade-cabinet__marquee">
          <span className="arcade-cabinet__marquee-text">SYNAPSE</span>
          <span className="arcade-cabinet__marquee-sub">KNOWLEDGE</span>
          <span className="arcade-cabinet__marquee-stars">★ ★ ★ ★ ★</span>
        </div>

        <div className="arcade-cabinet__screen-frame">
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
                <div className="arcade-screen__hint">[A] Aceptar · [B] Atrás</div>
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
                        className={`arcade-screen__item ${i === selectedIndex ? "arcade-screen__item--selected" : ""}`}
                      >
                        {(note.title || "Sin título").slice(0, 40)}
                        {(note.title || "").length > 40 ? "…" : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="arcade-screen__hint">[A] Ver · [B] Atrás</div>
              </div>
            )}

            {viewMode === "detail" && selectedNote && (
              <div className="arcade-screen arcade-screen--detail">
                <div className="arcade-screen__detail-type">{selectedNote.type || "nota"}</div>
                <div className="arcade-screen__detail-title">{selectedNote.title || "Sin título"}</div>
                <div ref={detailContentRef} className="arcade-screen__detail-content">
                  {selectedNote.media?.url && selectedNote.type === "audio" && (
                    <audio src={selectedNote.media.url} controls className="arcade-screen__audio" />
                  )}
                  <MarkdownRenderer content={selectedNote.content || ""} />
                </div>
                <div className="arcade-screen__hint">[W/S] Scroll · [B] Atrás</div>
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

      <p className="arcade-page__keys">W / S o flechas ↑↓ · A · B · o usa el ratón</p>
    </div>
  );
};

export default DigitalBrainArcade;

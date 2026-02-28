import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loadNotes } from "../digitalBrainStorage";
import "./DigitalBrainSlot.css";

const SLOT_SYMBOLS = ["WEB", "VIDEO", "AUDIO", "NOTA"];
const REEL_ROW_HEIGHT = 52;
const REEL_SPIN_DURATION_MS = 2200;
const REEL_STOP_STAGGER_MS = 120;

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

const categoryToSymbolIndex = (category) => {
  const map = { web: 0, videos: 1, audio: 2, otras: 3 };
  return map[category] ?? 3;
};

const getNoteSlotLabel = (note) => {
  if (!note) return "NOTA";
  const category = categorizeNote(note);
  const idx = categoryToSymbolIndex(category);
  return SLOT_SYMBOLS[idx];
};

const isNoteVideo = (note) => note && (note.type === "video" || (note.media && note.media.contentType && String(note.media.contentType).startsWith("video/")));
const isNoteAudio = (note) => note && (note.type === "audio" || (note.media && note.media.contentType && String(note.media.contentType).startsWith("audio/")));
const isNoteLink = (note) => note && note.type === "link";

const DigitalBrainSlot = () => {
  const [notes, setNotes] = useState([]);
  const [slotCurrentNote, setSlotCurrentNote] = useState(null);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [slotLeverDown, setSlotLeverDown] = useState(false);
  const [reel1Stop, setReel1Stop] = useState(0);
  const [reel2Stop, setReel2Stop] = useState(0);
  const [reel3Stop, setReel3Stop] = useState(0);
  const slotRemainingRef = useRef([]);
  const leverPullTimeoutRef = useRef(null);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const pullSlotLever = useCallback(() => {
    if (notes.length === 0 || slotSpinning) return;
    setSlotSpinning(true);
    setSlotCurrentNote(null);

    const remaining = slotRemainingRef.current;
    let pool = remaining.length > 0 ? [...remaining] : notes.map((n) => n.id);
    if (pool.length === 0) pool = notes.map((n) => n.id);

    const randomIndex = Math.floor(Math.random() * pool.length);
    const pickedId = pool[randomIndex];
    const nextPool = pool.filter((id) => id !== pickedId);
    slotRemainingRef.current = nextPool;

    const pickedNote = notes.find((n) => n.id === pickedId);
    const symbolIndex = pickedNote ? categoryToSymbolIndex(categorizeNote(pickedNote)) : 0;
    setReel1Stop(symbolIndex);
    setReel2Stop(symbolIndex);
    setReel3Stop(symbolIndex);

    const revealAt = REEL_SPIN_DURATION_MS + REEL_STOP_STAGGER_MS * 2 + 200;
    setTimeout(() => {
      setSlotCurrentNote(pickedNote || null);
      setSlotSpinning(false);
    }, revealAt);
  }, [notes, slotSpinning]);

  const handleLeverMouseDown = useCallback(() => {
    if (notes.length === 0 || slotSpinning) return;
    setSlotLeverDown(true);
    if (leverPullTimeoutRef.current) clearTimeout(leverPullTimeoutRef.current);
    leverPullTimeoutRef.current = setTimeout(() => {
      leverPullTimeoutRef.current = null;
      pullSlotLever();
    }, 220);
  }, [notes, slotSpinning, pullSlotLever]);

  const handleLeverMouseUp = useCallback(() => {
    setSlotLeverDown(false);
  }, []);

  const handleLeverMouseLeave = useCallback(() => {
    setSlotLeverDown(false);
  }, []);

  useEffect(() => {
    return () => {
      if (leverPullTimeoutRef.current) clearTimeout(leverPullTimeoutRef.current);
    };
  }, []);

  return (
    <div className="slot-page">
      <div className="slot-page__back">
        <Link to="/brain/knowledge" className="slot-page__back-link">
          ← Conocimiento
        </Link>
      </div>
      <div className="slot-page__content">
        <h1 className="slot-page__title">Slot</h1>
        <p className="slot-page__subtitle">
          Tira de la palanca para descubrir una nota al azar de tu conocimiento.
        </p>

        {notes.length === 0 ? (
          <div className="slot-page__empty">
            <p>Aún no hay notas. Procesa contenido desde el <Link to="/brain/inbox">inbox</Link>.</p>
          </div>
        ) : (
          <div className="slot-machine" role="region" aria-label="Tragaperras de conocimiento">
            <div className="slot-machine__cabinet">
              <div className="slot-machine__marquee">
                <span className="slot-machine__marquee-text">KNOWLEDGE</span>
                <span className="slot-machine__marquee-glow" aria-hidden />
                <span className="slot-machine__marquee-light slot-machine__marquee-light--1" />
                <span className="slot-machine__marquee-light slot-machine__marquee-light--2" />
                <span className="slot-machine__marquee-light slot-machine__marquee-light--3" />
              </div>
              <div className="slot-machine__bezel">
                <div className="slot-machine__reels">
                  {[reel1Stop, reel2Stop, reel3Stop].map((stop, idx) => (
                    <div key={idx} className="slot-machine__reel-wrap">
                      <div
                        className={`slot-machine__reel-strip ${slotSpinning ? "slot-machine__reel-strip--spin" : ""}`}
                        style={{
                          "--reel-stop": `${-(10 + stop) * REEL_ROW_HEIGHT}px`,
                          "--reel-duration": `${REEL_SPIN_DURATION_MS + idx * REEL_STOP_STAGGER_MS}ms`,
                        }}
                      >
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className="slot-machine__reel-cell">
                            {SLOT_SYMBOLS[i % 4]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="slot-machine__payline" aria-hidden />
                <div className="slot-machine__result">
                  {slotCurrentNote ? (
                    <div className="slot-machine__content">
                      <div className={`slot-machine__content-type slot-machine__content-type--${slotCurrentNote.type || "nota"}`}>
                        {getNoteSlotLabel(slotCurrentNote)}
                      </div>
                      <div className="slot-machine__content-title">{slotCurrentNote.title || "Sin título"}</div>
                      {isNoteAudio(slotCurrentNote) && slotCurrentNote.media?.url && (
                        <div className="slot-machine__content-media">
                          <audio src={slotCurrentNote.media.url} controls className="slot-machine__audio" />
                        </div>
                      )}
                      {isNoteVideo(slotCurrentNote) && (
                        <div className="slot-machine__content-media slot-machine__content-media--video">
                          Vídeo · {(slotCurrentNote.content || "").slice(0, 80)}
                          {(slotCurrentNote.content || "").length > 80 ? "…" : ""}
                        </div>
                      )}
                      {isNoteLink(slotCurrentNote) && (
                        <div className="slot-machine__content-media">Enlace web</div>
                      )}
                      <div className="slot-machine__content-preview">
                        {(slotCurrentNote.content || "").slice(0, 120)}
                        {(slotCurrentNote.content || "").length > 120 ? "…" : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="slot-machine__placeholder">
                      {slotSpinning ? "..." : "Tira de la palanca"}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className={`slot-machine__lever ${slotLeverDown ? "slot-machine__lever--down" : ""}`}
                onMouseDown={handleLeverMouseDown}
                onMouseUp={handleLeverMouseUp}
                onMouseLeave={handleLeverMouseLeave}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleLeverMouseDown();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleLeverMouseUp();
                }}
                disabled={slotSpinning}
                aria-label="Tirar de la palanca para girar los rodillos"
              >
                <span className="slot-machine__lever-base" aria-hidden />
                <span className="slot-machine__lever-arm" />
                <span className="slot-machine__lever-handle" />
              </button>
            </div>
            <div className="slot-machine__label">SYNAPSE SLOT</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalBrainSlot;

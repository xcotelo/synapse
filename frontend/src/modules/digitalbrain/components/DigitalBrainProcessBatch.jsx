import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DigitalBrainProcessEntry from "./DigitalBrainProcessEntry";
import "./DigitalBrainProcessBatch.css";

const TRANSITION_MS = 400;

export const DigitalBrainProcessBatch = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ids = state?.ids;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | transitioning
  const [stripOffset, setStripOffset] = useState(0);
  const stripRef = useRef(null);

  useEffect(() => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      navigate("/brain/inbox", { replace: true });
    }
  }, [ids, navigate]);

  useEffect(() => {
    if (phase !== "transitioning") return;
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setStripOffset(-50));
    });
    return () => cancelAnimationFrame(t);
  }, [phase]);

  const handleSavedAndNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= ids.length) {
      navigate("/brain/knowledge", { replace: true });
      return;
    }
    setPhase("transitioning");
  };

  const handleTransitionEnd = () => {
    if (phase !== "transitioning") return;
    setCurrentIndex((i) => i + 1);
    setStripOffset(0);
    setPhase("idle");
  };

  if (!ids || ids.length === 0) {
    return null;
  }

  const currentId = ids[currentIndex];
  const nextId = phase === "transitioning" ? ids[currentIndex + 1] : null;

  return (
    <div className="synapse-batch">
      <div className="synapse-batch__progress">
        <span className="synapse-batch__progress-text">
          Elemento {currentIndex + 1} de {ids.length}
        </span>
        <div className="synapse-batch__progress-bar">
          <div
            className="synapse-batch__progress-fill"
            style={{ width: `${((currentIndex + 1) / ids.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="synapse-batch__viewport">
        <div
          ref={stripRef}
          className="synapse-batch__strip"
          style={{
            transform: `translateX(${stripOffset}%)`,
            transition: phase === "transitioning" ? `transform ${TRANSITION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)` : "none",
          }}
          onTransitionEnd={(e) => {
            if (e.target !== stripRef.current) return;
            handleTransitionEnd();
          }}
        >
          {phase === "transitioning" && nextId ? (
            <>
              <div className="synapse-batch__card synapse-batch__card--exiting">
                <DigitalBrainProcessEntry
                  entryId={currentId}
                  batchMode
                  onAfterSave={() => {}}
                />
              </div>
              <div className="synapse-batch__card synapse-batch__card--entering">
                <DigitalBrainProcessEntry
                  entryId={nextId}
                  batchMode
                  onAfterSave={handleSavedAndNext}
                />
              </div>
            </>
          ) : (
            <div className="synapse-batch__card synapse-batch__card--active">
              <DigitalBrainProcessEntry
                entryId={currentId}
                batchMode
                onAfterSave={handleSavedAndNext}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainProcessBatch;

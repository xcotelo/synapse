import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createInboxEntry, loadInbox, saveInbox } from "../digitalBrainStorage";

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

  // Engade unha nova entrada ao inbox a partir do textarea
  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const entry = createInboxEntry(input.trim());   // Crea a nova entrada
    const updated = [entry, ...inbox]; // Engade a nova entrada ao inicio da lista
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

  // Navega a la pantalla de procesado para esa entrada
  const handleProcess = (id) => {
    navigate(`/brain/process/${id}`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Cerebro Digital – Inbox</h2>
      <p className="text-muted">
        Captura aquí cualquier texto, enlace, idea rápida, código, etc. sin
        interrumpir lo que estás haciendo.
      </p>

      <form onSubmit={handleAdd} className="mb-4">
        <div className="mb-2">
          <textarea
            className="form-control"
            rows="4"
            placeholder="Pega un enlace, una idea, un fragmento de texto..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Añadir al inbox
        </button>
      </form>

      <h3 className="h5 mb-3">Entradas pendientes de procesar</h3>
      {inbox.length === 0 ? (
        <p className="text-muted">No hay entradas en el inbox todavía.</p>
      ) : (
        <ul className="list-group">
          {inbox.map((item) => (
            <li
              key={item.id}
              className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-center"
            >
              <div className="me-sm-3">
                <span className="badge bg-secondary me-2 text-uppercase">
                  {item.type}
                </span>
                <small className="text-muted d-block">
                  {new Date(item.createdAt).toLocaleString()}
                </small>
                <div className="mt-1 text-truncate" style={{ maxWidth: "45rem" }}>
                  {item.rawContent}
                </div>
              </div>
              <div className="mt-2 mt-sm-0 d-flex">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => handleProcess(item.id)}
                >
                  Procesar
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDiscard(item.id)}
                >
                  Descartar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DigitalBrainInbox;
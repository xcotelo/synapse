import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { appFetch, fetchConfig } from "../../../backend/appFetch";

import {
  createNoteFromEntry,
  loadInbox,
  loadNotes,
  saveNotes,
  saveInbox,
  defaultTemplate,
} from "../services/brainService";

export const DigitalBrainProcessEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(undefined);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("apunte");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

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
        if (data.destination) {
          setDestination(data.destination);
        }
        if (data.tags && Array.isArray(data.tags)) {
          setTags(data.tags.join(", "));
        }

        const summaryPart = data.summary ? `\n\nResumen sugerido:\n\n${data.summary}\n` : "";
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
    // Garda a entrada
    setEntry(found);

    // Pedimos sugerencias al backend (IA/reglas)
    setLoadingSuggestion(true);
    setSuggestionError(null);

    fetch("/api/brain/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: found.rawContent }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error en la sugerencia");
        }
        return res.json();
      })
      .then((data) => {
        setAiSuggestion(data);

        // Usamos las sugerencias para pre-rellenar el formulario
        const baseTitle = data.title || (found.type === "tarea" ? "Tarea" : "Nota");
        setTitle(baseTitle);
        if (data.destination) {
          setDestination(data.destination);
        }
        if (data.tags && Array.isArray(data.tags)) {
          setTags(data.tags.join(", "));
        }

        const summaryPart = data.summary ? `\n\nResumen sugerido:\n\n${data.summary}\n` : "";
        setContent(defaultTemplate(baseTitle, found.rawContent + summaryPart));
      })
      .catch(() => {
        // Si la "IA" falla, seguimos con el comportamiento básico
        const baseTitle = found.type === "tarea" ? "Tarea" : "Nota";
        setTitle(baseTitle);
        setContent(defaultTemplate(baseTitle, found.rawContent));
        setSuggestionError("No se pudieron cargar sugerencias automáticas.");
      })
      .finally(() => setLoadingSuggestion(false));
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
      destination,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      structuredContent: content,
    });

    // 3. Actualizar a lista de notas procesadas e eliminar a entrada do inbox
    const updatedNotes = [note, ...notes];
    const updatedInbox = inbox.filter((item) => item.id !== entry.id);

    // 4. Gardar cambios
    saveNotes(updatedNotes);
    saveInbox(updatedInbox);

    // 5. Ir á pantalla de coñecemento
    navigate("/brain/knowledge");
  };

  // Versión recortada del texto original para mostrar como vista previa
  const rawPreview = useMemo(() => {
    if (!entry) return "";
    return entry.rawContent.length > 400
      ? `${entry.rawContent.substring(0, 400)}...`
      : entry.rawContent;
  }, [entry]);

  if (entry === null) {
    return (
      <div className="container mt-4">
        <p className="text-muted">
          No se ha encontrado la entrada. Vuelve al {" "}
          <Link to="/brain/inbox">inbox</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12 col-lg-5 mb-4">
          <h2 className="h5 mb-3">Entrada original</h2>
          <span className="badge bg-secondary text-uppercase mb-2">
            {entry.type}
          </span>
          <small className="d-block text-muted mb-2">
            {new Date(entry.createdAt).toLocaleString()}
          </small>
          <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
            {rawPreview}
          </pre>
          {aiSuggestion && (
            <div className="mt-3 small">
              <p className="mb-1">
                <strong>Detecta (IA/reglas):</strong> {aiSuggestion.type}
              </p>
              {aiSuggestion.summary && (
                <p className="mb-1">
                  <strong>Resumen sugerido:</strong> {aiSuggestion.summary}
                </p>
              )}
              {aiSuggestion.destination && (
                <p className="mb-1">
                  <strong>Destino sugerido:</strong> {aiSuggestion.destination}
                </p>
              )}
              {aiSuggestion.tags && aiSuggestion.tags.length > 0 && (
                <p className="mb-1">
                  <strong>Etiquetas sugeridas:</strong> {aiSuggestion.tags.join(", ")}
                </p>
              )}
            </div>
          )}
          {loadingSuggestion && (
            <p className="text-muted small mt-2">Calculando sugerencias...</p>
          )}
          {suggestionError && (
            <p className="text-danger small mt-2">{suggestionError}</p>
          )}
          <Link to="/brain/inbox" className="btn btn-link px-0 mt-2">
            Volver al inbox
          </Link>
        </div>

        <div className="col-12 col-lg-7">
          <h2 className="h5 mb-3">Transformar en conocimiento</h2>
          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label">Título de la nota</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Destino</label>
              <select
                className="form-select"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="apunte">Apunte de estudio</option>
                <option value="idea">Idea conectada</option>
                <option value="recurso">Recurso / referencia</option>
                <option value="tarea">Lista de tareas</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Etiquetas</label>
              <input
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

            <div className="mb-3">
              <label className="form-label">Contenido estructurado (Markdown)</label>
              <textarea
                className="form-control"
                rows="10"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <small className="text-muted">
                Usa títulos, listas y enlaces en Markdown. Esta será la versión
                reutilizable de la nota.
              </small>
            </div>

            <button type="submit" className="btn btn-primary">
              Guardar nota y sacar del inbox
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DigitalBrainProcessEntry;


import React from "react";
import ReactMarkdown from "react-markdown";
import { extractYouTubeId } from "../digitalBrainStorage";

const getYoutubeIdFromNote = (note) => {
  if (!note) return null;
  return extractYouTubeId(note.content) || extractYouTubeId(note.title);
};

/**
 * Componente para renderizar contenido Markdown de forma bonita
 */
const MarkdownRenderer = ({ content, selectedNote }) => {
  if (!content) {
    return <p className="text-muted">No hay contenido disponible.</p>;
  }

  return (
    <div
      className="markdown-content"
      style={{
        lineHeight: "1.8",
        color: "inherit",
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ node, children, ...props }) => {
            let videoElement = null;
            if (selectedNote && (selectedNote.type === "video" || getYoutubeIdFromNote(selectedNote))) {
              videoElement = (
                <div className="mb-3 rounded overflow-hidden shadow-sm" style={{ border: "1px solid #eee", backgroundColor: "#000" }}>
                  {getYoutubeIdFromNote(selectedNote) ? (
                    <iframe
                      width="100%"
                      height="400"
                      src={`https://www.youtube-nocookie.com/embed/${getYoutubeIdFromNote(selectedNote)}`}
                      title="YouTube Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : selectedNote.media && selectedNote.media.url ? (
                    <video
                      src={selectedNote.media.url}
                      controls
                      className="w-100"
                      style={{ maxHeight: "400px", backgroundColor: "#000" }}
                    />
                  ) : null}
                </div>
              );
            }

            return (
              <>
                <h1
                  className="mb-3 mt-4"
                  style={{ fontSize: "2rem", fontWeight: "700" }}
                  {...props}
                >
                  {children}
                </h1>
                {videoElement}
              </>
            );
          },
          h2: ({ node, ...props }) => (
            <h2
              className="mb-3 mt-4"
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                borderBottom: "2px solid currentColor",
                paddingBottom: "0.5rem",
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="mb-2 mt-3"
              style={{ fontSize: "1.25rem", fontWeight: "600" }}
              {...props}
            />
          ),
          p: ({ node, children, ...props }) => {
            // Si el contenido del párrafo es SOLO un texto que parece un link a YouTube
            return <p className="mb-3" style={{ fontSize: "1rem" }} {...props}>{children}</p>;
          },
          ul: ({ node, ...props }) => (
            <ul className="mb-3" style={{ paddingLeft: "1.5rem" }} {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-3" style={{ paddingLeft: "1.5rem" }} {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1" style={{ fontSize: "1rem" }} {...props} />
          ),
          code: ({ node, inline, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-dark text-light px-1 py-0 rounded"
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.9em",
                    padding: "0.2em 0.4em",
                  }}
                  {...props}
                />
              );
            }
            return (
              <pre
                className="bg-dark text-light p-3 rounded mb-3"
                style={{
                  overflowX: "auto",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                }}
              >
                <code {...props} />
              </pre>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-start border-4 border-primary ps-3 py-2 mb-3"
              style={{ fontStyle: "italic" }}
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="fw-bold" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="fst-italic" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Componente para renderizar contenido Markdown de forma bonita
 */
const MarkdownRenderer = ({ content }) => {
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
          h1: ({ node, ...props }) => (
            <h1
              className="mb-3 mt-4"
              style={{ fontSize: "2rem", fontWeight: "700" }}
              {...props}
            />
          ),
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
          p: ({ node, ...props }) => (
            <p className="mb-3" style={{ fontSize: "1rem" }} {...props} />
          ),
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
          a: ({ node, ...props }) => (
            <a
              className="text-primary text-decoration-underline"
              target="_blank"
              rel="noopener noreferrer"
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

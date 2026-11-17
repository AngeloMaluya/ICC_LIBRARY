import { useState } from "react";
import "./citationmodal.css";

const formatAuthors = (author) =>
  String(author || "Unknown author").trim();

const cleanYear = (year) => {
  const value = String(year || "").trim();
  return /^\d{4}$/.test(value) ? value : "n.d.";
};

export default function CitationModal({ research, onClose, isAdmin }) {
  const [copied, setCopied] = useState("");

  if (!research) return null;

  const author = formatAuthors(research.author);
  const title = String(research.title || "Untitled research").trim();
  const year = cleanYear(research.year);
  const institution = "Immaculada Concepcion College";


  const formatAPAAuthors = (authors) => {
  if (!authors) return "Unknown Author";

  const authorList = authors
    .split(/,|\band\b|&/i)
    .map((name) => name.trim())
    .filter(Boolean);

  const formattedAuthors = authorList.map((name) => {
    const parts = name.split(/\s+/);

    if (parts.length === 1) return name;

    const lastName = parts.pop();

    const initials = parts
      .map((part) => `${part.charAt(0).toUpperCase()}.`)
      .join(" ");

    return `${lastName}, ${initials}`;
  });

  if (formattedAuthors.length === 1) {
    return formattedAuthors[0];
  }

  return (
    formattedAuthors.slice(0, -1).join(", ") +
    ", & " +
    formattedAuthors.at(-1)
  );
};

const citations = {
  APA: `${formatAPAAuthors(author)} (${year}). ${title} [Research paper]. ${institution}.`,
};

const copyCitation = async (style, citation) => {
  try {
    // Copy citation to clipboard
    await navigator.clipboard.writeText(citation);

    setCopied(style);

    // Only track student citation actions
    if (isAdmin) return;

    const token = sessionStorage.getItem("authToken");

    if (!token || !research?.id) {
      console.warn("Citation copied but tracking unavailable.");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/citations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          researchId: research.id,
          citationStyle: style,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to record citation action.");
    }
  } catch (error) {
    console.error("CITATION ERROR:", error);

    setCopied("failed");
  }
};

  return (
    <div
      className="citation-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="citation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-title"
      >
        <div className="citation-header">
          <button
            type="button"
            className="citation-close"
            onClick={onClose}
            aria-label="Close citations"
          >
            ×
          </button>

          <h2 id="citation-title">Cite</h2>
        </div>

        <div className="citation-body">
          {Object.entries(citations).map(([style, citation]) => (
            <div className="citation-row" key={style}>
              <span className="citation-style">{style}</span>

              <p className="citation-text">{citation}</p>

              <button
                type="button"
                className="citation-copy"
                onClick={() => copyCitation(style, citation)}
                title={`Copy ${style} citation`}
              >
                {copied === style ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}

          {copied === "failed" && (
            <p className="citation-error">
              Could not copy the citation. Please select and copy it manually.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

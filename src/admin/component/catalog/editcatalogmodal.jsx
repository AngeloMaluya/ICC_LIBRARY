
import { useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export default function EditCatalogModal({
  research,
  onClose,
  onUpdated,
}) {
    const [form, setForm] = useState({
        accession_number: research.accession_number || "",
        catalog_number: research.catalog_number || "",
        title: research.title || "",
        author: research.author || "",
        year: research.year || "",
        education_level: research.education_level || "",
    });

  const [poster, setPoster] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = sessionStorage.getItem("authToken");
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (poster) {
        formData.append("poster", poster);
      }

      const response = await fetch(
        `${API_URL}/api/catalog/${research.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save changes."
        );
      }

      onUpdated(result.record);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="catalog-modal-overlay"
      onClick={() => !saving && onClose()}
    >
      <div
        className="catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="catalog-modal-header">
          <h2 id="catalog-modal-title">
            Edit Research Information
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="catalog-form-grid">
            <label className="catalog-full-width">
              Research Title
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
              />
            </label>

            <label className="catalog-full-width">
              Author
              <input
                name="author"
                value={form.author}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Accession Number
              <input
                name="accession_number"
                value={form.accession_number}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Call Number
              <input
                name="catalog_number"
                value={form.catalog_number}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Publication Year
              <input
                type="number"
                name="year"
                min="2000"
                max="2100"
                value={form.year}
                onChange={updateField}
                required
              />
            </label>
            <label>
                Education Level

                <select
                    name="education_level"
                    value={form.education_level}
                    onChange={updateField}
                    required
                >
                    <option value="">
                    Select Education Level
                    </option>

                    <option value="college">
                    College
                    </option>

                    <option value="shs">
                    Senior High School (SHS)
                    </option>
                </select>
            </label>

            <label>
              Replace Poster
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(event) =>
                  setPoster(event.target.files?.[0] || null)
                }
              />
            </label>
          </div>

          {research.poster_url && (
            <a
              href={research.poster_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View current poster
            </a>
          )}

          {error && (
            <p className="catalog-error">{error}</p>
          )}

          <div className="catalog-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditCatalogModal from "./editcatalogmodal";
import "./catalog.css";

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export default function Catalog() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResearch, setSelectedResearch] =
    useState(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/catalog`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load catalog."
        );
      }

      setRecords(result.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((research) =>
      [
        research.accession_number,
        research.title,
        research.author,
        research.year,
      ]
        .some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term)
        )
    );
  }, [records, search]);

  const handleUpdated = (updated) => {
    setRecords((previous) =>
      previous.map((record) =>
        record.id === updated.id ? updated : record
      )
    );

    setSelectedResearch(null);
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <div>
          <h1>Research Catalog</h1>
          <p>
            View and manage uploaded research records.
          </p>
        </div>

        <button
          type="button"
          className="catalog-refresh"
          onClick={loadCatalog}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="catalog-toolbar">
        <input
          type="search"
          placeholder="Search accession number, call number, title, author..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <span>
          {filteredRecords.length} records
        </span>
      </div>

      {error && (
        <p className="catalog-error">{error}</p>
      )}

      <div className="catalog-table-wrapper">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Accession Number</th>
              <th>Title of the Research</th>
              <th>Author</th>
              <th>Publication Year</th>
              <th>Education Level</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  Loading catalog...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  No catalog records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((research) => (
                <tr key={research.id}>
                  <td>
                    {research.accession_number || "—"}
                  </td>

                  <td className="catalog-title-cell">
                    {research.title}
                  </td>

                  <td>{research.author}</td>

                  <td>{research.year}</td>
                  
                  <td>
                    {research.education_level === "college"
                        ? "College"
                        : research.education_level === "shs"
                        ? "Senior High School"
                        : "—"}
                    </td>

                  <td>
                    <div className="catalog-actions">
                      <button
                        type="button"
                        className="catalog-view-button"
                        onClick={() =>
                          navigate(
                            `/admin/fullview/${research.id}`
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="catalog-edit-button"
                        onClick={() =>
                          setSelectedResearch(research)
                        }
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedResearch && (
        <EditCatalogModal
          research={selectedResearch}
          onClose={() => setSelectedResearch(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

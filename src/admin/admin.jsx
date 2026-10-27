
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin-upload.css";
import { logout } from "../utils/auth.js";

import "../components/sidebar/sidebar.css";
import Sidebar from "../components/sidebar/sidebar.jsx";

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => logout(navigate);

  const [form, setForm] = useState({
    title: "",
    author: "",
    year: "",
    program: "",
  });

  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPdf(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Please select a PDF file.");
      setPdf(null);
      e.target.value = "";
      return;
    }

    setPdf(file);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API_URL) {
      setMessage(
        "Backend URL is missing. Check your VITE_API_URL environment variable."
      );
      return;
    }

    if (!pdf) {
      setMessage("Please select a PDF.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.author.trim() ||
      !form.year ||
      !form.program
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    if (Number(form.year) < 2000 || Number(form.year) > 2100) {
      setMessage("Please enter a valid year between 2000 and 2100.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("pdf", pdf);
      formData.append("title", form.title.trim());
      formData.append("author", form.author.trim());
      formData.append("year", form.year);
      formData.append("program", form.program);

      console.log("Starting research upload...");
      console.log("Backend URL:", API_URL);
      console.log("PDF filename:", pdf.name);
      console.log("PDF size:", `${(pdf.size / 1024 / 1024).toFixed(2)} MB`);

      const response = await fetch(
        `${API_URL.replace(/\/+$/, "")}/api/research/summarize`,
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText = await response.text();

      console.log("Upload HTTP status:", response.status);
      console.log("Upload response:", responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        if (response.status === 502) {
          throw new Error(
            "The backend returned HTTP 502 (Bad Gateway). " +
              "The server or an upstream service may have failed while processing the PDF. " +
              "Check the Render logs for the upload request."
          );
        }

        throw new Error(
          `The backend returned a non-JSON response (HTTP ${response.status}). ` +
            `Response: ${responseText.slice(0, 300) || "Empty response"}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Research upload failed (HTTP ${response.status}).`
        );
      }

      setMessage(
        data.message ||
          "Research uploaded successfully and AI summary generated!"
      );

      setForm({
        title: "",
        author: "",
        year: "",
        program: "",
      });

      setPdf(null);

      const fileInput = document.getElementById("pdf");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("RESEARCH UPLOAD ERROR:", error);

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setMessage(
          "Unable to reach the backend. Check the backend URL, CORS settings, and Render service status."
        );
      } else {
        setMessage(
          error.message || "An unexpected error occurred during upload."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      
      <Sidebar/>

      <div className="upload-container">
        <h1>Upload Research</h1>

        <p className="subtitle">
          Upload a research paper to add it to the ICC Library.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Research Title</label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter research title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input
              id="author"
              type="text"
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              placeholder="2026"
              min="2000"
              max="2100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="program">Program</label>
            <select
              id="program"
              name="program"
              value={form.program}
              onChange={handleChange}
              required
            >
              <option value="">Select Program</option>
              <option value="BSCS">
                Bachelor of Science in Computer Science
              </option>
              <option value="BSBA">
                Bachelor of Science in Business Administration
              </option>
              <option value="BSED">
                Bachelor of Secondary Education
              </option>
              <option value="BEED">
                Bachelor of Elementary Education
              </option>
              <option value="BSTM">
                Bachelor of Science in Tourism Management
              </option>
              <option value="BSCriM">
                Bachelor of Science in Criminology
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pdf">Research PDF</label>
            <input
              id="pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              required
            />

            {pdf && (
              <p className="file-name">
                Selected: {pdf.name} (
                {(pdf.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}>
            {loading
              ? "Uploading & Generating Summary..."
              : "Upload Research"}
          </button>

          {message && (
            <p
              className="message"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </form>

        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
          disabled={loading}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Admin;

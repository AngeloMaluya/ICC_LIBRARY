import { useState } from "react";
import "./admin-upload.css";

const admin = () => {
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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please select a PDF file.");
      setPdf(null);
      return;
    }

    setPdf(file);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pdf) {
      setMessage("Please select a PDF.");
      return;
    }

    if (!form.title || !form.author || !form.year || !form.program) {
      setMessage("Please complete all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("pdf", pdf);
      formData.append("title", form.title);
      formData.append("author", form.author);
      formData.append("year", form.year);
      formData.append("program", form.program);

     const response = await fetch(
  `${API_URL}/api/research/summarize`,
  {
    method: "POST",
    body: formData,
  }
);

console.log("STATUS:", response.status);
console.log("OK:", response.ok);

const responseText = await response.text();

console.log("RAW RESPONSE:", responseText);

let data;

try {
  data = JSON.parse(responseText);
} catch (error) {
  console.error("Response was not JSON:", responseText);

  throw new Error(
    `Backend returned invalid/empty response. Status: ${response.status}`
  );
}

console.log("DATA:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload research."
        );
      }

      setMessage(
        "Research uploaded successfully and AI summary generated!"
      );

      setForm({
        title: "",
        author: "",
        year: "",
        program: "",
      });

      setPdf(null);

      document.getElementById("pdf").value = "";

    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-upload-page">

      <div className="upload-container">

        <h1>Upload Research</h1>

        <p className="subtitle">
          Upload a research paper to add it to the ICC Library.
        </p>

        <form onSubmit={handleSubmit}>

          {/* TITLE */}
          <div className="form-group">

            <label>Research Title</label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter research title"
            />

          </div>

          {/* AUTHOR */}
          <div className="form-group">

            <label>Author</label>

            <input
              type="text"
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="Enter author name"
            />

          </div>

          {/* YEAR */}
          <div className="form-group">

            <label>Year</label>

            <input
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              placeholder="2026"
              min="2000"
              max="2100"
            />

          </div>

          {/* PROGRAM */}
          <div className="form-group">

            <label>Program</label>

            <select
              name="program"
              value={form.program}
              onChange={handleChange}
            >

              <option value="">
                Select Program
              </option>

              <option value="BSCS">
                Bachelor of Science in Computer Science
              </option>

              <option value="BSIT">
                Bachelor of Science in Information Technology
              </option>

              <option value="BSED">
                Bachelor of Secondary Education
              </option>

              <option value="BEED">
                Bachelor of Elementary Education
              </option>

            </select>

          </div>

          {/* PDF */}
          <div className="form-group">

            <label>Research PDF</label>

            <input
              id="pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            {pdf && (
              <p className="file-name">
                Selected: {pdf.name}
              </p>
            )}

          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Uploading & Generating Summary..."
              : "Upload Research"}

          </button>

          {/* MESSAGE */}
          {message && (
            <p className="message">
              {message}
            </p>
          )}

        </form>

      </div>

    </div>
  );
};

export default admin;
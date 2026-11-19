import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pdfjs } from "react-pdf";
import "./upload.css";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
const convertPdfPosterToPng = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;
  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({
      scale: 1.5,
    });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create poster preview.");
    }
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({
      canvasContext: context,
      canvas,
      viewport,
    }).promise;
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Failed to convert PDF poster."));
        },
        "image/png"
      );
    });
    return new File(
      [blob],
      file.name.replace(/\.pdf$/i, ".png"),
      { type: "image/png" }
    );
  } finally {
    await pdf.destroy();
  }
};
const COLLEGE_PROGRAMS = [
  { value: "BSCS", label: "Bachelor of Science in Computer Science" },
  { value: "BSBA", label: "Bachelor of Science in Business Administration" },
  { value: "BEED", label: "Bachelor of Elementary Education" },
  { value: "BSED", label: "Bachelor of Secondary Education" },
  { value: "BSTM", label: "Bachelor of Science in Tourism Management" },
  { value: "BSCrim", label: "Bachelor of Science in Criminology" },
];

const SHS_STRANDS = [
  { value: "STEM", label: "Science, Technology, Engineering, and Mathematics" },
  { value: "ABM", label: "Accountancy, Businesccss and Management" },
  { value: "HUMSS", label: "Humanities and Social Sciences" },
  { value: "GAS", label: "General Academic Strand" },
  { value: "HE", label: "Home Economics" },
  { value: "ICT", label: "Information and Communications Technology" },
];

const Upload = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const pdfInputRef = useRef(null);
  const posterInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    author: "",
    year: "",
    program: "",
    educationLevel: "",
    cutterNumber: "",
  });
  const [pdf, setPdf] = useState(null);
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "educationLevel") {
      setForm((previous) => ({
        ...previous,
        educationLevel: value,
        program: "",
      }));
      return;
    }
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  // PDF FILE VALIDATION
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
    if (file.size > 50 * 1024 * 1024) {
      setMessage("PDF must not exceed 50 MB.");
      setPdf(null);
      e.target.value = "";
      return;
    }
    setPdf(file);
    setMessage("");
  };
  // POSTER IMAGE VALIDATION
  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPoster(null);
      return;
    }
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
       "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage(
        "Only JPG, PNG, and WebP poster images are allowed."
      );
      setPoster(null);
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Poster image must not exceed 5 MB.");
      setPoster(null);
      e.target.value = "";
      return;
    }
    setPoster(file);
    setMessage("");
  };
  // UPLOAD RESEARCH AND POSTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
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
      !form.educationLevel ||
      !form.program
    ) {
      setMessage("Please complete all fields.");
      return;
    }
    if (
      Number(form.year) < 2000 ||
      Number(form.year) > 2100
    ) {
      setMessage(
        "Please enter a valid year between 2000 and 2100."
      );
      return;
    }
    if (form.cutterNumber.trim() && !/^[A-Za-z][0-9]+$/.test(form.cutterNumber.trim())) {
      setMessage("Invalid Cutter number. Example: R433.");
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
          formData.append("educationLevel", form.educationLevel);
          formData.append("program", form.program);
          if (form.accessionNumber.trim()) {
            formData.append(
              "cutterNumber",
              form.accessionNumber.trim().toUpperCase()
            );
          }

        if (poster) {
          let posterToUpload = poster;
          if (
            poster.type === "application/pdf" ||
            poster.name.toLowerCase().endsWith(".pdf")
          ) {
            setMessage("Converting PDF poster to PNG...");
            posterToUpload = await convertPdfPosterToPng(poster);
          }
          if (posterToUpload.size > 5 * 1024 * 1024) {
            throw new Error(
              "Converted poster exceeds 5 MB. Please use a smaller poster."
            );
          }
          formData.append("poster", posterToUpload);
        }
        setMessage("Uploading research...");

        console.log("========== FRONTEND DEBUG ==========");
console.log("Title:", form.title);
console.log("Cutter Number:", form.cutterNumber);
console.log(
  "FormData Cutter:",
  formData.get("cutterNumber")
);
console.log("====================================");

      const token = sessionStorage.getItem("authToken");
      if (!token) {
        throw new Error(
          "Administrator session not found. Please log in again."
        );
      }
      const response = await fetch(
        `${API_URL.replace(/\/+$/, "")}/api/research/summarize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      // SUCCESS
      setMessage(
        data.message ||
        "Research uploaded successfully and AI summary generated!"
      );
      // RESET FORM
      setForm({
        title: "",
        author: "",
        year: "",
        program: "",
    educationLevel: "",
    cutterNumber: "",
      });
      setPdf(null);
      setPoster(null);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
      if (posterInputRef.current) {
        posterInputRef.current.value = "";
      }
    } catch (error) {
      console.error("RESEARCH UPLOAD ERROR:", error);
      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        setMessage(
          "Unable to reach the backend. Check the backend URL, CORS settings, and Render service status."
        );
      } else {
        setMessage(
          error.message ||
          "An unexpected error occurred during upload."
        );
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  document.title = "Admin Uploads";
}, []);
  return (
    <div className="admin-layout">
      <div className="upload-container">
        <h1>Upload Research</h1>
        <p className="subtitle">
          Upload a research paper and poster to the ICC Library.
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
          <select
            id="year"
            name="year"
            value={form.year}
            onChange={handleChange}
            required
          >
            <option value="">Select Year</option>

            {Array.from(
                { length: new Date().getFullYear() - 2000 + 1 },
                (_, index) => new Date().getFullYear() - index
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>

      {/* EDUCATION LEVEL */}
      <div className="form-group">
        <label htmlFor="educationLevel">Education Level</label>
        <select
          id="educationLevel"
          name="educationLevel"
          value={form.educationLevel}
          onChange={handleChange}
          required
        >
          <option value="">Select Education Level</option>
          <option value="college">College</option>
          <option value="shs">Senior High School</option>
        </select>
      </div>

      {/* COLLEGE PROGRAM OR SHS STRAND */}
      {form.educationLevel && (
        <div className="form-group">
          <label htmlFor="program">
            {form.educationLevel === "shs" ? "Strand" : "Program"}
          </label>
          <select
            id="program"
            name="program"
            value={form.program}
            onChange={handleChange}
            required
          >
            <option value="">
              {form.educationLevel === "shs"
                ? "Select Strand"
                : "Select Program"}
            </option>
            {(form.educationLevel === "shs"
              ? SHS_STRANDS
              : COLLEGE_PROGRAMS
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
          {/* CUTTER NUMBER */}
          <div className="form-group">
            <label htmlFor="cutterNumber">Accession Number (Optional)</label>
            <input
              id="accessionNumber"
              type="text"
              name="accessionNumber"
              value={form.accessionNumber}
              onChange={handleChange}
              placeholder="Example: R433"
              pattern="[A-Za-z][0-9]+"
              title="Enter one letter followed by numbers, e.g. R433"
              disabled={loading}
            />
          </div>
          {/* RESEARCH PDF */}
          <div className="form-group">
            <label htmlFor="pdf">Research PDF</label>
            <input
              ref={pdfInputRef}
              id="pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              required
            />
            {pdf && (
              <p className="file-name">
                Selected: {pdf.name} (
                {(pdf.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          {/* RESEARCH POSTER */}
          <div className="form-group">
            <label htmlFor="poster">
              Research Poster
            </label>
            <input
              ref={posterInputRef}
              id="poster"
              name="poster"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handlePosterChange}
              disabled={loading}
            />
            {poster && (
              <p className="file-name">
                Selected: {poster.name} (
                {(poster.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <small>
              Supported formats: JPG, PNG, WebP, PDF.
              Maximum size: 5 MB.
            </small>
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
      </div>
    </div>
  );
};
export default Upload;

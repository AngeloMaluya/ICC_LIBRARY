import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";
import { verifyStudentToken } from "../middleware/authMiddleware.js";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."));
    }

    cb(null, true);
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Get research listings, optionally filtered by program and search term
router.get("/", verifyStudentToken, async (req, res) => {
  try {
    const { program, search } = req.query;

    let query = supabase
      .from("summarized")
      .select(`
        id,
        title,
        author,
        year,
        program,
        summary,
        pdf_url,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (
      program &&
      typeof program === "string" &&
      program.trim()
    ) {
      query = query.ilike("program", program.trim());
    }

    if (
      search &&
      typeof search === "string" &&
      search.trim()
    ) {
      const term = search.trim().replace(/[%(),]/g, " ");

      query = query.or(
        `title.ilike.%${term}%,author.ilike.%${term}%,program.ilike.%${term}%,content.ilike.%${term}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET RESEARCH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch research.",
        error: error.message,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// Get one complete research record, including extracted PDF text
router.get("/:id", verifyStudentToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Fetching research ID:", id);

    const { data, error } = await supabase
      .from("summarized")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("GET SINGLE RESEARCH ERROR:", error);

      return res.status(404).json({
        success: false,
        message: "Research not found.",
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// Upload PDF, extract text, generate summary, and save research
router.post(
  "/summarize",
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a PDF file.",
        });
      }

      console.log("PDF received:", req.file.originalname);
      console.log("PDF size:", req.file.size, "bytes");

      const parser = new PDFParse({
        data: req.file.buffer,
      });

      let pdfText = "";

      try {
        const result = await parser.getText();

        pdfText = result.text || "";

        if (!pdfText.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "No readable text was extracted. The PDF may be scanned or image-based.",
          });
        }
      } finally {
        await parser.destroy();
      }

      const {
        title,
        author,
        year,
        program,
      } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Research title is required.",
        });
      }

      const pdfBase64 = req.file.buffer.toString("base64");

      const interaction = await ai.interactions.create({
        model: "gemini-3.1-flash-lite",
        input: [
          {
            type: "text",
            text: `
            You are an AI assistant for an academic research library.

            Read the uploaded research paper carefully and create a clear academic summary.

            Provide the following:

            1. topic
            2. problem
            3. objectives
            4. methodology
            5. findings
            6. conclusion

            Do not invent information that is not present in the paper.

            If a section is not available in the paper, write:

            "Not specified in the document."

            Keep the summary clear, accurate, and suitable for students.
            `,
          },
          {
            type: "document",
            data: pdfBase64,
            mime_type: "application/pdf",
          },
        ],
      });

      const summary = interaction.output_text;

      const safeFileName = req.file.originalname
        .normalize("NFKD")
        .replace(/[^\w.-]/g, "-")
        .replace(/-+/g, "-");

      const fileName = `${Date.now()}-${safeFileName}`;

      const {
        error: storageError,
      } = await supabase.storage
        .from("research-pdfs")
        .upload(
          fileName,
          req.file.buffer,
          {
            contentType: "application/pdf",
            upsert: false,
          }
        );

      if (storageError) {
        console.error("SUPABASE STORAGE ERROR:", storageError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload PDF to Supabase.",
          error: storageError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("research-pdfs")
        .getPublicUrl(fileName);

      const pdfUrl = publicUrlData.publicUrl;

      const {
        data: research,
        error: databaseError,
      } = await supabase
        .from("summarized")
        .insert([
          {
            title,
            author,
            year: year ? Number(year) : null,
            program,
            pdf_url: pdfUrl,
            summary,
            content: pdfText,
          },
        ])
        .select()
        .single();

      if (databaseError) {
        console.error("SUPABASE DATABASE ERROR:", databaseError);

        return res.status(500).json({
          success: false,
          message:
            "PDF uploaded, but failed to save research information.",
          error: databaseError.message,
        });
      }

      console.log("Research saved successfully!");

      return res.status(201).json({
        success: true,
        message: "Research uploaded and summarized successfully.",
        research,
      });
    } catch (error) {
      console.error("PDF SUMMARY ERROR:", error);

      return res.status(500).json({
        success: false,
        message:
          error.message || "Failed to process research PDF.",
      });
    }
  }
);

// Handle upload and Multer errors
router.use((error, req, res, next) => {
  console.error("RESEARCH ROUTE ERROR:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "PDF is too large. Maximum size is 50 MB.",
      });
    }
  }

  if (error.message === "Only PDF files are allowed.") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed.",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
});

export default router;

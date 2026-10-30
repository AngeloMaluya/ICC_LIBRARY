
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Store uploaded PDFs temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new Error("Only PDF files are allowed.")
      );
    }

    cb(null, true);
  }
});

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Get research listings without downloading extracted PDF text
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
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
        ascending: false
      });

    if (error) {
      console.error("GET RESEARCH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch research.",
        error: error.message
      });
    }

    // Return only the information needed by the Library page
    return res.json(data);

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
});

// Get one complete research record, including extracted PDF text
router.get("/:id", async (req, res) => {
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
        message: "Research not found."
      });
    }

    // Return the complete record for future research viewing
    return res.json(data);

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
});

// Upload PDF, extract text, generate summary, and save research
router.post(
  "/summarize",
  upload.single("pdf"),
  async (req, res) => {
    try {
      // Check whether a PDF was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a PDF file."
        });
      }

      console.log("PDF received:", req.file.originalname);
      console.log("PDF size:", req.file.size, "bytes");

      // Extract text from the uploaded PDF
      console.log("Extracting PDF text...");
      console.log("PDF buffer size:", req.file.buffer.length);

      const parser = new PDFParse({
        data: req.file.buffer
      });

      let pdfText = "";

      try {
        console.log("Starting parser.getText()...");

        const result = await parser.getText();

        pdfText = result.text || "";

        console.log("PDF extraction completed.");
        console.log("Extracted PDF text length:", pdfText.length);

        if (!pdfText.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "No readable text was extracted. The PDF may be scanned or image-based."
          });
        }
      } finally {
        await parser.destroy();
      }

      console.log("Continuing to Gemini summarization...");

      // Get research information from the upload form
      const {
        title,
        author,
        year,
        program
      } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Research title is required."
        });
      }

      // Convert the uploaded PDF into Base64
      const pdfBase64 = req.file.buffer.toString("base64");

      // Send the PDF to Gemini for summarization
      console.log("Sending PDF to Gemini...");

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
            `
          },

          {
            type: "document",
            data: pdfBase64,
            mime_type: "application/pdf"
          }
        ]
      });

      const summary = interaction.output_text;

      console.log("Gemini summary received!");

      // Create a unique PDF filename
      const fileName = `${Date.now()}-${req.file.originalname}`
        .replace(/\s+/g, "-");

      // Check Supabase connection
      console.log("SUPABASE URL:", process.env.SUPABASE_URL);

      console.log(
        "SUPABASE SECRET KEY:",
        process.env.SUPABASE_SECRET_KEY
          ? "LOADED"
          : "NOT LOADED"
      );

      // Upload the original PDF to Supabase Storage
      console.log("Uploading PDF to Supabase Storage...");

      const {
        data: storageData,
        error: storageError
      } = await supabase.storage
        .from("research-pdfs")
        .upload(
          fileName,
          req.file.buffer,
          {
            contentType: "application/pdf",
            upsert: false
          }
        );

      if (storageError) {
        console.error("SUPABASE STORAGE ERROR:", storageError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload PDF to Supabase.",
          error: storageError.message
        });
      }

      console.log("PDF uploaded to Supabase!");

      // Get the public URL of the uploaded PDF
      const { data: publicUrlData } = supabase.storage
        .from("research-pdfs")
        .getPublicUrl(fileName);

      const pdfUrl = publicUrlData.publicUrl;

      console.log("PDF URL:", pdfUrl);

      // Save research information, summary, and extracted text
      console.log("Saving research to Supabase database...");

      const {
        data: research,
        error: databaseError
      } = await supabase
        .from("summarized")
        .insert([
          {
            title: title,
            author: author,
            year: year ? Number(year) : null,
            program: program,
            pdf_url: pdfUrl,

            // Store the Gemini-generated summary
            summary: summary,

            // Keep the extracted PDF text for future viewing and searching
            content: pdfText
          }
        ])
        .select()
        .single();

      if (databaseError) {
        console.error("SUPABASE DATABASE ERROR:", databaseError);

        return res.status(500).json({
          success: false,
          message:
            "PDF uploaded, but failed to save research information.",
          error: databaseError.message
        });
      }

      // Display upload success information
      console.log("Research saved successfully!");
      console.log("DATABASE RESULT:", research);
      console.log("PDF URL:", pdfUrl);
      console.log("PDF TEXT LENGTH:", pdfText.length);
      console.log("SUMMARY LENGTH:", summary?.length);

      // Return the uploaded research information
      return res.status(201).json({
        success: true,
        message: "Research uploaded and summarized successfully.",
        research: research
      });

    } catch (error) {
      console.error("PDF SUMMARY ERROR:");
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          error.message || "Failed to process research PDF."
      });
    }
  }
);

// Handle upload and Multer errors
router.use((error, req, res, next) => {
  console.error("RESEARCH ROUTE ERROR:", error);

  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "PDF is too large. Maximum size is 50 MB."
      });
    }
  }

  // Handle invalid file types
  if (error.message === "Only PDF files are allowed.") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed."
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    message: error.message || "Something went wrong."
  });
});

export default router;

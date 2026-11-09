import {
  verifyAuthenticatedToken,
  verifyAdminToken,
} from "../middleware/authMiddleware.js";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const MAX_PDF_SIZE = 50 * 1024 * 1024;
const MAX_POSTER_SIZE = 5 * 1024 * 1024;


const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    // Research PDF
    if (file.fieldname === "pdf") {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF research files are allowed."));
      }

      return cb(null, true);
    }

    // Research Poster
    if (file.fieldname === "poster") {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new Error("Only JPG, PNG, WebP, and PDF posters are allowed.")
        );
      }

      return cb(null, true);
    }

    return cb(new Error("Unexpected file field."));
  },
});

/* =========================================================
   GET ALL RESEARCH
========================================================= */

router.get("/", verifyAuthenticatedToken, async (req, res) => {
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
        poster_url,
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
      query = query.ilike(
        "program",
        program.trim()
      );
    }

    if (
      search &&
      typeof search === "string" &&
      search.trim()
    ) {
      const term = search
        .trim()
        .replace(/[%(),]/g, " ");

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

//admin test programs
// Temporary research listing for the admin Programs page
router.get("/admin-list", verifyAdminToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("summarized")
      .select(
        "id, title, author, year, program, summary, pdf_url, poster_url, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        message: "Failed to fetch research.",
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("ADMIN RESEARCH ERROR:", error);

    return res.status(500).json({
      message: "Server error.",
    });
  }
});

/* =========================================================
   GET SINGLE RESEARCH
========================================================= */

router.get("/:id", verifyAuthenticatedToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Fetching research ID:", id);

    const { data, error } = await supabase
      .from("summarized")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error(
        "GET SINGLE RESEARCH ERROR:",
        error
      );

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

/* =========================================================
   UPLOAD RESEARCH PDF + OPTIONAL POSTER
========================================================= */

router.post(
  "/summarize",
  verifyAdminToken,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "poster", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const pdfFile = req.files?.pdf?.[0];
      const posterFile = req.files?.poster?.[0];

      /* =================================================
         VALIDATE FILES AND RESEARCH INFORMATION
      ================================================= */

      if (!pdfFile) {
        return res.status(400).json({
          success: false,
          message: "Please upload a PDF file.",
        });
      }

      if (pdfFile.size > MAX_PDF_SIZE) {
        return res.status(400).json({
          success: false,
          message: "PDF must not exceed 50 MB.",
        });
      }

      if (
        posterFile &&
        posterFile.size > MAX_POSTER_SIZE
      ) {
        return res.status(400).json({
          success: false,
          message: "Poster must not exceed 5 MB.",
        });
      }

      const {
        title,
        author,
        year,
        program,
      } = req.body;

      if (
        !title?.trim() ||
        !author?.trim() ||
        !year ||
        !program?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please complete all research fields.",
        });
      }

      const numericYear = Number(year);

      if (
        !Number.isInteger(numericYear) ||
        numericYear < 2000 ||
        numericYear > 2100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid research year.",
        });
      }

      console.log(
        "PDF received:",
        pdfFile.originalname
      );

      console.log(
        "PDF size:",
        pdfFile.size,
        "bytes"
      );

      if (posterFile) {
        console.log(
          "Poster received:",
          posterFile.originalname
        );
      }

      /* =================================================
         EXTRACT PDF TEXT
      ================================================= */

      const parser = new PDFParse({
        data: pdfFile.buffer,
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

      /* =================================================
         GENERATE AI SUMMARY USING GEMINI
      ================================================= */

      const pdfBase64 =
        pdfFile.buffer.toString("base64");

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

      if (!summary?.trim()) {
        throw new Error(
          "Gemini did not return a research summary."
        );
      }

      /* =================================================
         UPLOAD PDF TO SUPABASE STORAGE
      ================================================= */

      const safeFileName = pdfFile.originalname
        .normalize("NFKD")
        .replace(/[^\w.-]/g, "-")
        .replace(/-+/g, "-");

      const pdfFileName =
        `${Date.now()}-${randomUUID()}-${safeFileName}`;

      const { error: storageError } =
        await supabase.storage
          .from("research-pdfs")
          .upload(
            pdfFileName,
            pdfFile.buffer,
            {
              contentType: "application/pdf",
              upsert: false,
            }
          );

      if (storageError) {
        console.error(
          "SUPABASE PDF STORAGE ERROR:",
          storageError
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to upload PDF to Supabase.",
          error: storageError.message,
        });
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("research-pdfs")
          .getPublicUrl(pdfFileName);

      const pdfUrl = publicUrlData.publicUrl;

      /* =================================================
         UPLOAD OPTIONAL POSTER TO SUPABASE STORAGE
      ================================================= */

      let posterUrl = null;
      let posterFileName = null;

      if (posterFile) {
        const extensionMap = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };

        const extension =
          extensionMap[posterFile.mimetype];

        posterFileName =
          `${Date.now()}-${randomUUID()}.${extension}`;

        const { error: posterError } =
          await supabase.storage
            .from("research-posters")
            .upload(
              posterFileName,
              posterFile.buffer,
              {
                contentType: posterFile.mimetype,
                upsert: false,
              }
            );

        if (posterError) {
          console.error(
            "SUPABASE POSTER STORAGE ERROR:",
            posterError
          );

          // Remove the PDF uploaded by this request.
          await supabase.storage
            .from("research-pdfs")
            .remove([pdfFileName]);

          return res.status(500).json({
            success: false,
            message:
              "Failed to upload research poster.",
            error: posterError.message,
          });
        }

        const { data: posterUrlData } =
          supabase.storage
            .from("research-posters")
            .getPublicUrl(posterFileName);

        posterUrl = posterUrlData.publicUrl;
      }

      /* =================================================
         SAVE RESEARCH TO SUPABASE DATABASE
      ================================================= */

      const {
        data: research,
        error: databaseError,
      } = await supabase
        .from("summarized")
        .insert([
          {
            title: title.trim(),
            author: author.trim(),
            year: numericYear,
            program: program.trim(),
            pdf_url: pdfUrl,
            poster_url: posterUrl,
            summary,
            content: pdfText,
          },
        ])
        .select()
        .single();

      if (databaseError) {
        console.error(
          "SUPABASE DATABASE ERROR:",
          databaseError
        );

        // Clean up uploaded files if database insert fails.
        await supabase.storage
          .from("research-pdfs")
          .remove([pdfFileName]);

        if (posterFileName) {
          await supabase.storage
            .from("research-posters")
            .remove([posterFileName]);
        }

        return res.status(500).json({
          success: false,
          message:
            "Failed to save research information.",
          error: databaseError.message,
        });
      }

      /* =================================================
         SUCCESS RESPONSE
      ================================================= */

      console.log(
        "Research saved successfully!"
      );

      return res.status(201).json({
        success: true,
        message:
          "Research uploaded and summarized successfully.",
        research,
      });

    } catch (error) {
      console.error(
        "PDF SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to process research PDF.",
      });
    }
  }
);

/* =========================================================
   HANDLE MULTER AND UPLOAD ERRORS
========================================================= */

router.use((error, req, res, next) => {
  console.error(
    "RESEARCH ROUTE ERROR:",
    error
  );

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded file is too large. PDF maximum is 50 MB; poster maximum is 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message === "Only PDF files are allowed." ||
    error.message ===
      "Only JPG, PNG, and WebP poster images are allowed." ||
    error.message === "Unexpected upload field."
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message:
      error.message ||
      "Something went wrong.",
  });
});

export default router;


import { generateEmbedding } from "../utils/embeddings.js";
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
   CATALOG CALL NUMBER GENERATOR
========================================================= */

// Remove an initial English article and extract the
// first three letters of the title.
const getTitleMark = (title) => {
  const cleaned = String(title || "")
    .trim()
    .replace(/^(the|an|a)\s+/i, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();

  if (cleaned.length < 3) {
    throw new Error(
      "The research title must contain at least three letters."
    );
  }

  return cleaned.slice(0, 3);
};

// Validate a Cutter number supplied according to
// the school's approved Cutter Table.
const validateCutterNumber = (cutterNumber) => {
  const cutter = String(cutterNumber || "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z][0-9]+$/.test(cutter)) {
    throw new Error(
      "Invalid Cutter number. Example: R433."
    );
  }

  return cutter;
};

// Generate a catalog call number.
// Example: THS R433lev 2025 c.1
const generateCatalogNumber = ({
  title,
  year,
  cutterNumber,
  copyNumber = 1,
}) => {
  const cutter = validateCutterNumber(cutterNumber);
  const titleMark = getTitleMark(title);
  const numericYear = Number(year);

  if (
    !Number.isInteger(numericYear) ||
    numericYear < 1800 ||
    numericYear > 2100
  ) {
    throw new Error("Invalid catalog publication year.");
  }

  if (
    !Number.isSafeInteger(copyNumber) ||
    copyNumber < 1
  ) {
    throw new Error("Invalid copy number.");
  }

  return `THS ${cutter}${titleMark} ${numericYear} c.${copyNumber}`;
};

/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const MAX_PDF_SIZE = 50 * 1024 * 1024;
const MAX_POSTER_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_PDF_SIZE,
  },

  fileFilter: (req, file, cb) => {
    if (file.fieldname === "pdf") {
      if (file.mimetype !== "application/pdf") {
        return cb(
          new Error("Only PDF research files are allowed.")
        );
      }

      return cb(null, true);
    }

    if (file.fieldname === "poster") {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            "Only JPG, PNG, WebP, and PDF posters are allowed."
          )
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

router.get(
  "/",
  verifyAuthenticatedToken,
  async (req, res) => {
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
          catalog_number,
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
  }
);

/* =========================================================
   ADMIN RESEARCH LIST
========================================================= */

router.get(
  "/admin-list",
  verifyAdminToken,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("summarized")
        .select(
          "id, title, author, year, program, summary, pdf_url, poster_url, created_at, catalog_number"
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("ADMIN RESEARCH ERROR:", error);

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
  }
);

/* =========================================================
   AI HYBRID SEARCH
========================================================= */

router.get(
  "/search",
  verifyAuthenticatedToken,
  async (req, res) => {
    try {
      const search = String(req.query.q || "").trim();
      const program = String(
        req.query.program || ""
      ).trim();

      if (!search) {
        return res.status(400).json({
          success: false,
          message: "Please enter a search query.",
        });
      }

      if (search.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Search query is too long.",
        });
      }

      const queryEmbedding = await generateEmbedding(
        search,
        "RETRIEVAL_QUERY"
      );

      const { data, error } = await supabase.rpc(
        "hybrid_search_research",
        {
          query_text: search,
          query_embedding: queryEmbedding,
          filter_program: program || null,
          match_count: 50,
        }
      );

      if (error) {
        throw error;
      }

      const results = (data || []).map(
        (research) => ({
          id: research.id,
          title: research.title,
          author: research.author,
          year: research.year,
          program: research.program,
          summary: research.summary,
          pdf_url: research.pdf_url,
          poster_url: research.poster_url,
          catalog_number:
            research.catalog_number ?? null,
          created_at: research.created_at,
        })
      );

      return res.status(200).json({
        success: true,
        results,
      });
    } catch (error) {
      console.error("HYBRID SEARCH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "AI search failed.",
      });
    }
  }
);

/* =========================================================
   MOST VIEWED RESEARCH
========================================================= */

router.get(
  "/most-viewed",
  verifyAuthenticatedToken,
  async (req, res) => {
    try {
      const {
        data: rankings,
        error: rankingError,
      } = await supabase.rpc(
        "most_viewed_research",
        {
          match_count: 5,
        }
      );

      if (rankingError) {
        throw rankingError;
      }

      if (!rankings?.length) {
        return res.json({
          success: true,
          researches: [],
        });
      }

      const ids = rankings.map(
        (item) => item.research_id
      );

      const {
        data: researches,
        error: researchError,
      } = await supabase
        .from("summarized")
        .select(
          "id, title, author, year, program, poster_url"
        )
        .in("id", ids);

      if (researchError) {
        throw researchError;
      }

      const researchMap = new Map(
        (researches || []).map((item) => [
          String(item.id),
          item,
        ])
      );

      const results = rankings
        .map((ranking) => {
          const research = researchMap.get(
            String(ranking.research_id)
          );

          return research
            ? {
                ...research,
                view_count: Number(
                  ranking.view_count
                ),
              }
            : null;
        })
        .filter(Boolean);

      return res.json({
        success: true,
        researches: results,
      });
    } catch (error) {
      console.error("MOST VIEWED ERROR:", error);

      return res.status(500).json({
        success: false,
        message:
          "Unable to load most viewed research.",
      });
    }
  }
);

/* =========================================================
   RELATED RESEARCH
========================================================= */

router.get(
  "/:id/related",
  verifyAuthenticatedToken,
  async (req, res) => {
    try {
      const researchId = Number(req.params.id);

      if (
        !Number.isSafeInteger(researchId) ||
        researchId < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid research ID.",
        });
      }

      const { data, error } = await supabase.rpc(
        "related_research",
        {
          active_research_id: researchId,
          match_count: 5,
          minimum_similarity: 0.70,
        }
      );

      if (error) {
        throw error;
      }

      return res.json({
        success: true,
        recommendations: data || [],
      });
    } catch (error) {
      console.error("RELATED RESEARCH ERROR:", error);

      return res.status(500).json({
        success: false,
        message:
          "Unable to load related research.",
      });
    }
  }
);

/* =========================================================
   GET SINGLE RESEARCH
========================================================= */

router.get(
  "/:id",
  verifyAuthenticatedToken,
  async (req, res) => {
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
  }
);

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

      /* =============================================
         VALIDATE FILES AND RESEARCH INFORMATION
      ============================================= */

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
        educationLevel,
        cutterNumber,
      } = req.body;

      if (
        !title?.trim() ||
        !author?.trim() ||
        !year ||
        !program?.trim() ||
        !educationLevel
      ) {
        return res.status(400).json({
          success: false,
          message: "Please complete all research fields.",
        });
      }

      //validate educlevel
      const COLLEGE_PROGRAM_CODES = [
        "BSCS",
        "BSBA",
        "BEED",
        "BSED",
        "BSTM",
        "BSCrim",
      ];

      const SHS_STRAND_CODES = [
        "STEM",
        "ABM",
        "HUMSS",
        "GAS",
        "HE",
        "ICT",
      ];

      const validPrograms =
        educationLevel === "college"
          ? COLLEGE_PROGRAM_CODES
          : educationLevel === "shs"
            ? SHS_STRAND_CODES
            : [];

      if (!validPrograms.includes(program)) {
        return res.status(400).json({
          success: false,
          message: "Invalid education level or program/strand.",
        });
      }



       //VALIDATE RESEARCH YEAR

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

      /* =============================================
         GENERATE CATALOG CALL NUMBER
      ============================================= */

      let generatedCatalogNumber = null;

      // The Cutter number is optional until the
      // approved Cutter Table is integrated.
      if (String(cutterNumber || "").trim()) {
        try {
          generatedCatalogNumber =
            generateCatalogNumber({
              title: title.trim(),
              year: numericYear,
              cutterNumber,
              copyNumber: 1,
            });
        } catch (catalogError) {
          return res.status(400).json({
            success: false,
            message: catalogError.message,
          });
        }

        // Reject an existing call number.
        // The database unique index also protects
        // against simultaneous duplicate inserts.
        const {
          data: existingCatalog,
          error: catalogCheckError,
        } = await supabase
          .from("summarized")
          .select("id")
          .eq(
            "catalog_number",
            generatedCatalogNumber
          )
          .limit(1);

        if (catalogCheckError) {
          throw catalogCheckError;
        }

        if (existingCatalog?.length) {
          return res.status(409).json({
            success: false,
            message:
              "This catalog call number already exists. Please review the Cutter number and catalog metadata.",
          });
        }
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

      /* =============================================
         EXTRACT PDF TEXT
      ============================================= */

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

      /* =============================================
         GENERATE AI SUMMARY USING GEMINI
      ============================================= */

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

      /* =============================================
         UPLOAD PDF TO SUPABASE STORAGE
      ============================================= */

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

      /* =============================================
         UPLOAD OPTIONAL POSTER
      ============================================= */

      let posterUrl = null;
      let posterFileName = null;

      if (posterFile) {
        const extensionMap = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "application/pdf": "pdf",
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

      /* =============================================
         SAVE RESEARCH TO SUPABASE DATABASE
      ============================================= */

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
            education_level: educationLevel,
            pdf_url: pdfUrl,
            poster_url: posterUrl,
            summary,
            content: pdfText,
            catalog_number: generatedCatalogNumber,
          },
        ])
        .select()
        .single();

      if (databaseError) {
        console.error(
          "SUPABASE DATABASE ERROR:",
          databaseError
        );

        // Clean up uploaded files if insert fails.
        await supabase.storage
          .from("research-pdfs")
          .remove([pdfFileName]);

        if (posterFileName) {
          await supabase.storage
            .from("research-posters")
            .remove([posterFileName]);
        }

        return res.status(
          databaseError.code === "23505" ? 409 : 500
        ).json({
          success: false,
          message:
            databaseError.code === "23505"
              ? "A duplicate catalog number was detected."
              : "Failed to save research information.",
          error: databaseError.message,
        });
      }

      /* =============================================
         GENERATE SEMANTIC SEARCH EMBEDDING
      ============================================= */

      try {
        const searchableText = `
          Title: ${research.title}
          Author: ${research.author}
          Program: ${research.program}
          Summary: ${research.summary}
        `;

        const embedding = await generateEmbedding(
          searchableText,
          "RETRIEVAL_DOCUMENT"
        );

        const { error: embeddingError } =
          await supabase
            .from("summarized")
            .update({ embedding })
            .eq("id", research.id);

        if (embeddingError) {
          throw embeddingError;
        }

        console.log(
          "Research embedding saved successfully:",
          research.id
        );
      } catch (embeddingError) {
        console.error(
          "RESEARCH EMBEDDING ERROR:",
          embeddingError
        );
      }

      /* =============================================
         SUCCESS RESPONSE
      ============================================= */

      console.log(
        "Research saved successfully!",
        research.id
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

  const allowedUploadErrors = [
    "Only PDF research files are allowed.",
    "Only JPG, PNG, WebP, and PDF posters are allowed.",
    "Unexpected file field.",
  ];

  if (allowedUploadErrors.includes(error.message)) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message:
      error.message || "Something went wrong.",
  });
});

export default router;

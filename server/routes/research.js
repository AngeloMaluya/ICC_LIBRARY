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

// ========================================
// MULTER
// ========================================

// Store the uploaded PDF temporarily in memory.
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
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

// ========================================
// GET ALL RESEARCH
// ========================================

router.get("/", async (req, res) => {

  try {

    const {
      data,
      error
    } = await supabase
      .from("summarized")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error(
        "GET RESEARCH ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch research",

        error:
          error.message

      });

    }

    res.json(data);

  } catch (error) {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Server error"

    });

  }

});

// ========================================
// GET ONE RESEARCH
// ========================================

router.get("/:id", async (req, res) => {

  try {

    const {
      id
    } = req.params;

    console.log(
      "Fetching research ID:",
      id
    );

    const {
      data,
      error
    } = await supabase
      .from("summarized")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {

      console.error(
        "GET SINGLE RESEARCH ERROR:",
        error
      );

      return res.status(404).json({

        success: false,

        message:
          "Research not found",

        error:
          error.message

      });

    }

    res.json(data);

  } catch (error) {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Server error"

    });

  }

});

// ========================================
// GEMINI
// ========================================

const ai = new GoogleGenAI({

  apiKey:
    process.env.GEMINI_API_KEY

});

// ========================================
// UPLOAD PDF + SUMMARIZE
// ========================================

router.post(

  "/summarize",

  upload.single("pdf"),

  async (req, res) => {

    try {

      // ========================================
      // CHECK PDF
      // ========================================

      if (!req.file) {

        return res.status(400).json({

          success: false,

          message:
            "Please upload a PDF file."

        });

      }

      console.log(
        "PDF received:",
        req.file.originalname
      );

      console.log(
        "PDF size:",
        req.file.size,
        "bytes"
      );

      // ========================================
      // EXTRACT TEXT FROM PDF
      // ========================================

      console.log(
        "Extracting PDF text..."
      );

     const parser = new PDFParse({
        data: req.file.buffer
      });

      const result = await parser.getText();

      const pdfText = result.text;

      await parser.destroy();

      console.log(
        "Extracted PDF text length:",
        pdfText.length
      );

      // ========================================
      // GET FORM DATA
      // ========================================

      const {
        title,
        author,
        year,
        program
      } = req.body;

      if (!title) {

        return res.status(400).json({

          success: false,

          message:
            "Research title is required."

        });

      }

      // ========================================
      // CONVERT PDF TO BASE64
      // ========================================

      const pdfBase64 =
        req.file.buffer.toString(
          "base64"
        );

      // ========================================
      // SEND PDF TO GEMINI
      // ========================================

      console.log(
        "Sending PDF to Gemini..."
      );

      const interaction =
        await ai.interactions.create({

          model:
            "gemini-3.1-flash-lite",

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

              data:
                pdfBase64,

              mime_type:
                "application/pdf"

            }

          ]

        });

      const summary =
        interaction.output_text;

      console.log(
        "Gemini summary received!"
      );

      // ========================================
      // CREATE UNIQUE PDF FILE NAME
      // ========================================

      const fileName =
        `${Date.now()}-${req.file.originalname}`
          .replace(/\s+/g, "-");

      // ========================================
      // CHECK SUPABASE CONNECTION
      // ========================================

      console.log(
        "SUPABASE URL:",
        process.env.SUPABASE_URL
      );

      console.log(
        "SUPABASE SECRET KEY:",
        process.env.SUPABASE_SECRET_KEY
          ? "LOADED"
          : "NOT LOADED"
      );

      // ========================================
      // UPLOAD PDF TO SUPABASE STORAGE
      // ========================================

      console.log(
        "Uploading PDF to Supabase Storage..."
      );

      const {
        data: storageData,
        error: storageError
      } = await supabase.storage
        .from("research-pdfs")
        .upload(
          fileName,
          req.file.buffer,
          {
            contentType:
              "application/pdf",

            upsert:
              false
          }
        );

      if (storageError) {

        console.error(
          "SUPABASE STORAGE ERROR:",
          storageError
        );

        return res.status(500).json({

          success: false,

          message:
            "Failed to upload PDF to Supabase.",

          error:
            storageError.message

        });

      }

      console.log(
        "PDF uploaded to Supabase!"
      );

      // ========================================
      // GET PUBLIC PDF URL
      // ========================================

      const {
        data: publicUrlData
      } = supabase.storage
        .from("research-pdfs")
        .getPublicUrl(
          fileName
        );

      const pdfUrl =
        publicUrlData.publicUrl;

      console.log(
        "PDF URL:",
        pdfUrl
      );

      // ========================================
      // SAVE RESEARCH TO DATABASE
      // ========================================

      console.log(
        "Saving research to Supabase database..."
      );

      const {
        data: research,
        error: databaseError
      } = await supabase
        .from("summarized")
        .insert([

          {

            title:
              title,

            author:
              author,

            year:
              year
                ? Number(year)
                : null,

            program:
              program,

            pdf_url:
              pdfUrl,

            // Gemini-generated summary
            summary:
              summary,

            // FULL TEXT EXTRACTED FROM PDF
            // This will be used by the search engine
            content:
              pdfText

          }

        ])
        .select()
        .single();

      if (databaseError) {

        console.error(
          "SUPABASE DATABASE ERROR:",
          databaseError
        );

        return res.status(500).json({

          success: false,

          message:
            "PDF uploaded, but failed to save research information.",

          error:
            databaseError.message

        });

      }

      // ========================================
      // SUCCESS LOGS
      // ========================================

      console.log(
        "Research saved successfully!"
      );

      console.log(
        "DATABASE RESULT:"
      );

      console.log(
        research
      );

      console.log(
        "PDF URL:"
      );

      console.log(
        pdfUrl
      );

      console.log(
        "PDF TEXT LENGTH:"
      );

      console.log(
        pdfText.length
      );

      console.log(
        "SUMMARY LENGTH:"
      );

      console.log(
        summary?.length
      );

      // ========================================
      // RETURN EVERYTHING TO REACT
      // ========================================

      return res.status(201).json({

        success: true,

        message:
          "Research uploaded and summarized successfully.",

        research:
          research

      });

    } catch (error) {

      console.error(
        "PDF SUMMARY ERROR:"
      );

      console.error(
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to process research PDF."

      });

    }

  }

);

// ========================================
// ERROR HANDLER
// ========================================

router.use(

  (error, req, res, next) => {

    console.error(
      "RESEARCH ROUTE ERROR:",
      error
    );

    // ========================================
    // MULTER ERRORS
    // ========================================

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "PDF is too large. Maximum size is 50 MB."

        });

      }

    }

    // ========================================
    // INVALID FILE TYPE
    // ========================================

    if (
      error.message ===
      "Only PDF files are allowed."
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Only PDF files are allowed."

      });

    }

    // ========================================
    // GENERAL ERROR
    // ========================================

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Something went wrong."

    });

  }

);

export default router;
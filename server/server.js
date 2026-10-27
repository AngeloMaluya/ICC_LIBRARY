import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

import researchRoutes from "./routes/research.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

console.log(
  "SUPABASE_URL:",
  process.env.SUPABASE_URL
);

console.log(
  "SUPABASE_SECRET_KEY:",
  process.env.SUPABASE_SECRET_KEY
    ? "LOADED"
    : "NOT LOADED"
);

console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY
    ? "LOADED"
    : "NOT LOADED"
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://icc-library.vercel.app",
    ],
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.options(/.*/, cors());

app.use(express.json());

app.use(
  "/api/research",
  researchRoutes
);

app.use(
  "/api",
  authRoutes
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    message: "ICC Library backend is running!",
  });
});

app.get("/api/test-gemini", async (req, res) => {
  try {
    console.log("Sending request to Gemini...");

    const interaction = await ai.interactions.create({
      model: "gemini-3.1-flash-lite",
      input:
        "Explain what a research paper is in one sentence.",
    });

    console.log("Gemini response received!");

    return res.json({
      success: true,
      response: interaction.output_text,
    });
  } catch (error) {
    console.error("GEMINI ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/test-db", async (req, res) => {
  try {
    console.log("Testing Supabase...");

    const {
      data,
      error,
    } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      console.error(
        "SUPABASE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Database connection failed.",
        error: error.message,
      });
    }

    console.log(
      "Supabase connection successful!"
    );

    return res.json({
      success: true,
      message: "Supabase connection is working!",
      data,
    });
  } catch (error) {
    console.error(
      "DATABASE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );

  console.log(
    `Register endpoint: http://localhost:${PORT}/api/register`
  );
});
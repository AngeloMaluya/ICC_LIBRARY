import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import researchRoutes from "./routes/research.js";

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

app.post("/api/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      course,
      year,
      email,
      password,
    } = req.body;

    console.log(
      "Register request received:",
      email
    );

    if (
      !firstName ||
      !lastName ||
      !course ||
      !year ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const {
      data: existingUser,
      error: checkError,
    } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error(
        "USER CHECK ERROR:",
        checkError
      );

      return res.status(500).json({
        success: false,
        message: "Failed to check existing account.",
        error: checkError.message,
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    const {
      data: newUser,
      error: insertError,
    } = await supabase
      .from("users")
      .insert([
        {
          f_name: firstName,
          l_name: lastName,
          course: course,
          year: year,
          email: email,
          password: password,
        },
      ])
      .select(
        "id, email, f_name, l_name, course, year"
      )
      .single();

    if (insertError) {
      console.error(
        "REGISTER DATABASE ERROR:",
        insertError
      );

      return res.status(500).json({
        success: false,
        message: "Failed to create account.",
        error: insertError.message,
      });
    }

    console.log(
      "User registered successfully:",
      newUser.email
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",

      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.f_name,
        lastName: newUser.l_name,
        course: newUser.course,
        year: newUser.year,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
});

app.get("/api/user/:email", async (req, res) => {
  try {
    const { email } = req.params;

    console.log(
      "Checking Google account:",
      email
    );

    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select(
        "id, email, f_name, l_name, course, year"
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error(
        "SUPABASE USER CHECK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Database error.",
        error: error.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: "Account not found.",
      });
    }

    return res.json({
      success: true,
      exists: true,

      user: {
        id: user.id,
        email: user.email,
        firstName: user.f_name,
        lastName: user.l_name,
        course: user.course,
        year: user.year,
      },
    });
  } catch (error) {
    console.error(
      "GOOGLE USER CHECK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
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
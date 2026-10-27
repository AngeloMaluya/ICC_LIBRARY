import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

router.post("/register", async (req, res) => {
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

router.get("/user/:email", async (req, res) => {
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

export default router;
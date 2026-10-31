import bcrypt from "bcryptjs";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Registers a new user and securely hashes their password before saving it
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      course,
      year,
      email,
      password,
      profilePicture,
    } = req.body;

    console.log("Register request received:", email);

    // Validate all required registration fields
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

    // Validate password type and length
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    // Check if the email is already registered
    const {
      data: existingUser,
      error: checkError,
    } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("USER CHECK ERROR:", checkError);

      return res.status(500).json({
        success: false,
        message: "Failed to check existing account.",
      });
    }

    // Prevent duplicate account registration
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    // Hash the password using bcrypt with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("BCRYPT HASH GENERATED:", hashedPassword.startsWith("$2"));
    console.log("HASH LENGTH:", hashedPassword.length);

    // Insert the new user into the Supabase users table
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
          password: hashedPassword,
          profile_picture: profilePicture || null,
        },
      ])
      .select("id, email, f_name, l_name, course, year, profile_picture")
      .single();

    if (insertError) {
      console.error("REGISTER DATABASE ERROR:", insertError);

      return res.status(500).json({
        success: false,
        message: "Failed to create account.",
      });
    }

    console.log("User registered successfully:", newUser.email);

    // Return the newly created user's information without exposing the password
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
        profilePicture: newUser.profile_picture,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// Authenticates a user by comparing the entered password with the stored bcrypt hash
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate the login credentials
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find the user account using the provided email
    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select("id, email, f_name, l_name, course, year, password, profile_picture")
      .eq("email", email.trim())
      .maybeSingle();

    if (error) {
      console.error("LOGIN DATABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Database error.",
      });
    }

    // Reject login if the account does not exist
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check whether the stored password is a bcrypt hash
    const isBcryptHash =
      typeof user.password === "string" &&
      /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password);

    // Reject accounts whose passwords have not been converted to bcrypt
    if (!isBcryptHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please reset your password.",
      });
    }

    // Compare the entered password with the stored bcrypt hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    // Reject login if the password does not match
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Return authenticated user information without exposing the password hash
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.f_name,
        lastName: user.l_name,
        course: user.course,
        year: user.year,
        profilePicture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// Checks whether a Google account's email is already registered in the database
router.get("/user/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Validate the email parameter
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    console.log("Checking Google account:", email);

    // Find the registered user using their Google email
    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select("id, email, f_name, l_name, course, year, profile_picture")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("SUPABASE USER CHECK ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Database error.",
      });
    }

    // Return a not-found response if the Google account is not registered
    if (!user) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: "Account not found.",
      });
    }

    // Return the existing user's information without exposing sensitive data
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
        profilePicture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("GOOGLE USER CHECK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

export default router;
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

app.use(express.json());


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.get("/", (req, res) => {

  res.json({
    message: "THESIS backend is running!"
  });

});

app.post("/api/register", async (req, res) => {

  try {

    const {
      firstName,
      lastName,
      course,
      year,
      email,
      password
    } = req.body;

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
        message: "Please fill in all fields."
      });

    }

    const {
      data: existingUser,
      error: existingError
    } = await supabase

      .from("users")

      .select("id")

      .eq("email", email)

      .maybeSingle();


    if (existingError) {

      console.error(existingError);

      return res.status(500).json({
        success: false,
        message: "Database error."
      });

    }


    if (existingUser) {

      return res.status(409).json({
        success: false,
        message: "Email is already registered."
      });

    }

    const hashedPassword =
      await bcrypt.hash(password, 10);


    const {
      data,
      error
    } = await supabase

      .from("users")

      .insert([
        {
          email: email,
          password: hashedPassword,
          f_name: firstName,
          l_name: lastName,
          course: course,
          year: Number(year)
        }
      ])

      .select(
        "id, email, f_name, l_name, course, year"
      )

      .single();


    if (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to create account."
      });

    }


    return res.status(201).json({

      success: true,

      message:
        "Account created successfully!",

      user: {

        id: data.id,

        email: data.email,

        firstName: data.f_name,

        lastName: data.l_name,

        course: data.course,

        year: data.year

      }

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      success: false,

      message: "Server error."

    });

  }

});


app.post("/api/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Email and password are required."

      });

    }


    const {
      data: user,
      error
    } = await supabase

      .from("users")

      .select("*")

      .eq("email", email)

      .maybeSingle();


    if (error) {

      console.error(error);

      return res.status(500).json({

        success: false,

        message: "Database error."

      });

    }


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password."

      });

    }


    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password."

      });

    }


    const safeUser = {

      id: user.id,

      email: user.email,

      firstName: user.f_name,

      lastName: user.l_name,

      course: user.course,

      year: user.year

    };


    return res.json({

      success: true,

      message: "Login successful!",

      user: safeUser

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      success: false,

      message: "Server error."

    });

  }

});


app.get("/api/user/:email", async (req, res) => {

  try {

    const {
      email
    } = req.params;


    console.log(
      "Checking Google account:",
      email
    );


    const {
      data: user,
      error
    } = await supabase

      .from("users")

      .select(
        "id, email, f_name, l_name, course, year"
      )

      .eq("email", email)

      .maybeSingle();


    if (error) {

      console.error(
        "Supabase error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Database error."

      });

    }

    if (!user) {

      return res.status(404).json({

        success: false,

        exists: false,

        message:
          "Account not found."

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

        year: user.year

      }

    });

  } catch (error) {

    console.error(
      "Google account check error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Server error."

    });

  }

});

app.get(
  "/api/users/:id",
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const {
        data,
        error
      } = await supabase

        .from("users")

        .select(
          "id, email, f_name, l_name, course, year"
        )

        .eq("id", id)

        .single();


      if (error) {

        return res.status(404).json({

          success: false,

          message:
            "User not found."

        });

      }


      res.json({

        success: true,

        user: {

          id: data.id,

          email: data.email,

          firstName: data.f_name,

          lastName: data.l_name,

          course: data.course,

          year: data.year

        }

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Server error."

      });

    }

  }
);

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Backend running on port ${PORT}`
    );
  }
);
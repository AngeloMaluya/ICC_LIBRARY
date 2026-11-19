
import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

router.use(verifyAdminToken);

const posterTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
 
const uploadPoster = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!posterTypes[file.mimetype]) {
      return cb(new Error("Invalid poster file type."));
    }
    cb(null, true);
  },
}).single("poster");

// GET /api/accession
router.get("/", async (req, res) => {
  try {
    const records = [];
    const pageSize = 500;

    for (let start = 0; ; start += pageSize) {
      const { data, error } = await supabase
        .from("summarized")
        .select(`
          id,
          accession_number,
          title,
          author,
          year,
          poster_url
        `)
        .order("id", { ascending: true })
        .range(start, start + pageSize - 1);

      if (error) throw error;

      records.push(...(data || []));

      if ((data || []).length < pageSize) break;
    }

    return res.json({ success: true, records });
  } catch (error) {
    console.error("ACCESSION LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load accession.",
    });
  }
});

// PATCH /api/accession/:id
router.patch("/:id", (req, res) => {
  uploadPoster(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid research ID.",
        });
      }

      const { data: existing, error: lookupError } =
        await supabase
          .from("summarized")
          .select("id")
          .eq("id", id)
          .maybeSingle();

      if (lookupError) throw lookupError;

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Research record not found.",
        });
      }

      const title = String(req.body.title || "").trim();
      const author = String(req.body.author || "").trim();
      const accessionNumber = String(
        req.body.accession_number || ""
      ).trim();
      const year = Number(req.body.year);
      const educationLevel = String(
    req.body.education_level || ""
    ).trim().toLowerCase();

    if (
    !title ||
    !author ||
    !accessionNumber ||
    !["college", "shs"].includes(educationLevel) ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
    ){
        return res.status(400).json({
          success: false,
          message: "Please provide valid accession number.",
        });
      }

      const { data: duplicates, error: duplicateError } =
        await supabase
          .from("summarized")
          .select("id, accession_number")
          .or(
            `accession_number.eq.${JSON.stringify(accessionNumber)}`
          )
          .neq("id", id);

      if (duplicateError) throw duplicateError;

      if (
        (duplicates || []).some(
          (row) =>
            row.accession_number === accessionNumber 
        )
      ) {
        return res.status(409).json({
          success: false,
          message: "Accession number or call number already exists.",
        });
      }

    const updates = {
        title,
        author,
        accession_number: accessionNumber,
        education_level: educationLevel,
        year,
    };

      let uploadedPosterPath = null;

      if (req.file) {
        const extension = posterTypes[req.file.mimetype];

        uploadedPosterPath =
          `${Date.now()}-${randomUUID()}.${extension}`;

        const { error: storageError } =
          await supabase.storage
            .from("research-posters")
            .upload(uploadedPosterPath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: false,
            });

        if (storageError) throw storageError;

        const { data: urlData } =
          supabase.storage
            .from("research-posters")
            .getPublicUrl(uploadedPosterPath);

        updates.poster_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("summarized")
        .update(updates)
        .eq("id", id)
        .select(`
        id,
        accession_number,
        title,
        author,
        year,
        education_level,
        poster_url
        `)
        .single();

      if (error) {
        if (uploadedPosterPath) {
          await supabase.storage
            .from("research-posters")
            .remove([uploadedPosterPath]);
        }
        throw error;
      }

      return res.json({
        success: true,
        message: "Accession number record updated successfully.",
        record: data,
      });
    } catch (error) {
      console.error("ACCESSION NUMBER UPDATE ERROR:", error);

      return res.status(
        error.code === "23505" ? 409 : 500
      ).json({
        success: false,
        message:
          error.code === "23505"
            ? "Accession number or call number already exists."
            : "Failed to update Accession Number record.",
      });
    }
  });
});

export default router;

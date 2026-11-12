
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "../utils/embeddings.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function backfillEmbeddings() {
  console.log("Starting research embedding backfill...");

  const batchSize = 20;
  let processed = 0;

  while (true) {
    const { data: researches, error } = await supabase
      .from("summarized")
      .select("id, title, author, program, summary")
      .is("embedding", null)
      .order("id", { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error("Failed to fetch research:", error);
      break;
    }

    if (!researches || researches.length === 0) {
      console.log("All research embeddings are complete!");
      break;
    }

    let batchSuccesses = 0;

    for (const research of researches) {
      try {
        const searchableText = `
          Title: ${research.title || ""}
          Author: ${research.author || ""}
          Program: ${research.program || ""}
          Summary: ${research.summary || ""}
        `;

        const embedding = await generateEmbedding(
          searchableText,
          "RETRIEVAL_DOCUMENT"
        );

        const { error: updateError } = await supabase
          .from("summarized")
          .update({ embedding })
          .eq("id", research.id);

        if (updateError) throw updateError;

        processed++;
        batchSuccesses++;

        console.log(
          `Embedded research ID ${research.id}: ${research.title}`
        );

      } catch (error) {
        console.error(
          `Failed research ID ${research.id}:`,
          error.message
        );
      }
    }

    // Stop if a batch made no progress.
    if (batchSuccesses === 0) {
      console.log(
        "No progress in this batch. Check the errors and rerun."
      );
      break;
    }
  }

  console.log(`Backfill finished. Updated: ${processed}`);
}

backfillEmbeddings().catch(console.error);

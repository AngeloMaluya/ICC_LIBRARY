import "dotenv/config";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateCatalogNumber } from "../utils/cataloggenerator.js";

const apply = process.argv.includes("--apply");
const allowExpansion = process.argv.includes("--expand");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const table = "summarized";
const pageSize = 500;

async function loadAll() {
  const all = [];
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase.from(table)
      .select("id,title,author,year,catalog_number")
      .order("id", { ascending: true }).range(start, start + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) return all;
  }
}

async function update(id, catalog_number, expected) {
  let q = supabase.from(table).update({ catalog_number }).eq("id", id);
  q = expected === null ? q.is("catalog_number", null) : q.eq("catalog_number", expected);
  const { data, error } = await q.select("id");
  if (error) throw error;
  if (data.length !== 1) throw new Error(`ID ${id}: value changed concurrently; update aborted`);
}

async function main() {
  const rows = await loadAll();
  const used = new Set();
  const plan = [];
  const conflicts = [];
  for (const row of rows) {
    try {
      let candidate;
      let found = false;
      const attempts = allowExpansion ? 12 : 1;
      for (let digits = 0; digits < attempts; digits++) {
        try {
          candidate = generateCatalogNumber({ ...row, expansionDigits: digits });
        } catch (err) {
          if (digits === 0) throw err;
          break;
        }
        if (!used.has(candidate)) { found = true; break; }
      }
      if (!found) {
        conflicts.push(`ID ${row.id}: duplicate ${candidate}; needs manual cataloging`);
        continue;
      }
      used.add(candidate);
      plan.push({ id: row.id, old: row.catalog_number, next: candidate });
    } catch (err) {
      conflicts.push(`ID ${row.id}: ${err.message}`);
    }
  }

  // All rows are included in the plan; refusing to apply if even one cannot be cataloged
  // avoids conflicting with numbers retained on unchanged records.
  for (const item of plan) console.log(`ID ${item.id}: ${item.old ?? "NULL"} -> ${item.next}`);
  conflicts.forEach(item => console.error("CONFLICT:", item));
  console.log(`Records: ${rows.length}; planned: ${plan.length}; conflicts: ${conflicts.length}`);
  if (conflicts.length || plan.length !== rows.length) {
    console.error("No updates performed. Resolve conflicts, then preview again.");
    process.exitCode = 1;
    return;
  }
  if (!apply) {
    console.log("PREVIEW ONLY. Run with --apply to update. --expand enables surname-based extra digits.");
    return;
  }

  // Snapshot first, then use unique staging values so old catalog numbers cannot
  // collide with new catalog numbers during migration.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `catalog-backup-${stamp}.json`;
  fs.writeFileSync(backup, JSON.stringify(rows, null, 2));
  console.log(`Backup written to ${backup}`);
  const changing = plan.filter(p => p.old !== p.next);
  const staged = [];
  try {
    for (const item of changing) {
      const temp = `__MIGRATING_${stamp}_${item.id}__`;
      await update(item.id, temp, item.old);
      staged.push({ ...item, temp });
    }
    for (const item of staged) {
      await update(item.id, item.next, item.temp);
      console.log(`UPDATED ID ${item.id}`);
    }
    console.log(`Completed: ${staged.length} updated; ${plan.length - staged.length} unchanged`);
  } catch (err) {
    console.error("MIGRATION STOPPED:", err.message);
    console.error(`IMPORTANT: Some records may contain __MIGRATING_ placeholders. Restore values using ${backup} after inspecting current data. Do not rerun blindly.`);
    process.exitCode = 1;
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });

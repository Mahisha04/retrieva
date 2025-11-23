import { createClient } from "@supabase/supabase-js";

// Backfill script: normalize `type` column from existing `status` or null values.
// Run with: node scripts/backfill-types.js

const SUPABASE_URL = "https://fcihpclldwuckzfwohkf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  try {
    console.log("Fetching rows with missing type...");
    const { data: rows, error } = await supabase
      .from("items")
      .select("id, status, type")
      .is("type", null)
      .limit(1000);

    if (error) throw error;

    console.log(`Found ${rows.length} rows to inspect`);

    for (const row of rows) {
      const raw = (row.status || "").toString().toLowerCase();
      let normalized = null;
      if (raw === "lost" || raw === "l") normalized = "Lost";
      if (raw === "found" || raw === "f") normalized = "Found";

      if (!normalized) continue; // skip rows we can't infer

      const { error: updErr } = await supabase
        .from("items")
        .update({ type: normalized })
        .eq("id", row.id);

      if (updErr) console.error("Update error for id", row.id, updErr);
      else console.log("Updated id", row.id, "->", normalized);
    }

    console.log("Backfill complete.");
    process.exit(0);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
}

run();

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Reuse the same Supabase credentials as server.js
const SUPABASE_URL = 'https://fcihpclldwuckzfwohkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function looksLikeBcryptHash(s) {
  if (!s || typeof s !== 'string') return false;
  return s.startsWith('$2a$') || s.startsWith('$2b$') || s.startsWith('$2y$') || s.startsWith('$2x$');
}

async function run() {
  console.log('Starting backfill: hashing legacy plaintext security_answer values');

  const { data, error } = await supabase.from('items').select('id, security_answer');
  if (error) {
    console.error('Failed to fetch items:', error);
    process.exit(1);
  }

  const rows = data || [];
  const toProcess = rows.filter(r => r.security_answer !== null && r.security_answer !== undefined && !looksLikeBcryptHash(r.security_answer));

  console.log(`Found ${rows.length} items total, ${toProcess.length} items to backfill.`);

  let success = 0;
  let failed = 0;

  for (const row of toProcess) {
    try {
      const raw = String(row.security_answer || '').trim();
      const normalized = raw.toLowerCase();
      const hashed = bcrypt.hashSync(normalized, 10);

      const { data: upd, error: updErr } = await supabase.from('items').update({ security_answer: hashed }).eq('id', row.id).select().single();
      if (updErr) {
        console.error(`Failed to update id=${row.id}:`, updErr);
        failed++;
      } else {
        console.log(`Updated id=${row.id} -> hashed`);
        success++;
      }
    } catch (e) {
      console.error(`Error processing id=${row.id}:`, e);
      failed++;
    }
  }

  console.log(`Backfill complete. Success: ${success}, Failed: ${failed}`);
  process.exit(0);
}

run();

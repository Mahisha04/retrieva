import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://fcihpclldwuckzfwohkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const id = 12; // item id to reset
  const newAnswer = 'ganesh'; // plaintext to set

  console.log(`Resetting item id=${id} security_answer -> '${newAnswer}' (hashed)`);
  const normalized = String(newAnswer || '').trim().toLowerCase();
  const hashed = bcrypt.hashSync(normalized, 10);

  const { data, error } = await supabase.from('items').update({ security_answer: hashed }).eq('id', id).select().single();
  if (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }

  console.log('Update succeeded. Item id:', data.id);

  // verify via API call
  try {
    const res = await fetch('http://localhost:5000/verify-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, answer: newAnswer }),
    });
    const body = await res.json();
    console.log('Verify API response:', body);
  } catch (e) {
    console.error('Verify API call failed:', e.message || e);
  }

  process.exit(0);
}

run();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fcihpclldwuckzfwohkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const candidateRow = {
    name: 'probe-server',
    image_url: 'https://example.com/x.jpg',
    type: 'Lost',
    category: 'probe',
    description: 'probe',
    location: 'here',
    contact: 'me@example.com',
    security_question: 'q?',
    security_answer: 'a',
  };

  // get sample keys
  const sample = await supabase.from('items').select().limit(1);
  const allowedKeys = sample && sample.data && sample.data.length > 0 ? Object.keys(sample.data[0]) : ['name','image_url','category','description','location'];
  console.log('allowedKeys:', allowedKeys);

  const itemRow = {};
  for (const k of allowedKeys) {
    if (candidateRow[k] !== undefined) itemRow[k] = candidateRow[k];
  }

  console.log('itemRow to insert:', itemRow);

  const res = await supabase.from('items').insert([itemRow]).select().single();
  console.log('insert res:', res);
}

run();

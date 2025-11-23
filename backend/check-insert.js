import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fcihpclldwuckzfwohkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  try {
    const row = {
      name: 'probe-insert',
      image_url: 'https://example.com/x.jpg',
      type: 'Lost',
      category: 'probe',
      description: 'probe',
      location: 'here',
      contact: 'me@example.com',
    };

    const res = await supabase.from('items').insert([row]).select().single();
    console.log('insert res:', res);
  } catch (err) {
    console.error('error running insert:', err);
  }
}

run();

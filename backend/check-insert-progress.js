import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fcihpclldwuckzfwohkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const itemRow = {
    name: 'probe',
    image_url: 'https://example.com/x.jpg',
    type: 'Lost',
    category: 'probe',
    description: 'probe',
    location: 'here',
    contact: 'me@example.com',
    security_question: 'q?',
    security_answer: 'a',
  };

  const attempts = [
    { name: 'full', row: itemRow },
    {
      name: 'no-security',
      row: {
        name: itemRow.name,
        image_url: itemRow.image_url,
        type: itemRow.type,
        category: itemRow.category,
        description: itemRow.description,
        location: itemRow.location,
        contact: itemRow.contact,
      },
    },
    {
      name: 'no-security-no-contact',
      row: {
        name: itemRow.name,
        image_url: itemRow.image_url,
        type: itemRow.type,
        category: itemRow.category,
        description: itemRow.description,
        location: itemRow.location,
      },
    },
    {
      name: 'minimal',
      row: {
        name: itemRow.name,
        image_url: itemRow.image_url,
        type: itemRow.type,
      },
    },
  ];

  for (const attempt of attempts) {
    try {
      console.log('Attempt:', attempt.name, '->', attempt.row);
      const res = await supabase.from('items').insert([attempt.row]).select().single();
      console.log('Result:', res);
    } catch (err) {
      console.error('Err on attempt', attempt.name, err);
    }
  }
}

run();

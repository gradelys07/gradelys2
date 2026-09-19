const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE practice_sessions DROP CONSTRAINT IF EXISTS practice_sessions_mode_check;
      ALTER TABLE practice_sessions ADD CONSTRAINT practice_sessions_mode_check CHECK (mode IN ('quiz', 'exam', 'flashcards', 'focus'));
    `
  });
  if (error) {
    console.error("RPC failed, we need to run it via migration or manually", error);
  } else {
    console.log("Constraint updated successfully");
  }
}
run();

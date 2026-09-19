const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('practice_sessions').select('*');
  if (error) {
    console.error("Error fetching sessions:", error);
  } else {
    console.log("Sessions found:", data.length);
    if (data.length > 0) {
      console.log(data[0]);
    }
  }
}

main();

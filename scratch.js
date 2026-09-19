const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://okvkthzkcyrnvandvtnc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmt0aHprY3lybnZhbmR2dG5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk1NDA3MSwiZXhwIjoyMTAzNTMwMDcxfQ.twOJkmduxML5TfCUWpTrOmSV6t39Bhrahk_FMOLN4xE');

async function run() {
  const { data, error } = await supabase
    .from('studio_documents')
    .select('id, type, title, content')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (error) console.error(error);
  else {
    for (const doc of data) {
      console.log("---");
      console.log("ID:", doc.id);
      console.log("Type:", doc.type);
      console.log("Title:", doc.title);
      console.log("Content Length:", doc.content?.length);
      console.log("Content Start:", doc.content?.substring(0, 100).replace(/\n/g, '\\n'));
    }
  }
}
run();

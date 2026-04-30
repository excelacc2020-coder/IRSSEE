const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://udfjrjtfhhtqbmhdvcgq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmpyanRmaGh0cWJtaGR2Y2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjQ2OTQsImV4cCI6MjA5MDE0MDY5NH0.hLWmYVWokiw-1Ihd_KDx4cysNrgI6M2GQugfQ0CtXAk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: sessions, error } = await supabase.from('sessions').select('*').limit(10);
  console.log('Sessions fetch error:', error);
  console.log('Found sessions:', sessions?.length);
  if (sessions && sessions.length > 0) {
    console.log(sessions[0]);
  }
}

run();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udfjrjtfhhtqbmhdvcgq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmpyanRmaGh0cWJtaGR2Y2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjQ2OTQsImV4cCI6MjA5MDE0MDY5NH0.hLWmYVWokiw-1Ihd_KDx4cysNrgI6M2GQugfQ0CtXAk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  console.log('Probing Supabase Schema for morning_brief_content...');
  const { data, error } = await supabase.from('sessions').select('morning_brief_content').limit(1);
  
  if (error) {
    console.error('SCHEMA ERROR DETAILS:');
    console.error(error);
  } else {
    console.log('SUCCESS: Column exists! Data returned:', data);
  }
}

checkColumn();

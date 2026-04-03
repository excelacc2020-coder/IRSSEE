const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udfjrjtfhhtqbmhdvcgq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmpyanRmaGh0cWJtaGR2Y2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjQ2OTQsImV4cCI6MjA5MDE0MDY5NH0.hLWmYVWokiw-1Ihd_KDx4cysNrgI6M2GQugfQ0CtXAk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraint() {
  console.log('Testing Upsert for 400 status...');
  const { data, error } = await supabase.from('sessions').upsert({ 
    user_id: '123e4567-e89b-12d3-a456-426614174000', 
    day: 1, 
    part: 1, 
    topic: 'foo' 
  }, { onConflict: 'user_id,day' });
  
  if (error) {
    console.error('UPSERT ERROR:');
    console.error(error);
  } else {
    console.log('UPSERT SUCCESS (or blocked by RLS gracefully)');
  }
}

checkConstraint();

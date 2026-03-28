const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udfjrjtfhhtqbmhdvcgq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmpyanRmaGh0cWJtaGR2Y2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjQ2OTQsImV4cCI6MjA5MDE0MDY5NH0.hLWmYVWokiw-1Ihd_KDx4cysNrgI6M2GQugfQ0CtXAk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSync() {
  console.log('1. Signing up test user...');
  const testEmail = `test_sync_${Date.now()}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'securepassword123'
  });

  if (authError) {
    console.error('Signup Failed:', authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log('2. User created:', userId);

  console.log('3. Upserting a session with Morning Brief...');
  const { data: upsertData, error: upsertError } = await supabase.from('sessions').upsert({
    user_id: userId,
    day: 1,
    topic: 'Test Topic',
    part: 1,
    morning_brief_viewed: true,
    morning_brief_content: '{"coreConcept":"Test Concept Success!"}'
  }).select().single();

  if (upsertError) {
    console.error('\n==== UPSERT FAILED ====');
    console.error('This usually means the column does not exist or has the wrong type.');
    console.error(upsertError);
    return;
  }

  console.log('\n==== UPSERT SUCCESS ====');
  console.log('Returned Session Record:', JSON.stringify(upsertData, null, 2));

  console.log('\n4. Fetching back from database to verify...');
  const { data: fetchData, error: fetchError } = await supabase.from('sessions')
    .select('morning_brief_content')
    .eq('user_id', userId)
    .eq('day', 1)
    .single();

  if (fetchError) {
    console.error('Fetch Failed:', fetchError);
  } else {
    console.log('Fetched content:', fetchData.morning_brief_content);
  }
}

testSync();

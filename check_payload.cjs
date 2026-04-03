const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udfjrjtfhhtqbmhdvcgq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZmpyanRmaGh0cWJtaGR2Y2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjQ2OTQsImV4cCI6MjA5MDE0MDY5NH0.hLWmYVWokiw-1Ihd_KDx4cysNrgI6M2GQugfQ0CtXAk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPayload() {
  const payload = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    day: 1,
    topic: 'foo',
    part: 1,
    morning_brief_viewed: true,
    morning_brief_content: '{"coreConcept": "foo"}',
    study_notes: 'notes',
    mind_map_generated: false,
    mind_map_content: '',
    // quiz_scenario: null,
    quiz_questions: null,
    quiz_answers: null,
    quiz_score: null,
    quiz_passed: false,
    locked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('Testing full payload for 400 status...');
  const { data, error } = await supabase.from('sessions').upsert(payload, { onConflict: 'user_id,day' });
  
  if (error) {
    if (error.code === '42501') {
      console.log('SUCCESS: Payload is completely valid! (Blocked by RLS as expected)');
    } else {
      console.error('PAYLOAD INVALID! 400 Error Triggered:');
      console.error(error);
    }
  } else {
    console.log('UPSERT SUCCESS');
  }
}

checkPayload();

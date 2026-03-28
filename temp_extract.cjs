const fs = require('fs');
const content = fs.readFileSync('f:/EA/ea-command-center/temp_app.js', 'utf8');
const urlMatch = content.match(/https:\/\/[a-zA-Z0-9-]+\.supabase\.co/);
const keyMatch = content.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/);
console.log('URL:', urlMatch ? urlMatch[0] : 'Not found');
console.log('KEY:', keyMatch ? keyMatch[0] : 'Not found');

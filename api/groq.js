export default async function handler(req, res) {
  const path = (req.url ?? '').replace(/^\/api\/groq/, '');

  const chunks = [];
  await new Promise((resolve) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
  });
  const body = chunks.length ? Buffer.concat(chunks).toString() : undefined;

  const response = await fetch(`https://api.groq.com/openai${path}`, {
    method: req.method,
    headers: {
      'Authorization': req.headers['authorization'] ?? '',
      'content-type': 'application/json',
    },
    body,
  });

  res.statusCode = response.status;
  res.setHeader('content-type', 'application/json');
  res.end(await response.text());
}

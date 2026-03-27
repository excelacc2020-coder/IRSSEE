import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage & { url?: string }, res: ServerResponse) {
  const path = (req.url ?? '').replace(/^\/api\/gemini/, '');

  const chunks: Buffer[] = [];
  await new Promise<void>(resolve => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', resolve);
  });
  const body = chunks.length ? Buffer.concat(chunks).toString() : undefined;

  const response = await fetch(`https://generativelanguage.googleapis.com${path}`, {
    method: req.method,
    headers: { 'content-type': 'application/json' },
    body,
  });

  res.statusCode = response.status;
  res.setHeader('content-type', 'application/json');
  res.end(await response.text());
}

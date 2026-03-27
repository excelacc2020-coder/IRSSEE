import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage & { url?: string; body?: unknown }, res: ServerResponse) {
  const path = (req.url ?? '').replace(/^\/api\/claude/, '');

  const chunks: Buffer[] = [];
  await new Promise<void>(resolve => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', resolve);
  });
  const body = chunks.length ? Buffer.concat(chunks).toString() : undefined;

  const response = await fetch(`https://api.anthropic.com${path}`, {
    method: req.method,
    headers: {
      'x-api-key': (req.headers['x-api-key'] as string) ?? '',
      'anthropic-version': (req.headers['anthropic-version'] as string) ?? '2023-06-01',
      'content-type': 'application/json',
    },
    body,
  });

  res.statusCode = response.status;
  res.setHeader('content-type', 'application/json');
  res.end(await response.text());
}

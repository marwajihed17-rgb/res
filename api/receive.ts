import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const payload = req.body || {};
    console.log('api/receive', payload);
    const replyText = typeof payload.text === 'string' && payload.text.trim().length > 0
      ? `🟢 Process started: ${payload.text}`
      : '🟢 Process started';
    const body = {
      sender: 'bot',
      status: 'started',
      reply: replyText,
      conversationId: payload.conversationId ?? null,
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      module: payload.module ?? 'unknown',
    };
    return res.status(200).json(body);
  } catch (e: any) {
    console.error('api/receive error', e?.message || e);
    return res.status(500).json({ sender: 'bot', status: 'error', reply: 'Service unavailable', conversationId: null, attachments: [], module: 'unknown' });
  }
}
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
(-è)    console.log('api/receive', payload);
    const body = {
      sender: payload.sender ?? 'bot',
      status: payload.status ?? 'completed',
      reply: payload.reply ?? '🟢 ✅ Process completed successfully',
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
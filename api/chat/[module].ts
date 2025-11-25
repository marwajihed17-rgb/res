import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const b: any = req.body || {};
    const body = {
      sender: b?.sender,
      status: b?.status,
      reply: b?.reply,
      conversationId: b?.conversationId ?? null,
    };
    return res.status(200).json(body);
  } catch (e: any) {
    console.error('api/chat echo error', e?.message || e);
    return res.status(500).json({ sender: 'bot', status: 'error', reply: 'Service unavailable', conversationId: null });
  }
}
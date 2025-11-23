import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const payload = req.body || {};
    console.log('api/receive', payload);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('api/receive error', e?.message || e);
    return res.status(500).json({ ok: false });
  }
}
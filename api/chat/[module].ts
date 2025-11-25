import type { VercelRequest, VercelResponse } from '@vercel/node';

type ModuleId = 'invoice' | 'kdr' | 'ga';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: process.env.N8N_WEBHOOK_URL_INVOICE || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  ga: process.env.N8N_WEBHOOK_URL_GA || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  kdr: process.env.N8N_WEBHOOK_URL_KDR || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const moduleParam = String(req.query.module || '').toLowerCase();
  if (!['invoice', 'ga', 'kdr'].includes(moduleParam)) {
    return res.status(400).json({ error: 'Invalid module' });
  }
  const moduleId = moduleParam as ModuleId;
  try {
    const payload = req.body || {};
    const webhook = WEBHOOKS[moduleId];
    const r = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const textBody = await r.text();
    let json: any = null;
    try { json = JSON.parse(textBody); } catch {}
    if (!r.ok) {
      return res.status(r.status).json(json || { text: textBody || 'Service unavailable' });
    }
    return res.status(200).json(json || { text: textBody });
  } catch (e: any) {
    console.error('api/chat error', e?.message || e);
    return res.status(500).json({ text: 'Service unavailable' });
  }
}
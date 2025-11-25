import type { VercelRequest, VercelResponse } from '@vercel/node';

type ModuleId = 'invoice' | 'kdr' | 'ga';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: process.env.N8N_WEBHOOK_URL_INVOICE || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  ga: process.env.N8N_WEBHOOK_URL_GA || 'https://n8n.srv1009033.hstgr.cloud/webhook/GA',
  kdr: process.env.N8N_WEBHOOK_URL_KDR || 'https://n8n.srv1009033.hstgr.cloud/webhook/KDR',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const payload = req.body || {};
    const moduleId = String(payload.module || '').toLowerCase() as ModuleId;
    if (!['invoice', 'ga', 'kdr'].includes(moduleId)) {
      return res.status(400).json({ error: 'Invalid module' });
    }
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
    console.error('api/send error', e?.message || e);
    return res.status(500).json({ text: 'Service unavailable' });
  }
}
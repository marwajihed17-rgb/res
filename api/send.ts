import type { VercelRequest, VercelResponse } from '@vercel/node';

type ModuleId = 'invoice' | 'kdr' | 'ga';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: process.env.N8N_WEBHOOK_URL_INVOICE || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  ga: process.env.N8N_WEBHOOK_URL_GA || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  kdr: process.env.N8N_WEBHOOK_URL_KDR || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
};

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
    const moduleId = String(payload.module || '').toLowerCase() as ModuleId;
    if (!['invoice', 'ga', 'kdr'].includes(moduleId)) {
      return res.status(400).json({ error: 'Invalid module' });
    }
    const webhook = WEBHOOKS[moduleId];
    const maxRetries = Number(process.env.N8N_RETRY_MAX ?? 1);
    const baseDelayMs = Number(process.env.N8N_RETRY_BASE_MS ?? 200);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let attempt = 0;
    let lastStatus = 0;
    let lastText = '';
    while (attempt <= maxRetries) {
      try {
        const r = await fetch(webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        lastStatus = r.status;
        const textBody = await r.text();
        lastText = textBody;
        let json: any = null;
        try { json = JSON.parse(textBody); } catch {}
        if (r.ok) {
          return res.status(200).json(json || { text: textBody });
        }
        // Handle non-OK with backoff
        attempt += 1;
        const backoff = Math.min(3000, baseDelayMs * 2 ** (attempt - 1));
        console.warn('api/send retry', { moduleId, attempt, status: r.status, backoff });
        await delay(backoff);
      } catch (e: any) {
        // Network error; retry with backoff
        attempt += 1;
        const backoff = Math.min(3000, baseDelayMs * 2 ** (attempt - 1));
        console.warn('api/send network error retry', { moduleId, attempt, backoff, error: e?.message });
        await delay(backoff);
      }
    }
    return res.status(lastStatus || 503).json({ text: lastText || 'Service unavailable' });
  } catch (e: any) {
    console.error('api/send error', e?.message || e);
    return res.status(500).json({ text: 'Service unavailable' });
  }
}
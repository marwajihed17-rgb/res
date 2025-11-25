import type { VercelRequest, VercelResponse } from '@vercel/node';

type ModuleId = 'invoice' | 'kdr' | 'ga';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: process.env.N8N_WEBHOOK_URL_INVOICE || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  ga: process.env.N8N_WEBHOOK_URL_GA || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  kdr: process.env.N8N_WEBHOOK_URL_KDR || 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
};

const TRAE_BASE = process.env.TRAE_API_BASE_URL || '';
const TRAE_KEY = process.env.TRAE_API_KEY || '';
const USE_TRAE = String(process.env.USE_TRAE || '').toLowerCase() === 'true';

async function postJSON(url: string, body: any, headers: Record<string, string>, attempts = 3) {
  let lastErr: any = null;
  let attempt = 0;
  const t0 = Date.now();
  while (attempt < attempts) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await r.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      const metrics = { status: r.status, duration_ms: Date.now() - t0, attempts: attempt + 1 };
      return { ok: r.ok, json, text, metrics };
    } catch (e: any) {
      lastErr = e;
      const backoff = Math.min(1200, 300 * Math.pow(2, attempt));
      await new Promise((resolve) => setTimeout(resolve, backoff));
      attempt++;
    }
  }
  return { ok: false, json: null, text: lastErr?.message || 'Service unavailable', metrics: { status: 0, duration_ms: Date.now() - t0, attempts } };
}

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
    if (USE_TRAE && TRAE_BASE && TRAE_KEY) {
      // Trae integration path
      const url = `${TRAE_BASE.replace(/\/$/, '')}/workflow/chat`;
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${TRAE_KEY}` };
      const result = await postJSON(url, { ...payload, module: moduleId }, headers, 3);
      console.log('trae_integration', { module: moduleId, metrics: result.metrics });
      if (!result.ok) return res.status(502).json({ text: result.text, metrics: result.metrics });
      const out = result.json || { text: result.text };
      return res.status(200).json(out);
    } else {
      // n8n path
      const webhook = WEBHOOKS[moduleId];
      const result = await postJSON(webhook, payload, { 'Accept': 'application/json' }, 2);
      console.log('n8n_integration', { module: moduleId, metrics: result.metrics });
      if (!result.ok) return res.status(502).json({ text: result.text, metrics: result.metrics });
      const out = result.json || { text: result.text };
      return res.status(200).json(out);
    }
  } catch (e: any) {
    console.error('api/chat error', e?.message || e);
    return res.status(500).json({ text: 'Service unavailable' });
  }
}
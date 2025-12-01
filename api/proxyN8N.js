const { json } = require('micro');

const WEBHOOKS = {
  invoice: 'https://n8n.srv987649.hstgr.cloud/webhook/a043e005-7e94-42cc-b210-83c52ff908d6',
  ga: 'https://n8n.srv1009033.hstgr.cloud/webhook/ga',
  kdr: 'https://n8n.srv1009033.hstgr.cloud/webhook/KDR',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }
  try {
    const body = await json(req);
    const moduleId = body.module;
    if (!moduleId || !WEBHOOKS[moduleId]) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid module' }));
    }
    const payload = {
      sender: body.sender,
      module: moduleId,
      text: body.text,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      conversationId: body.conversationId ?? null,
    };
    const r = await fetch(WEBHOOKS[moduleId], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!r || !r.ok) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ text: 'Service unavailable' }));
    }
    let data;
    try {
      data = await r.json();
    } catch {
      const t = await r.text();
      data = { text: t };
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ text: 'Service unavailable' }));
  }
};

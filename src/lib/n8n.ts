export type ModuleId = 'invoice' | 'ga' | 'kdr';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  ga: 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
  kdr: 'https://n8n.srv1009033.hstgr.cloud/webhook/process',
};

export async function sendChat(
  moduleId: ModuleId,
  payload: {
    sender: string;
    text: string;
    conversationId?: string | null;
  },
): Promise<{ text: string; attachments?: { name: string; url?: string }[] } | null> {
  const apiUrl = `/api/send`;
  const directUrl = WEBHOOKS[moduleId];
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: 'cors',
    });
    clearTimeout(t);
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Service unavailable');
      console.warn('chat_api_failed', { moduleId, status: res.status, errText });
      // fallback to direct webhook
      const directRes = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors',
      }).catch(() => null as any);
      if (!directRes || !directRes.ok) return { text: errText };
      const directJson = await directRes.json().catch(async () => ({ text: await directRes.text() }));
      const text = typeof (directJson.reply ?? directJson.text) === 'string' ? (directJson.reply ?? directJson.text) : JSON.stringify(directJson);
      return { text };
    }
    const data = await res.json().catch(() => null);
    if (!data) return null;
    const text = typeof (data.reply ?? data.text) === 'string' ? (data.reply ?? data.text) : JSON.stringify(data);
    return { text };
  } catch {
    return null;
  }
}
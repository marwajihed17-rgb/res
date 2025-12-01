export type ModuleId = 'invoice' | 'ga' | 'kdr';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: 'https://n8n.srv987649.hstgr.cloud/webhook/a043e005-7e94-42cc-b210-83c52ff908d6',
  ga: 'https://n8n.srv1009033.hstgr.cloud/webhook/GA',
  kdr: 'https://n8n.srv1009033.hstgr.cloud/webhook/KDR',
};

export async function sendChat(
  moduleId: ModuleId,
  payload: {
    sender: string;
    module: ModuleId;
    text: string;
    attachments?: { name: string; type?: string; size?: number; url?: string }[];
    conversationId?: string | null;
  },
): Promise<{ text: string; attachments?: { name: string; url?: string }[] } | null> {
  const directUrl = WEBHOOKS[moduleId];
  try {
    const directRes = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors',
    }).catch(() => null as any);
    if (!directRes || !directRes.ok) return { text: 'Service unavailable' };
    const directJson = await directRes.json().catch(async () => ({ text: await directRes.text() }));
    const text = typeof (directJson.reply ?? directJson.text) === 'string' ? (directJson.reply ?? directJson.text) : JSON.stringify(directJson);
    const attachments = Array.isArray(directJson.attachments) ? directJson.attachments : [];
    return { text, attachments };
  } catch {
    return null;
  }
}

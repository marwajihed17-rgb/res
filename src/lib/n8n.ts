export type ModuleId = 'invoice' | 'ga' | 'kdr' | 'kdrInvoice' | 'kdrSellout';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: 'https://n8n.srv987649.hstgr.cloud/webhook/a043e005-7e94-42cc-b210-83c52ff908d6',
  ga: 'https://n8n.srv987649.hstgr.cloud/webhook/41062f37-4b32-44d6-9abe-f8c384db48fa',
  kdr: 'https://n8n.srv1009033.hstgr.cloud/webhook/',
  kdrInvoice: 'https://n8n.srv987649.hstgr.cloud/webhook/c5cd89d2-e170-4f2e-b495-d86390f96bad',
  kdrSellout: 'https://n8n.srv987649.hstgr.cloud/webhook/e8505b44-00f0-440a-a6a4-c545f0389f27',
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

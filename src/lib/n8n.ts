export type ModuleId = 'invoice' | 'ga' | 'kdr';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: 'https://n8n.srv987649.hstgr.cloud/webhook/a043e005-7e94-42cc-b210-83c52ff908d6',
  ga: 'https://n8n.srv1009033.hstgr.cloud/webhook/ga',
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
  try {
    const res = await fetch('/api/proxyN8N', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ ...payload, module: moduleId }),
    }).catch(() => null as any);
    if (!res || !res.ok) return { text: 'Service unavailable' };
    const json = await res.json().catch(async () => ({ text: await res.text() }));
    const text = typeof (json.reply ?? json.text) === 'string' ? (json.reply ?? json.text) : JSON.stringify(json);
    const attachments = Array.isArray(json.attachments) ? json.attachments : [];
    return { text, attachments };
  } catch {
    return null;
  }
}

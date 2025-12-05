export type ModuleId = 'invoice' | 'ga' | 'kdr' | 'kdrInvoice' | 'kdrSellout';

const WEBHOOKS: Record<ModuleId, string> = {
  invoice: 'https://n8n.srv987649.hstgr.cloud/webhook/a043e005-7e94-42cc-b210-83c52ff908d6',
  ga: 'https://n8n.srv987649.hstgr.cloud/webhook/GA',
  kdr: 'https://n8n.srv1009033.hstgr.cloud/webhook/24e9013e-ec7b-4a16-8fdf-745c239e84cb',
  kdrInvoice: 'https://n8n.srv987649.hstgr.cloud/webhook/c5cd89d2-e170-4f2e-b495-d86390f96bad',
  kdrSellout: 'https://n8n.srv987649.hstgr.cloud/webhook/e8505b44-00f0-440a-a6a4-c545f0389f27',
};

export async function sendChat(
  moduleId: ModuleId,
  payload: {
    sender: string;
    module: ModuleId;
    text: string;
    attachments?: { name: string; type?: string; size?: number; url?: string; file?: File }[];
    conversationId?: string | null;
  },
): Promise<{ text: string; attachments?: { name: string; url?: string }[] } | null> {
  const directUrl = WEBHOOKS[moduleId];
  try {
    const hasBinary = Array.isArray(payload.attachments) && payload.attachments.some(a => !!a.file);
    const options: RequestInit = { method: 'POST', mode: 'cors' };
    if (hasBinary) {
      const form = new FormData();
      form.append('sender', payload.sender);
      form.append('module', payload.module);
      form.append('text', payload.text);
      form.append('conversationId', String(payload.conversationId ?? ''));
      (payload.attachments || []).forEach((a, i) => {
        if (a.file) form.append('files', a.file, a.name || `file-${i}`);
      });
      form.append('attachments', JSON.stringify((payload.attachments || []).map(a => ({ name: a.name, type: a.type, size: a.size, url: a.url }))));
      options.body = form;
    } else {
      options.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      options.body = JSON.stringify(payload);
    }
    const directRes = await fetch(directUrl, options).catch(() => null as any);
    if (!directRes || !directRes.ok) return { text: 'Service unavailable' };
    const directJson = await directRes.json().catch(async () => ({ text: await directRes.text() }));
    const text = typeof (directJson.reply ?? directJson.text) === 'string' ? (directJson.reply ?? directJson.text) : JSON.stringify(directJson);
    const attachments = Array.isArray(directJson.attachments) ? directJson.attachments : [];
    return { text, attachments };
  } catch {
    return null;
  }
}

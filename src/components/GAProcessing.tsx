import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, User, Trash2, LogOut, Paperclip, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BarChart3 } from 'lucide-react';
import { AttachmentItem } from './AttachmentItem';
import { uploadFileCancelable, MAX_FILE_SIZE_BYTES } from '../lib/upload';
import { subscribeGlobalChat } from '../lib/realtime';
import { renderTextWithLinks } from '../lib/url';

interface GAProcessingProps {
  onBack: () => void;
  onLogout: () => void;
  user: string;
}

export function GAProcessing({ onBack, onLogout, user }: GAProcessingProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'system'; text: string; status?: string; conversationId?: string | null; attachments: { name: string; url?: string }[]; ts: number }[]>([]);
  const [attachments, setAttachments] = useState<{
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'done' | 'error';
    error?: string;
    previewUrl?: string;
    cancel?: () => void;
  }[]>([]);
  const [typing] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const unsub = subscribeGlobalChat((data) => {
      const role = data.sender === 'bot' ? 'system' : 'user';
      setMessages((prev) => [...prev, { id: `${Date.now()}-rt`, role, text: data.reply, status: data.status, conversationId: data.conversationId, attachments: [], ts: Date.now() }]);
    });
    return () => unsub();
  }, []);

  const handleSend = async () => {
    if (message.trim() || attachments.length) {
      const payloadAttachments = attachments.map((a) => ({ name: a.file.name, url: a.previewUrl }));
      setAttachments([]);
      const id = `${Date.now()}-u`;
      const ts = Date.now();
      setMessages((prev) => [...prev, { id, role: 'user', text: message.trim(), attachments: payloadAttachments, ts }]);
      setMessage('');
      const { sendChat } = await import('../lib/n8n');
      const MODULE: 'ga' = 'ga';
      const resp = await sendChat(MODULE, {
        sender: user,
        module: MODULE,
        text: message.trim(),
        attachments: payloadAttachments,
        conversationId: null,
      });
      if (resp) {
        const rid = `${Date.now()}-s`;
        const rts = Date.now();
        setMessages((prev) => [...prev, { id: rid, role: 'system', text: resp.text, attachments: resp.attachments || [], ts: rts }]);
      } else {
        const rid = `${Date.now()}-s`;
        const rts = Date.now();
        setMessages((prev) => [...prev, { id: rid, role: 'system', text: 'Service unavailable. Please try again.', attachments: [], ts: rts }]);
      }
    }
  };

  const handleClearMessages = () => {
    messages.forEach((m) => {
      m.attachments.forEach((f) => {
        if (f.url && f.url.startsWith('blob:')) {
          try { URL.revokeObjectURL(f.url); } catch {}
        }
      });
    });
    setMessages([]);
    attachments.forEach((a) => {
      if (a.cancel && a.status === 'uploading') a.cancel();
      if (a.previewUrl) {
        try { URL.revokeObjectURL(a.previewUrl); } catch {}
      }
    });
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain';
    input.onchange = (e: any) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      const items = files.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        progress: 0,
        status: file.size > MAX_FILE_SIZE_BYTES ? 'error' : 'uploading',
        error: file.size > MAX_FILE_SIZE_BYTES ? 'File exceeds 25MB limit' : undefined,
        previewUrl: undefined,
      }));
      setAttachments((prev) => [...prev, ...items]);
      items.forEach((item) => {
        if (item.status === 'uploading') {
          const { promise, cancel } = uploadFileCancelable(item.file, (p) => {
            setAttachments((prev) => prev.map((a) => a.id === item.id ? { ...a, progress: p } : a));
          });
          setAttachments((prev) => prev.map((a) => a.id === item.id ? { ...a, cancel } : a));
          promise
            .then(({ url }) => {
              setAttachments((prev) => prev.map((a) => a.id === item.id ? { ...a, status: 'done', progress: 100, previewUrl: url } : a));
            })
            .catch((err) => {
              setAttachments((prev) => prev.map((a) => a.id === item.id ? { ...a, status: 'error', error: err?.message || 'Upload failed' } : a));
            });
        }
      });
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="chat-header border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md" style={{ height: 'var(--chat-header-height)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-[#1a1f2e]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white">GA Processing</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 text-sm">Status</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="current user">
            <Button
              variant="ghost"
              size="icon"
              aria-label="User"
              className="text-white hover:bg-[#1a1f2e]"
            >
              <User className="w-5 h-5" />
            </Button>
            <span className="text-white/90 text-sm" aria-live="polite" aria-atomic="true">{user || 'Unknown'}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#1a1f2e]"
              onClick={handleClearMessages}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-[#1a1f2e] gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="chat-main p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-gray-500 text-center">Start a conversation to begin processing</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className="flex animate-fade-in"
              style={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <div style={{ maxWidth: '75%' }}>
                <div className={m.role === 'user' ? "rounded-xl px-4 py-2 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] text-white animated-gradient" : "rounded-xl px-4 py-2 bg-[#1a1f2e]/80 border border-[#2a3144] text-white"}>
                  {m.status && <span className="text-xs text-gray-400">{m.status}</span>}
                  {m.text && <div className="whitespace-pre-wrap">{renderTextWithLinks(m.text)}</div>}
                  {m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      {m.attachments.map((f, i) => (
                        <a key={i} href={f.url} target="_blank" rel="noopener nofollow" download={f.name} className="text-sm cursor-pointer underline-offset-4 hover:underline">{f.name}</a>
                      ))}
                    </div>
                  )}
                </div>
                <div className={m.role === 'user' ? "text-xs text-gray-500 mt-1 text-right" : "text-xs text-gray-500 mt-1"}>{new Date(m.ts).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          
          <div ref={endRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="chat-footer border-t border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md" style={{ height: 'var(--chat-footer-height)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              className="text-gray-400 hover:bg-[#1a1f2e] shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-12 bg-[#1a1f2e] border-[#2a3144] text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="shrink-0 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] hover:opacity-90 text-white animated-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {attachments.length > 0 && (
            <div className="attachments-list max-w-4xl mx-auto mt-3 flex flex-col gap-2">
              {attachments.map((a) => (
                <AttachmentItem
                  key={a.id}
                  name={a.file.name}
                  size={a.file.size}
                  type={a.file.type || 'application/octet-stream'}
                  progress={a.progress}
                  status={a.status}
                  error={a.error}
                  previewUrl={a.previewUrl}
                  onDelete={() => {
                    if (a.cancel && a.status === 'uploading') a.cancel();
                    if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
                    setAttachments((prev) => prev.filter((x) => x.id !== a.id));
                  }}
                />
              ))}
              <p className="text-xs text-gray-500">Max 25MB per file.</p>
            </div>
          )}
          
        </div>
      </footer>
    </div>
  );
}

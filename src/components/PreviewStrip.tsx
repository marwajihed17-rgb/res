import { useMemo, useState } from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { X, FileText, FileImage, FileSpreadsheet, FileArchive, File } from 'lucide-react';

type Att = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
  cancel?: () => void;
  checksum?: string;
};

function formatSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let b = bytes; let i = 0; while (b >= 1024 && i < units.length - 1) { b /= 1024; i++; }
  return `${b.toFixed(1)} ${units[i]}`;
}

function iconFor(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf') return FileText;
  if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('zip')) return FileArchive;
  return File;
}

interface Props {
  items: Att[];
  onRemove: (id: string) => void;
  onReorder: (sourceId: string, targetId: string) => void;
}

export function PreviewStrip({ items, onRemove, onReorder }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Att | null>(null);

  const rows = useMemo(() => items, [items]);

  return (
    <div className="chat-preview bg-[#0f1419]/70 backdrop-blur-md border-t border-[#2a3144]">
      <div className="overflow-x-auto h-full">
        <div className="px-4 py-2 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
          {rows.map((a) => {
            const Icon = iconFor(a.file.type || 'application/octet-stream');
            return (
              <div
                key={a.id}
                className="group border border-[#2a3144] rounded-md p-2 bg-[#1a1f2e]/80"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const src = e.dataTransfer.getData('text/plain'); if (src && src !== a.id) onReorder(src, a.id); }}
                aria-label={a.file.name}
                tabIndex={0}
              >
                {a.file.type.startsWith('image/') && a.previewUrl ? (
                  <button
                    className="w-full h-[100px] flex items-center justify-center rounded-sm overflow-hidden"
                    onClick={() => { setPreview(a); setOpen(true); }}
                    aria-label={`Preview ${a.file.name}`}
                  >
                    <img src={a.previewUrl} alt={a.file.name} className="w-[100px] h-[100px] object-contain" />
                  </button>
                ) : (
                  <button
                    className="w-full h-[100px] flex items-center justify-center rounded-sm"
                    onClick={() => { setPreview(a); setOpen(true); }}
                    aria-label={`Preview ${a.file.name}`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </button>
                )}
                <div className="mt-2 text-xs text-white truncate" title={a.file.name}>{a.file.name}</div>
                <div className="text-[10px] text-gray-400">{formatSize(a.file.size)}</div>
                <div className="mt-2">
                  {a.status === 'uploading' && <Progress value={a.progress} />}
                  {a.status === 'error' && <span className="text-[#F54A45] text-xs">{a.error || 'Upload failed'}</span>}
                  {a.status === 'done' && <span className="text-green-500 text-xs">Uploaded</span>}
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-[#1a1f2e]"
                    aria-label={`Remove ${a.file.name}`}
                    onClick={() => onRemove(a.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {preview && (
            <div>
              <DialogHeader>
                <DialogTitle>{preview.file.name}</DialogTitle>
                <DialogDescription>{formatSize(preview.file.size)}</DialogDescription>
              </DialogHeader>
              {preview.file.type.startsWith('image/') && preview.previewUrl ? (
                <img src={preview.previewUrl} alt={preview.file.name} className="max-h-[60vh] w-full object-contain" />
              ) : (
                <div className="flex items-center justify-center h-[40vh]">
                  {(() => { const I = iconFor(preview.file.type || 'application/octet-stream'); return <I className="w-12 h-12 text-white" />; })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


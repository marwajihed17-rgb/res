import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { FileText, FileImage, FileSpreadsheet, FileArchive, File, Eye, Trash2 } from 'lucide-react';

interface Props {
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
  onDelete: () => void;
}

function formatSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let b = bytes;
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(1)} ${units[i]}`;
}

function iconFor(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf') return FileText;
  if (type.includes('sheet')) return FileSpreadsheet;
  if (type.includes('zip')) return FileArchive;
  return File;
}

export function AttachmentItem({ name, size, type, progress, status, error, previewUrl, onDelete }: Props) {
  const Icon = iconFor(type);
  return (
    <div className="flex items-center gap-3 border border-[#2a3144] rounded-md p-3 bg-[#1a1f2e]/80 w-full">
      <div className="w-9 h-9 rounded-md bg-[#242938] flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-white truncate max-w-[60%]" title={name}>{name}</p>
          <span className="text-gray-400 text-xs">{formatSize(size)}</span>
        </div>
        <div className="mt-2">
          {status === 'uploading' && <Progress value={progress} />}
          {status === 'error' && <span className="text-[#F54A45] text-xs">{error || 'Upload failed'}</span>}
          {status === 'done' && <span className="text-green-500 text-xs">Uploaded</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#1a1f2e]">
              <Eye className="w-5 h-5" />
            </Button>
          </a>
        )}
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-white hover:bg-[#1a1f2e]">
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
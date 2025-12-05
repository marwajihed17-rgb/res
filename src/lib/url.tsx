import React from 'react';

function transformDrive(url: URL): string | null {
  const h = url.hostname.toLowerCase();
  const p = url.pathname;
  const sp = url.searchParams;
  const keep = new URLSearchParams(sp);
  let id: string | null = null;
  if (h.includes('drive.google.com')) {
    const m1 = p.match(/\/(?:u\/\d+\/)?file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) id = m1[1];
    if (!id && p.includes('/open')) id = sp.get('id');
    if (!id && p.includes('/uc')) id = sp.get('id');
    if (id) return `https://drive.google.com/file/d/${id}/preview${keep.toString() ? `?${keep.toString()}` : ''}`;
    return null;
  }
  if (h.includes('docs.google.com')) {
    const doc = p.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    const sheet = p.match(/\/(?:spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    const slide = p.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (doc) return `https://docs.google.com/document/d/${doc[1]}/preview${keep.toString() ? `?${keep.toString()}` : ''}`;
    if (sheet) return `https://docs.google.com/spreadsheets/d/${sheet[1]}/preview${keep.toString() ? `?${keep.toString()}` : ''}`;
    if (slide) return `https://docs.google.com/presentation/d/${slide[1]}/preview${keep.toString() ? `?${keep.toString()}` : ''}`;
    return null;
  }
  return null;
}

export function renderTextWithLinks(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s)]+(?:\([^)]*\)[^\s)]*)?)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let anchors = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const end = urlRegex.lastIndex;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const rawUrl = match[0];
    let href: string | null = null;
    try {
      const decoded = decodeURI(rawUrl);
      const url = new URL(decoded);
      const t = transformDrive(url);
      href = encodeURI((t || url.toString()));
      if (!t && (url.hostname.includes('google.com'))) {
        try { console.warn('url_transform_unrecognized', url.toString()); } catch {}
      }
    } catch {
      parts.push(rawUrl);
      lastIndex = end;
      continue;
    }
    parts.push(
      <a
        key={`${start}-${end}`}
        href={href!}
        target="_blank"
        rel="noopener nofollow"
        className="cursor-pointer underline-offset-4 hover:underline"
        style={{ color: '#4A90F5' }}
      >
        Link
      </a>,
    );
    anchors++;
    lastIndex = end;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  if (anchors === 0) return text;
  return parts.length ? parts : text;
}

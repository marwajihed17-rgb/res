export function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s)]+(?:\([^)]*\)[^\s)]*)?)/gi;
  const parts: Array<string | JSX.Element> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const end = urlRegex.lastIndex;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const rawUrl = match[0];
    let href: string | null = null;
    try {
      // Decode then encode to normalize
      const decoded = decodeURI(rawUrl);
      const url = new URL(decoded);
      href = encodeURI(url.toString());
    } catch {
      // invalid URL, keep original text
      parts.push(rawUrl);
      lastIndex = end;
      continue;
    }
    parts.push(
      <a
        key={`${start}-${end}`}
        href={href!}
        target="_blank"
        rel="nofollow"
        className="cursor-pointer underline-offset-4 hover:underline text-white"
      >
        [File Link]
      </a>,
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}


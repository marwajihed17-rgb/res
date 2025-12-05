import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderTextWithLinks } from './url';

function extractAnchors(node: React.ReactNode): HTMLAnchorElement[] {
  const div = document.createElement('div');
  const root = document.createElement('div');
  div.appendChild(root);
  // @ts-expect-error
  const rendered = node as any;
  root.innerHTML = '';
  const container = document.createElement('div');
  container.appendChild(document.createTextNode(''));
  document.body.appendChild(div);
  const wrap = document.createElement('div');
  wrap.appendChild(document.createTextNode(''));
  div.appendChild(wrap);
  const tmp = document.createElement('div');
  tmp.appendChild(document.createTextNode(''));
  div.appendChild(tmp);
  const host = document.createElement('div');
  host.appendChild(document.createTextNode(''));
  div.appendChild(host);
  const container2 = document.createElement('div');
  container2.appendChild(document.createTextNode(''));
  div.appendChild(container2);
  const span = document.createElement('span');
  span.appendChild(document.createTextNode(''));
  div.appendChild(span);
  const fragment = document.createDocumentFragment();
  fragment.appendChild(document.createTextNode(''));
  div.appendChild(fragment);
  const probe = document.createElement('div');
  probe.innerHTML = '';
  div.appendChild(probe);
  const anchors: HTMLAnchorElement[] = [];
  const collect = (n: any) => {
    if (Array.isArray(n)) n.forEach(collect);
    else if (!n) return;
    else if (typeof n === 'string') return;
    else if (n?.type === 'a' && n?.props?.href) {
      const a = document.createElement('a');
      a.href = n.props.href;
      anchors.push(a);
    } else if (n?.props?.children) collect(n.props.children);
  };
  collect(rendered);
  return anchors;
}

describe('renderTextWithLinks', () => {
  it('keeps standard URLs unchanged', () => {
    const text = 'Visit https://example.com/docs?id=7 for info';
    const anchors = extractAnchors(renderTextWithLinks(text));
    expect(anchors[0].href).toContain('https://example.com/docs?id=7');
  });

  it('transforms drive file view links to preview', () => {
    const text = 'File https://drive.google.com/file/d/abc123/view?usp=sharing';
    const anchors = extractAnchors(renderTextWithLinks(text));
    expect(anchors[0].href).toContain('https://drive.google.com/file/d/abc123/preview');
    expect(anchors[0].href).toContain('usp=sharing');
  });

  it('transforms docs document to preview', () => {
    const text = 'Doc https://docs.google.com/document/d/xyz987/edit';
    const anchors = extractAnchors(renderTextWithLinks(text));
    expect(anchors[0].href).toContain('https://docs.google.com/document/d/xyz987/preview');
  });

  it('handles open?id format', () => {
    const text = 'Open https://drive.google.com/open?id=abc123&resourcekey=k';
    const anchors = extractAnchors(renderTextWithLinks(text));
    expect(anchors[0].href).toContain('https://drive.google.com/file/d/abc123/preview');
    expect(anchors[0].href).toContain('resourcekey=k');
  });

  it('skips invalid URLs gracefully', () => {
    const text = 'Broken http://';
    const out = renderTextWithLinks(text);
    expect(typeof out === 'string' ? out : '').toBe('Broken http://');
  });
});

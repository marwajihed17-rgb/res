import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceProcessing } from '../InvoiceProcessing';

let onMsg: ((d: any) => void) | null = null;
vi.mock('../../lib/realtime', () => ({
  subscribeGlobalChat: (cb: (d: any) => void) => { onMsg = cb; return () => {}; },
}));
// stub scrollIntoView
// @ts-expect-error
global.Element.prototype.scrollIntoView = vi.fn();

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(ui);
  return container;
}

describe('Chat line breaks', () => {
  it('applies whitespace-pre-line to bot messages', async () => {
    const container = render(
      <InvoiceProcessing onBack={() => {}} onLogout={() => {}} user="tester" />,
    );
    for (let i = 0; i < 10 && !onMsg; i++) await new Promise((r) => setTimeout(r, 0));
    onMsg?.({ sender: 'bot', status: 'started', reply: 'Line 1\n\nLine 2', conversationId: null });
    await new Promise((r) => setTimeout(r, 0));
    const elements = Array.from(container.querySelectorAll('.whitespace-pre-line'));
    const found = elements.some((el) => (el.textContent || '').includes('Line 1') && (el.textContent || '').includes('Line 2'));
    expect(found).toBe(true);
  });
});


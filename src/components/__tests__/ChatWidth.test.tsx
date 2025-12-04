import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceProcessing } from '../InvoiceProcessing';

// Mock realtime to capture callback and trigger messages manually
let onMsg: ((d: any) => void) | null = null;
vi.mock('../../lib/realtime', () => ({
  subscribeGlobalChat: (cb: (d: any) => void) => { onMsg = cb; return () => {}; },
}));
// Provide scrollIntoView stub to avoid jsdom errors from effects
// @ts-expect-error add stub on prototype
global.Element.prototype.scrollIntoView = vi.fn();

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(ui);
  return container;
}

describe('Chat width constraints', () => {
  it('applies 80% max-width to received (system) messages only', async () => {
    const container = render(
      <InvoiceProcessing onBack={() => {}} onLogout={() => {}} user="tester" />,
    );
    // wait until subscribeGlobalChat has been registered
    for (let i = 0; i < 10 && !onMsg; i++) {
      await new Promise((r) => setTimeout(r, 0));
    }
    // Trigger messages after mount and wait for DOM update
    await act(async () => {
      onMsg?.({ sender: 'bot', status: 'ok', reply: 'incoming message', conversationId: null });
      onMsg?.({ sender: 'alex', status: 'ok', reply: 'outgoing peer message', conversationId: null });
    });

    const styledContainers = Array.from(container.querySelectorAll<HTMLElement>('.animate-fade-in > div')) as HTMLDivElement[];
    const incomingContainer = styledContainers[0] as HTMLDivElement;
    const outgoingContainer = styledContainers[1] as HTMLDivElement;

    expect(incomingContainer.style.maxWidth).toBe('80%');
    expect(outgoingContainer.style.maxWidth).toBe('75%');
  });
});

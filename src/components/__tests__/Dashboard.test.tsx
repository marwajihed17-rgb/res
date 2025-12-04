import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, it, expect } from 'vitest';
import { Dashboard } from '../Dashboard';

async function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  return container;
}

describe('Dashboard module buttons', () => {
  it('renders new KDRs buttons and navigates when enabled', async () => {
    const calls: string[] = [];
    const container = await render(
      <Dashboard
        authorized={['invoice', 'kdr', 'ga']}
        onNavigate={(p) => calls.push(p)}
        onLogout={() => {}}
      />,
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    const titles = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent || '');
    expect(titles.some((t) => t.includes('KDRs Invoice Processing'))).toBe(true);
    expect(titles.some((t) => t.includes('KDRs Sellout Processing'))).toBe(true);
    const kdrInvoiceBtn = buttons.find((b) => (b.textContent || '').includes('KDRs Invoice Processing'))!;
    const kdrSelloutBtn = buttons.find((b) => (b.textContent || '').includes('KDRs Sellout Processing'))!;
    expect(kdrInvoiceBtn.getAttribute('aria-disabled')).toBe('false');
    expect(kdrSelloutBtn.getAttribute('aria-disabled')).toBe('false');
    kdrInvoiceBtn.click();
    kdrSelloutBtn.click();
    expect(calls.filter((c) => c === 'kdr').length).toBeGreaterThanOrEqual(2);
  });

  it('disables new KDRs buttons when kdr not authorized', async () => {
    const container = await render(
      <Dashboard
        authorized={['invoice']}
        onNavigate={() => {}}
        onLogout={() => {}}
      />,
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    const kdrInvoiceBtn = buttons.find((b) => Array.from(b.querySelectorAll('h3')).some((h) => (h.textContent || '').includes('KDRs Invoice Processing')))!;
    const kdrSelloutBtn = buttons.find((b) => Array.from(b.querySelectorAll('h3')).some((h) => (h.textContent || '').includes('KDRs Sellout Processing')))!;
    expect(kdrInvoiceBtn.getAttribute('aria-disabled')).toBe('true');
    expect(kdrSelloutBtn.getAttribute('aria-disabled')).toBe('true');
  });
});

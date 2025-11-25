import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildIndexFromCSV, authenticate, prefetchAuthData, __resetAuthIndex } from './auth';

const csv = `id,username,password,modules\n1,admin,admin123,"invoice,ga,kdr"\n2,alex,alex123,"invoice,kdr"\n3,sara,sara123,ga\n4,bochra,bochra123,kdr\n5,mixed,mixed123,"invoice,unknown,kdr"`;

describe('auth index parsing', () => {
  it('parses single module', () => {
    const idx = buildIndexFromCSV(csv);
    expect(idx.get('sara\0sara123')).toEqual(['ga']);
  });

  it('parses multiple modules', () => {
    const idx = buildIndexFromCSV(csv);
    expect(idx.get('admin\0admin123')).toEqual(['invoice', 'ga', 'kdr']);
  });

  it('filters unknown modules', () => {
    const idx = buildIndexFromCSV(csv);
    expect(idx.get('mixed\0mixed123')).toEqual(['invoice', 'kdr']);
  });
});

describe('session-backed authenticate', () => {
  beforeEach(() => {
    // jsdom provides sessionStorage
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses session cache when available', async () => {
    __resetAuthIndex();
    const idx = buildIndexFromCSV(csv);
    const entries = Array.from(idx.entries());
    sessionStorage.setItem('authIndexV1', JSON.stringify(entries));
    const res = await authenticate('alex', 'alex123');
    expect(res).toEqual(['invoice', 'kdr']);
  });

  it('falls back to network and builds index', async () => {
    __resetAuthIndex();
    const mockFetch = vi.fn((url: any) => {
      if (typeof url === 'string' && url.includes('/api/auth')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, text: async () => csv });
    });
    // @ts-expect-error override
    global.fetch = mockFetch;
    const res = await authenticate('bochra', 'bochra123');
    expect(res).toEqual(['kdr']);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('prefetch verification', () => {
  it('prefetches and stores index', async () => {
    const mockFetch = vi.fn((url: any) => {
      if (typeof url === 'string' && url.includes('/api/auth')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, text: async () => csv });
    });
    // @ts-expect-error override
    global.fetch = mockFetch;
    await prefetchAuthData();
    const stored = sessionStorage.getItem('authIndexV1');
    expect(stored).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
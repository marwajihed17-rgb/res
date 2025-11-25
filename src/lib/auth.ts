const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR21vntA5bTAeUWpzEUdGEXLmFUMqjH5LRUT5uPxmq3ipaHWqndB65-dli_kcmlw-jQKgu7Z6ERGeMh/pub?output=csv';

type ModuleId = 'invoice' | 'kdr' | 'ga';

let authIndex: Map<string, ModuleId[]> | null = null;

const normalizeModule = (name: string): ModuleId | null => {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (n.includes('invoice')) return 'invoice';
  if (n.includes('ga')) return 'ga';
  if (n.includes('kdr')) return 'kdr';
  return null;
};

const parseAuthorized = (modulesCell: string): ModuleId[] => {
  const items = modulesCell
    .split(',')
    .map((m) => normalizeModule(m))
    .filter(Boolean) as ModuleId[];
  return Array.from(new Set(items));
};

export const buildIndexFromCSV = (csv: string): Map<string, ModuleId[]> => {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idxUsername = header.indexOf('username');
  const idxPassword = header.indexOf('password');
  let idxModule = header.indexOf('modules');
  if (idxModule === -1) idxModule = header.indexOf('module');
  const map = new Map<string, ModuleId[]>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const u = (cols[idxUsername] || '').trim();
    const p = (cols[idxPassword] || '').trim();
    const modulesCell = cols.slice(idxModule).join(',');
    const modules = parseAuthorized(modulesCell);
    map.set(`${u}\0${p}`, modules);
  }
  return map;
};

async function parseWithWorker(csv: string): Promise<Map<string, ModuleId[]>> {
  try {
    const worker = new Worker(new URL('../workers/authIndexWorker.ts', import.meta.url), { type: 'module' });
    const entries = await new Promise<[string, ModuleId[]][]>((resolve, reject) => {
      const onMessage = (e: MessageEvent) => {
        worker.removeEventListener('message', onMessage as any);
        resolve(e.data as [string, ModuleId[]][]);
        worker.terminate();
      };
      const onError = (e: any) => {
        worker.removeEventListener('error', onError as any);
        reject(e);
        worker.terminate();
      };
      worker.addEventListener('message', onMessage as any);
      worker.addEventListener('error', onError as any);
      worker.postMessage(csv);
    });
    return new Map(entries);
  } catch {
    return buildIndexFromCSV(csv);
  }
}

export async function prefetchAuthData(): Promise<void> {
  try {
    // Prefer serverless API on Vercel; fallback to CSV
    const apiRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '__prefetch__', password: '__prefetch__' }),
    }).catch(() => null as any);
    if (apiRes && apiRes.ok) {
      // skip building index for dummy prefetch
      console.info('auth_prefetch_api_ok');
      return;
    }
    const t0 = performance.now();
    const res = await fetch(SHEET_CSV_URL, { cache: 'reload' });
    if (!res.ok) return;
    const csv = await res.text();
    const t1 = performance.now();
    const index = await parseWithWorker(csv);
    authIndex = index;
    console.info('auth_prefetch_ok', { rows: index.size });
    console.debug('auth_prefetch_net_ms', Math.round(t1 - t0));
    try {
      const serialized: [string, ModuleId[]][] = Array.from(index.entries());
      sessionStorage.setItem('authIndexV1', JSON.stringify(serialized));
    } catch {}
  } catch {}
}

export async function authenticate(
  username: string,
  password: string,
): Promise<ModuleId[] | null> {
  const key = `${username.trim()}\0${password.trim()}`;
  console.info('auth_attempt', { user: username.trim() });
  // Try serverless API first
  try {
    const api = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (api.ok) {
      const data = await api.json();
      const modules = Array.isArray(data.authorized) ? (data.authorized as ModuleId[]) : null;
      if (modules) return modules;
    }
  } catch {}
  if (authIndex) {
    const res = authIndex.get(key) || null;
    if (!res) console.warn('auth_validation_failed', { user: username.trim() });
    return res;
  }
  try {
    const cached = sessionStorage.getItem('authIndexV1');
    if (cached) {
      const entries = JSON.parse(cached) as [string, ModuleId[]][];
      authIndex = new Map(entries);
      const res = authIndex.get(key) || null;
      if (!res) console.warn('auth_validation_failed', { user: username.trim() });
      return res;
    }
  } catch {}

  const t0 = performance.now();
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) return null;
  const csv = await res.text();
  const index = await parseWithWorker(csv);
  authIndex = index;
  const out = index.get(key) || null;
  const t1 = performance.now();
  console.debug('auth_fallback_ms', Math.round(t1 - t0));
  if (!out) console.warn('auth_validation_failed', { user: username.trim() });
  return out;
}

export const authBench = {
  async run(username: string, password: string, iterations = 5) {
    const results: { baseline: number; optimized: number }[] = [];
    for (let i = 0; i < iterations; i++) {
      authIndex = null;
      sessionStorage.removeItem('authIndexV1');
      const t0 = performance.now();
      const r1 = await authenticate(username, password);
      const t1 = performance.now();
      const baseline = t1 - t0;

      await prefetchAuthData();
      const t2 = performance.now();
      const r2 = await authenticate(username, password);
      const t3 = performance.now();
      const optimized = t3 - t2;
      results.push({ baseline, optimized });
      console.log('iter', i + 1, {
        baseline_ms: Math.round(baseline),
        optimized_ms: Math.round(optimized),
        ok_baseline: !!r1,
        ok_optimized: !!r2,
      });
    }
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const baselineAvg = avg(results.map((r) => r.baseline));
    const optimizedAvg = avg(results.map((r) => r.optimized));
    const reduction = ((baselineAvg - optimizedAvg) / baselineAvg) * 100;
    console.log('auth_benchmark_summary', {
      baseline_avg_ms: Math.round(baselineAvg),
      optimized_avg_ms: Math.round(optimizedAvg),
      reduction_percent: Math.round(reduction),
    });
    return { baselineAvg, optimizedAvg, reduction };
  },
};

// expose in dev
if (typeof window !== 'undefined') {
  (window as any).authBench = authBench;
}

export function __resetAuthIndex() {
  authIndex = null;
}
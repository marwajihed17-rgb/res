export type ModuleId = 'invoice' | 'kdr' | 'ga';

const normalizeModule = (name: string): ModuleId | null => {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (n.includes('invoice')) return 'invoice';
  if (n.includes('ga')) return 'ga';
  if (n.includes('kdr')) return 'kdr';
  return null;
};

const parseAuthorized = (modulesCell: string): ModuleId[] => {
  const items = modulesCell.split(',').map((m) => normalizeModule(m)).filter(Boolean) as ModuleId[];
  return Array.from(new Set(items));
};

self.onmessage = (e: MessageEvent) => {
  const csv: string = e.data;
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idxUsername = header.indexOf('username');
  const idxPassword = header.indexOf('password');
  let idxModule = header.indexOf('modules');
  if (idxModule === -1) idxModule = header.indexOf('module');
  const entries: [string, ModuleId[]][] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const u = (cols[idxUsername] || '').trim();
    const p = (cols[idxPassword] || '').trim();
    const modulesCell = cols.slice(idxModule).join(',');
    const modules = parseAuthorized(modulesCell);
    entries.push([`${u}\0${p}`, modules]);
  }
  (self as any).postMessage(entries);
};
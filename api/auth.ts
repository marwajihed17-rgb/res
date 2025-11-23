import type { VercelRequest, VercelResponse } from '@vercel/node';

const SHEET_CSV_URL = process.env.SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR21vntA5bTAeUWpzEUdGEXLmFUMqjH5LRUT5uPxmq3ipaHWqndB65-dli_kcmlw-jQKgu7Z6ERGeMh/pub?output=csv';

type ModuleId = 'invoice' | 'kdr' | 'ga';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }
    const r = await fetch(SHEET_CSV_URL);
    if (!r.ok) return res.status(502).json({ error: 'Failed to fetch credentials' });
    const csv = await r.text();
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idxUsername = header.indexOf('username');
    const idxPassword = header.indexOf('password');
    let idxModule = header.indexOf('modules');
    if (idxModule === -1) idxModule = header.indexOf('module');
    const match = lines.slice(1).map((line) => line.split(',')).find((cols) => {
      const u = (cols[idxUsername] || '').trim();
      const p = (cols[idxPassword] || '').trim();
      return u === String(username).trim() && p === String(password).trim();
    });
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const modulesCell = match.slice(idxModule).join(',');
    const authorized = parseAuthorized(modulesCell);
    return res.status(200).json({ authorized });
  } catch (e: any) {
    console.error('api/auth error', e?.message || e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
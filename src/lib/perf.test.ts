import { describe, it, expect } from 'vitest';
import { buildIndexFromCSV } from './auth';

function generateCSV(rows: number) {
  const header = 'id,username,password,modules\n';
  const lines = [];
  for (let i = 1; i <= rows; i++) {
    const mods = i % 3 === 0 ? 'invoice,ga,kdr' : i % 2 === 0 ? 'invoice,kdr' : 'ga';
    lines.push(`${i},user${i},pass${i},"${mods}"`);
  }
  return header + lines.join('\n');
}

describe('buildIndexFromCSV performance', () => {
  it('parses 1000 rows within acceptable time', () => {
    const csv = generateCSV(1000);
    const t0 = performance.now();
    const idx = buildIndexFromCSV(csv);
    const t1 = performance.now();
    expect(idx.size).toBe(1000);
    expect(t1 - t0).toBeLessThan(200); // ms
  });
});
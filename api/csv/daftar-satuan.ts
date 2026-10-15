import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const possiblePaths = [
    path.join(process.cwd(), 'code', 'daftar-satuan.csv'),
    path.join(process.cwd(), 'src', 'code', 'daftar-satuan.csv'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const lines = content
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('#'));

        if (lines.length > 0) {
          const firstLine = lines[0].toLowerCase();
          const hasHeader =
            firstLine.includes('code') ||
            firstLine.includes('kode') ||
            firstLine.includes('satuan') ||
            firstLine.includes('unit');
          const start = hasHeader ? 1 : 0;
          const units = [];
          for (let i = start; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            if (cols[0] && cols[0].length > 0) {
              units.push({
                code: cols[0].toUpperCase(),
                name: cols[1] || cols[0],
              });
            }
          }
          if (units.length > 0) {
            return res.status(200).json(units);
          }
        }
      } catch (e) {
        console.error('Error reading satuan CSV in serverless function:', e);
      }
    }
  }

  // Fallback defaults
  return res.status(200).json([
    { code: 'PCS', name: 'pcs' },
    { code: 'KG', name: 'kg' },
    { code: 'LITER', name: 'liter' },
    { code: 'KARDUS', name: 'kardus' },
  ]);
}

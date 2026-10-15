import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const possiblePaths = [
    path.join(process.cwd(), 'code', 'daftar-barang.csv'),
    path.join(process.cwd(), 'src', 'code', 'daftar-barang.csv'),
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
            firstLine.includes('name') || firstLine.includes('nama') || firstLine.includes('barang');
          const start = hasHeader ? 1 : 0;
          const items = [];
          for (let i = start; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            if (cols[0] && cols[0].length > 0) {
              items.push({
                name: cols[0],
                code: cols[1] || undefined,
                category: cols[2] || undefined,
                defaultUnit: cols[3] || undefined,
              });
            }
          }
          if (items.length > 0) {
            return res.status(200).json(items);
          }
        }
      } catch (e) {
        console.error('Error reading CSV in serverless function:', e);
      }
    }
  }

  // Fallback defaults if file not accessible in serverless environment
  return res.status(200).json([
    { name: 'Isolasi Kertas' },
    { name: 'Isolasi bening' },
    { name: 'Isolasi coklat' },
    { name: 'Sarung tangan' },
  ]);
}

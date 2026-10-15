/**
 * Flexible CSV Parser for Items and Units
 * Supports:
 * 1. Standard CSV with headers (e.g. name,code,category,defaultUnit or code,name)
 * 2. Simple plain text lists (1 item per line, no header, e.g. "Isolasi Kertas")
 */

export interface ItemBarang {
  name: string;
  code?: string;
  category?: string;
  defaultUnit?: string;
}

export interface SatuanUnit {
  code: string;
  name: string;
}

export function parseItemsFromCSV(csvText: string): ItemBarang[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('name') ||
    firstLine.includes('nama') ||
    firstLine.includes('barang');

  const startIndex = hasHeader ? 1 : 0;
  const items: ItemBarang[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCSVLine(line);
    if (cols.length >= 1 && cols[0].trim().length > 0) {
      items.push({
        name: cols[0].trim(),
        code: cols[1]?.trim() || undefined,
        category: cols[2]?.trim() || undefined,
        defaultUnit: cols[3]?.trim() || undefined,
      });
    }
  }

  return items;
}

export function parseUnitsFromCSV(csvText: string): SatuanUnit[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('code') ||
    firstLine.includes('kode') ||
    firstLine.includes('satuan') ||
    firstLine.includes('u/m') ||
    firstLine.includes('unit');

  const startIndex = hasHeader ? 1 : 0;
  const units: SatuanUnit[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCSVLine(line);
    if (cols.length >= 1 && cols[0].trim().length > 0) {
      const codeVal = cols[0].trim().toUpperCase();
      const nameVal = cols[1]?.trim() || cols[0].trim();
      units.push({
        code: codeVal,
        name: nameVal,
      });
    }
  }

  return units;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

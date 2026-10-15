import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// File-backed storage for persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const MASTER_ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const MASTER_UNITS_FILE = path.join(DATA_DIR, 'units.json');
const STOCK_FILE = path.join(DATA_DIR, 'stock.json');
const PRPO_FILE = path.join(DATA_DIR, 'prpo.json');
const CONVERSIONS_FILE = path.join(DATA_DIR, 'conversions.json');
const ITEM_FORMULAS_FILE = path.join(DATA_DIR, 'item_formulas.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// In-memory or file-loaded data
let appSettings = readJsonFile(SETTINGS_FILE, {
  webhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  sheetNameKedatangan: 'Kedatangan',
  companyName: 'PT KMI Wire and Cable Tbk',
});

// Sync webhook from env if present and not previously configured
if (!appSettings.webhookUrl && process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
  appSettings.webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
}

let records = readJsonFile<any[]>(RECORDS_FILE, []);
let masterItems = readJsonFile<any[]>(MASTER_ITEMS_FILE, []);
let masterUnits = readJsonFile<any[]>(MASTER_UNITS_FILE, []);
let itemStocks = readJsonFile<any[]>(STOCK_FILE, []);
let itemPrPos = readJsonFile<any[]>(PRPO_FILE, []);
let conversionRules = readJsonFile<any[]>(CONVERSIONS_FILE, []);
let itemFormulas = readJsonFile<any[]>(ITEM_FORMULAS_FILE, []);

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    recordsCount: records.length,
    sheetsConnected: Boolean(appSettings.webhookUrl),
  });
});

// Settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(appSettings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  const { webhookUrl, sheetNameKedatangan, companyName } = req.body;
  appSettings = {
    ...appSettings,
    webhookUrl: typeof webhookUrl === 'string' ? webhookUrl.trim() : appSettings.webhookUrl,
    sheetNameKedatangan: sheetNameKedatangan?.trim() || 'Kedatangan',
    companyName: companyName?.trim() || 'PT KMI Wire and Cable Tbk',
  };
  writeJsonFile(SETTINGS_FILE, appSettings);
  res.json({ success: true, settings: appSettings });
});

// Master Items (Live CSV)
function getLiveDaftarBarang() {
  const rootPath = path.join(__dirname, 'code', 'daftar-barang.csv');
  const srcPath = path.join(__dirname, 'src', 'code', 'daftar-barang.csv');

  // Prefer the file with latest modification or whichever exists
  let targetPath = fs.existsSync(rootPath) ? rootPath : srcPath;
  if (!fs.existsSync(targetPath)) return [];

  // Sync between code/ and src/code/ if one was updated
  try {
    const content = fs.readFileSync(targetPath, 'utf-8');
    if (fs.existsSync(rootPath) && fs.existsSync(srcPath)) {
      const rootStat = fs.statSync(rootPath);
      const srcStat = fs.statSync(srcPath);
      if (rootStat.mtimeMs > srcStat.mtimeMs) {
        fs.writeFileSync(srcPath, content, 'utf-8');
      } else if (srcStat.mtimeMs > rootStat.mtimeMs) {
        fs.writeFileSync(rootPath, fs.readFileSync(srcPath, 'utf-8'), 'utf-8');
      }
    }

    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) return [];

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
    return items;
  } catch (err) {
    console.error('Error reading live barang CSV:', err);
    return [];
  }
}

function getLiveDaftarSatuan() {
  const rootPath = path.join(__dirname, 'code', 'daftar-satuan.csv');
  const srcPath = path.join(__dirname, 'src', 'code', 'daftar-satuan.csv');

  let targetPath = fs.existsSync(rootPath) ? rootPath : srcPath;
  if (!fs.existsSync(targetPath)) return [];

  try {
    const content = fs.readFileSync(targetPath, 'utf-8');
    if (fs.existsSync(rootPath) && fs.existsSync(srcPath)) {
      const rootStat = fs.statSync(rootPath);
      const srcStat = fs.statSync(srcPath);
      if (rootStat.mtimeMs > srcStat.mtimeMs) {
        fs.writeFileSync(srcPath, content, 'utf-8');
      } else if (srcStat.mtimeMs > rootStat.mtimeMs) {
        fs.writeFileSync(rootPath, fs.readFileSync(srcPath, 'utf-8'), 'utf-8');
      }
    }

    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) return [];

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
    return units;
  } catch (err) {
    console.error('Error reading live satuan CSV:', err);
    return [];
  }
}

app.get('/api/csv/daftar-barang', (_req: Request, res: Response) => {
  res.json(getLiveDaftarBarang());
});

app.get('/api/csv/daftar-satuan', (_req: Request, res: Response) => {
  res.json(getLiveDaftarSatuan());
});

// Master Items
app.get('/api/master/items', (_req: Request, res: Response) => {
  const live = getLiveDaftarBarang();
  if (live.length > 0) {
    return res.json(
      live.map((it, idx) => ({
        id: `csv-item-${idx + 1}`,
        name: it.name,
        code: it.code || `ITM-${String(idx + 1).padStart(3, '0')}`,
        category: it.category || 'Umum',
        defaultUnit: it.defaultUnit || 'PCS',
      }))
    );
  }
  res.json(masterItems);
});

app.post('/api/master/items', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    masterItems = req.body;
    writeJsonFile(MASTER_ITEMS_FILE, masterItems);
    // Sync back to CSV files
    try {
      const csvLines = masterItems.map((it: any) =>
        [it.name, it.code || '', it.category || '', it.defaultUnit || '']
          .filter((_, idx, arr) => idx === 0 || arr.slice(idx).some(Boolean))
          .join(',')
      );
      const csvText = csvLines.join('\n') + '\n';
      const rootPath = path.join(__dirname, 'code', 'daftar-barang.csv');
      const srcPath = path.join(__dirname, 'src', 'code', 'daftar-barang.csv');
      if (fs.existsSync(path.dirname(rootPath))) fs.writeFileSync(rootPath, csvText, 'utf-8');
      if (fs.existsSync(path.dirname(srcPath))) fs.writeFileSync(srcPath, csvText, 'utf-8');
    } catch (e) {
      console.error('Failed to sync master items to CSV:', e);
    }
    return res.json({ success: true, count: masterItems.length });
  }
  return res.status(400).json({ error: 'Body must be an array of items' });
});

// Master Units
app.get('/api/master/units', (_req: Request, res: Response) => {
  const live = getLiveDaftarSatuan();
  if (live.length > 0) {
    return res.json(
      live.map((u, idx) => ({
        id: `csv-unit-${idx + 1}`,
        code: u.code,
        name: u.name,
      }))
    );
  }
  res.json(masterUnits);
});

app.post('/api/master/units', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    masterUnits = req.body;
    writeJsonFile(MASTER_UNITS_FILE, masterUnits);
    try {
      const csvLines = masterUnits.map((u: any) =>
        u.name && u.name.toLowerCase() !== u.code.toLowerCase() ? `${u.code},${u.name}` : u.code.toLowerCase()
      );
      const csvText = csvLines.join('\n') + '\n';
      const rootPath = path.join(__dirname, 'code', 'daftar-satuan.csv');
      const srcPath = path.join(__dirname, 'src', 'code', 'daftar-satuan.csv');
      if (fs.existsSync(path.dirname(rootPath))) fs.writeFileSync(rootPath, csvText, 'utf-8');
      if (fs.existsSync(path.dirname(srcPath))) fs.writeFileSync(srcPath, csvText, 'utf-8');
    } catch (e) {
      console.error('Failed to sync master units to CSV:', e);
    }
    return res.json({ success: true, count: masterUnits.length });
  }
  return res.status(400).json({ error: 'Body must be an array of units' });
});

// ================= ITEM STOCK =================
app.get('/api/stock', (_req: Request, res: Response) => {
  res.json(itemStocks);
});

app.post('/api/stock', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    itemStocks = req.body;
    writeJsonFile(STOCK_FILE, itemStocks);
    return res.json({ success: true, count: itemStocks.length });
  }
  return res.status(400).json({ error: 'Body must be an array of item stocks' });
});

// ================= ITEM PR PO =================
app.get('/api/prpo', (_req: Request, res: Response) => {
  res.json(itemPrPos);
});

app.post('/api/prpo', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    itemPrPos = req.body;
    writeJsonFile(PRPO_FILE, itemPrPos);
    return res.json({ success: true, count: itemPrPos.length });
  }
  return res.status(400).json({ error: 'Body must be an array of PR PO items' });
});

// ================= CONVERSION RULES =================
app.get('/api/conversions', (_req: Request, res: Response) => {
  res.json(conversionRules);
});

app.post('/api/conversions', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    conversionRules = req.body;
    writeJsonFile(CONVERSIONS_FILE, conversionRules);
    return res.json({ success: true, count: conversionRules.length });
  }
  return res.status(400).json({ error: 'Body must be an array of conversion rules' });
});

// ================= ITEM UNIT FORMULAS (UPDATE SATUAN TERKECIL) =================
app.get('/api/item-formulas', (_req: Request, res: Response) => {
  res.json(itemFormulas);
});

app.post('/api/item-formulas', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    itemFormulas = req.body;
    writeJsonFile(ITEM_FORMULAS_FILE, itemFormulas);
    return res.json({ success: true, count: itemFormulas.length });
  }
  return res.status(400).json({ error: 'Body must be an array of item formulas' });
});

// Records list
app.get('/api/records', (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  if (type) {
    return res.json(records.filter((r) => r.type === type));
  }
  res.json(records);
});

// Clear records
app.delete('/api/records', (_req: Request, res: Response) => {
  records = [];
  writeJsonFile(RECORDS_FILE, records);
  res.json({ success: true, message: 'Semua riwayat berhasil dihapus.' });
});

// Test Google Sheets Webhook Connection
app.post('/api/test-sheets', async (req: Request, res: Response) => {
  const targetUrl = (req.body.webhookUrl || appSettings.webhookUrl || '').trim();
  if (!targetUrl) {
    return res.status(400).json({
      success: false,
      message: 'URL Google Apps Script Webhook belum diisi!',
    });
  }

  try {
    const testPayload = {
      action: 'ping',
      type: 'test',
      timestamp: new Date().toISOString(),
      source: 'PT KMI Wire and Cable Web App',
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const text = await response.text();
    let jsonResult = null;
    try {
      jsonResult = JSON.parse(text);
    } catch {
      // ignore
    }

    if (response.ok) {
      return res.json({
        success: true,
        status: response.status,
        message: 'Koneksi ke Google Apps Script berhasil terhubung!',
        details: jsonResult || text,
      });
    } else {
      return res.status(502).json({
        success: false,
        status: response.status,
        message: `Google Sheets merespon status ${response.status}`,
        details: text,
      });
    }
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    return res.status(500).json({
      success: false,
      message: `Gagal menghubungi Google Apps Script: ${error.message || error}`,
    });
  }
});

// Forward and submit form to Google Sheets
app.post('/api/submit', async (req: Request, res: Response) => {
  try {
    const submission = req.body;

    if (!submission || !submission.type || !submission.tanggal || !Array.isArray(submission.items)) {
      return res.status(400).json({
        success: false,
        message: 'Format data tidak valid: type, tanggal, dan items wajib diisi.',
      });
    }

    const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    const record = {
      id: transactionId,
      ...submission,
      createdAt: timestamp,
      syncedToSheets: false,
      syncError: null as string | null,
    };

    let syncResult: any = null;
    const webhookUrl = (process.env.GOOGLE_SHEETS_WEBHOOK_URL || appSettings.webhookUrl || '').trim();

    if (webhookUrl) {
      try {
        const payloadToSheets = {
          action: 'submit',
          type: 'kedatangan',
          sheetName: appSettings.sheetNameKedatangan || 'Kedatangan',
          tanggal: submission.tanggal,
          items: submission.items,
        };

        const sheetResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadToSheets),
        });

        const respText = await sheetResponse.text();
        let parsedResp: any = null;
        try {
          parsedResp = JSON.parse(respText);
        } catch {
          parsedResp = { raw: respText };
        }

        if (sheetResponse.ok) {
          record.syncedToSheets = true;
          syncResult = {
            success: true,
            status: sheetResponse.status,
            data: parsedResp,
          };
        } else {
          record.syncError = `HTTP ${sheetResponse.status}: ${respText}`;
        }
      } catch (err: any) {
        console.error('Failed to forward to Google Sheets:', err);
        record.syncError = err.message || 'Koneksi ke Google Sheets timeout / gagal.';
      }
    } else {
      record.syncError = 'Webhook URL Google Apps Script belum dikonfigurasi.';
    }

    // Save record to backend database
    records.unshift(record);
    // Keep max 500 records
    if (records.length > 500) records = records.slice(0, 500);
    writeJsonFile(RECORDS_FILE, records);

    return res.json({
      success: true,
      transactionId,
      record,
      synced: record.syncedToSheets,
      message: record.syncedToSheets
        ? 'Data berhasil disimpan dan otomatis terisi ke Google Spreadsheet!'
        : 'Data tersimpan di sistem lokal. Webhook Google Sheets belum diatur atau gagal sync.',
      syncResult,
    });
  } catch (error: any) {
    console.error('Submit error:', error);
    return res.status(500).json({
      success: false,
      message: `Terjadi kesalahan di server: ${error.message || error}`,
    });
  }
});

// ==================== SERVE FRONTEND ====================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite middleware loaded.');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Prod] Serving static build from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

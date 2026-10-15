// Vercel Serverless Function Handler for /api/submit
export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      syncError: null,
    };

    const webhookUrl = (process.env.GOOGLE_SHEETS_WEBHOOK_URL || req.body.webhookUrl || '').trim();

    if (webhookUrl) {
      try {
        const payloadToSheets = {
          action: 'submit',
          type: 'kedatangan',
          sheetName: req.body.sheetName || 'Kedatangan',
          tanggal: submission.tanggal,
          items: submission.items,
        };

        const sheetResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          return res.status(200).json({
            success: true,
            transactionId,
            record,
            synced: true,
            message: 'Data berhasil disimpan dan otomatis terisi ke Google Spreadsheet!',
            details: parsedResp,
          });
        } else {
          return res.status(200).json({
            success: true,
            transactionId,
            record,
            synced: false,
            message: `Tersimpan, namun Google Sheets mengembalikan kode ${sheetResponse.status}.`,
            details: respText,
          });
        }
      } catch (err: any) {
        return res.status(200).json({
          success: true,
          transactionId,
          record,
          synced: false,
          message: `Gagal mengirim ke Google Sheets: ${err.message}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      transactionId,
      record,
      synced: false,
      message: 'Data disimpan lokal. Masukkan URL Webhook Google Apps Script di Pengaturan untuk sync otomatis.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Terjadi error di server: ${error.message || error}`,
    });
  }
}

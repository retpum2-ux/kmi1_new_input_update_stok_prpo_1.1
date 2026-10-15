/**
 * Excel & CSV Export / Import Utilities for KMI Wire & Cable
 * Supports UTF-8 with BOM for 100% Microsoft Excel & Google Sheets compatibility
 */

export interface ExportColumn<T> {
  header: string;
  key?: keyof T;
  accessor?: (row: T, index: number) => string | number | undefined | null;
}

/**
 * Trigger file download directly in browser
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Escape CSV field according to RFC 4180
 */
function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate CSV string with UTF-8 BOM
 */
export function generateCsv<T>(data: T[], columns: ExportColumn<T>[]): string {
  const BOM = '\uFEFF';
  const headers = columns.map((c) => escapeCsvField(c.header)).join(',');
  const rows = data.map((row, idx) => {
    return columns
      .map((col) => {
        let val: any = '';
        if (col.accessor) {
          val = col.accessor(row, idx);
        } else if (col.key) {
          val = row[col.key];
        }
        return escapeCsvField(val);
      })
      .join(',');
  });

  return BOM + [headers, ...rows].join('\r\n');
}

/**
 * Export data array to CSV file (Excel-ready)
 */
export function exportToCsv<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  const csvContent = generateCsv(data, columns);
  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  triggerFileDownload(csvContent, cleanFilename, 'text/csv;charset=utf-8;');
}

/**
 * Generate native Excel HTML table (.xls)
 * Allows Microsoft Excel to open directly with styling, bold headers, and column widths
 */
export function exportToExcelXml<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = 'Ringkasan'
) {
  const cleanFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xls`;

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  th { background-color: #2e7d32; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #999; }
  td { padding: 6px; border: 1px solid #ccc; font-family: Arial, sans-serif; font-size: 11pt; }
  .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; }
  .text { mso-number-format:"\\@"; }
  .date { mso-number-format:"yyyy\\-mm\\-dd"; text-align: center; }
</style>
</head>
<body>
  <table>
    <thead>
      <tr>
        ${columns.map((col) => `<th>${col.header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>`;

  data.forEach((row, idx) => {
    tableHtml += '<tr>';
    columns.forEach((col) => {
      let val: any = '';
      if (col.accessor) {
        val = col.accessor(row, idx);
      } else if (col.key) {
        val = row[col.key];
      }
      const safeVal = val === null || val === undefined ? '' : String(val);
      tableHtml += `<td>${safeVal}</td>`;
    });
    tableHtml += '</tr>';
  });

  tableHtml += `
    </tbody>
  </table>
</body>
</html>`;

  triggerFileDownload(tableHtml, cleanFilename, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Flexible client-side CSV parser for Import features
 */
export function parseUploadedCsv(csvText: string): { headers: string[]; rows: string[][] } {
  if (!csvText || !csvText.trim()) return { headers: [], rows: [] };

  // Remove BOM if present
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.trim().startsWith('#'));
  if (lines.length === 0) return { headers: [], rows: [] };

  const parsedLines = lines.map((line) => {
    const row: string[] = [];
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
        row.push(current.trim());
        current = '';
      } else if (char === ';' && !inQuotes && !line.includes(',')) {
        // Support semicolon separated CSV from European/Indonesian Excel
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row.map((c) => c.replace(/^"|"$/g, '').trim());
  });

  const headers = parsedLines[0] || [];
  const rows = parsedLines.slice(1);

  return { headers, rows };
}

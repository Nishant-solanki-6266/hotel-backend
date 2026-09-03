import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
import { parse as csvParse } from 'csv-parse/sync';

/** Parse a multer file buffer and return plain text */
export async function parseFile(file) {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided for parsing');
  }

  const ext = (file.originalname || '').split('.').pop().toLowerCase();
  const mime = file.mimetype || '';
  const buffer = file.buffer;

  if (mime === 'application/pdf' || ext === 'pdf') {
    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(buffer);
      return data.text || '';
    } else if (pdfParseModule?.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer }, {});
      const res = await parser.getText();
      return res.text || '';
    } else if (pdfParseModule?.default && typeof pdfParseModule.default === 'function') {
      const data = await pdfParseModule.default(buffer);
      return data.text || '';
    }
  }

  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
    const raw = buffer.toString('utf8');
    const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (xmlMatches && xmlMatches.length > 0) {
      return xmlMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
    }
    const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
    return cleaned || raw;
  }

  if (mime === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf8');
  }

  if (mime === 'text/csv' || ext === 'csv') {
    const records = csvParse(buffer, { columns: false, skip_empty_lines: true });
    return records.map(row => row.join(',')).join('\n');
  }

  throw new Error(`Unsupported file type: ${mime || ext}`);
}

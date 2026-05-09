/**
 * csvImport.js
 * ------------
 * Parses an uploaded CSV file using PapaParse and inserts the rows
 * into the accounts table via a bulk transaction.
 *
 * Expected CSV columns (case-insensitive):
 *   company, contact_name, email, stage, revenue, last_contacted, created_at
 */

const Papa   = require('papaparse');
const fs     = require('fs');
const { bulkInsert } = require('./queries');

const VALID_STAGES = new Set(['Lead','Qualified','Proposal','Negotiation','Won','Lost']);

/**
 * Normalize a raw CSV row into a clean DB-ready object.
 * Unknown stages default to 'Lead'. Missing revenue defaults to 0.
 */
function normalizeRow(raw) {
  // Make field lookup case-insensitive
  const row = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  const stage = row['stage'] && VALID_STAGES.has(row['stage'])
    ? row['stage']
    : 'Lead';

  const revenue = parseFloat(row['revenue']) || 0;

  // Validate date format — store as YYYY-MM-DD or null
  const rawDate     = row['last_contacted'] || '';
  const last_contacted = rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate : null;

  const rawCreated  = row['created_at'] || '';
  const created_at  = rawCreated.match(/^\d{4}-\d{2}-\d{2}$/)
    ? rawCreated
    : new Date().toISOString().slice(0, 10);

  return {
    company:       (row['company']      || '').trim() || 'Unknown',
    contact_name:  (row['contact_name'] || '').trim() || null,
    email:         (row['email']        || '').trim() || null,
    stage,
    revenue,
    last_contacted,
    created_at,
  };
}

/**
 * importCsv(filePath)
 * Reads a CSV file from disk, parses it, normalizes each row,
 * and bulk-inserts into the database.
 * Returns { imported, skipped }.
 */
function importCsv(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const { data, errors } = Papa.parse(fileContent, {
    header:        true,
    skipEmptyLines: true,
    trimHeaders:   true,
  });

  if (errors.length > 0) {
    const fatal = errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
    if (fatal.length > 0) {
      throw new Error(`CSV parse error: ${fatal[0].message}`);
    }
  }

  const rows = [];
  let skipped = 0;

  for (const raw of data) {
    const company = (raw['company'] || raw['Company'] || '').trim();
    if (!company) {
      skipped++;
      continue;   // skip rows with no company name
    }
    rows.push(normalizeRow(raw));
  }

  bulkInsert(rows);

  // Clean up the uploaded temp file
  try { fs.unlinkSync(filePath); } catch (_) {}

  return { imported: rows.length, skipped };
}

module.exports = { importCsv };

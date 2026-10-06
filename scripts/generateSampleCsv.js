/**
 * generateSampleCsv.js
 * --------------------
 * Generates a CSV of synthetic CRM records.
 *
 *   node scripts/generateSampleCsv.js <rowCount> <outputPath>
 *
 * Defaults to 50 rows written to sample-data/sample_crm.csv.
 * Used to produce both the small demo file and the 10,000 row file
 * the benchmark runs against.
 */

const fs = require('fs');
const path = require('path');

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const PREFIXES = [
  'Northwind', 'Acme', 'Vertex', 'Blue Harbor', 'Cedar', 'Pinnacle', 'Lumen',
  'Ironside', 'Meridian', 'Copperfield', 'Granite', 'Orchard', 'Tidewater',
  'Summit', 'Redwood', 'Lakeshore', 'Brightline', 'Stonebridge', 'Eastgate',
  'Fairview', 'Hollis', 'Juniper', 'Kingsley', 'Maplewood', 'Norbury',
];

const SUFFIXES = [
  'Logistics', 'Analytics', 'Systems', 'Partners', 'Group', 'Industries',
  'Technologies', 'Holdings', 'Labs', 'Supply Co', 'Works', 'Consulting',
  'Dynamics', 'Networks', 'Solutions',
];

const FIRST_NAMES = [
  'Dana', 'Marcus', 'Priya', 'Tomas', 'Aisha', 'Ben', 'Clara', 'Devon',
  'Elena', 'Franklin', 'Grace', 'Hassan', 'Ingrid', 'Julian', 'Kofi',
  'Lydia', 'Mateo', 'Nadia', 'Omar', 'Rosa', 'Simon', 'Tessa',
];

const LAST_NAMES = [
  'Reyes', 'Okafor', 'Nguyen', 'Delgado', 'Carter', 'Haddad', 'Lindqvist',
  'Boateng', 'Moreau', 'Silva', 'Tanaka', 'Whitfield', 'Abara', 'Costa',
  'Mensah', 'Novak', 'Prasad', 'Quinn', 'Rivera', 'Stern',
];

// Deterministic pseudo-random generator so repeated runs produce the same file.
// Makes benchmark numbers reproducible instead of drifting between runs.
function makeRandom(seed) {
  let state = seed;
  return function next() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pick(random, list) {
  const index = Math.floor(random() * list.length);
  return list[index];
}

/** Returns an ISO date string `daysAgo` days before today. */
function dateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

/** Wraps a field in quotes when it contains a comma or quote character. */
function escapeCsvField(value) {
  const text = String(value);
  if (text.includes(',') || text.includes('"')) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function generateRows(rowCount, seed) {
  const random = makeRandom(seed);
  const rows = [];

  for (let i = 0; i < rowCount; i += 1) {
    const prefix = pick(random, PREFIXES);
    const suffix = pick(random, SUFFIXES);
    const company = `${prefix} ${suffix}`;

    const firstName = pick(random, FIRST_NAMES);
    const lastName = pick(random, LAST_NAMES);
    const contactName = `${firstName} ${lastName}`;

    const emailLocal = (firstName + '.' + lastName).toLowerCase();
    const emailDomain = prefix.toLowerCase().replace(/[^a-z]/g, '') + '.example.com';
    const email = `${emailLocal}@${emailDomain}`;

    const stage = pick(random, STAGES);

    // Revenue between 2,000 and 250,000, rounded to the nearest hundred
    const revenue = Math.round((2000 + random() * 248000) / 100) * 100;

    // About 8% of records have never been contacted
    const neverContacted = random() < 0.08;
    const lastContacted = neverContacted ? '' : dateDaysAgo(Math.floor(random() * 180));

    const createdAt = dateDaysAgo(180 + Math.floor(random() * 365));

    rows.push([company, contactName, email, stage, revenue, lastContacted, createdAt]);
  }

  return rows;
}

function main() {
  const rowCount = parseInt(process.argv[2], 10) || 50;
  const relativeOutput = process.argv[3] || 'sample-data/sample_crm.csv';
  const outputPath = path.resolve(process.cwd(), relativeOutput);

  const header = 'company,contact_name,email,stage,revenue,last_contacted,created_at';
  const rows = generateRows(rowCount, 20260406);

  const lines = [header];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','));
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');

  console.log(`Wrote ${rowCount} rows to ${relativeOutput}`);
}

main();

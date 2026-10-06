/**
 * seed.js
 * -------
 * Loads a CSV directly into the database without going through the HTTP API.
 * Useful for seeding a large dataset before running the benchmark.
 *
 *   node scripts/seed.js sample-data/sample_crm_10k.csv
 */

const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');

// Run from the backend directory so better-sqlite3 resolves and the database
// file lands next to the server, exactly where the API expects it.
process.chdir(backendDir);

const { importCsv } = require(path.join(backendDir, 'csvImport'));

const inputArg = process.argv[2];

if (!inputArg) {
  console.error('Usage: node scripts/seed.js <path-to-csv>');
  process.exit(1);
}

// Resolve against the repo root, since that is where the user runs the command
const csvPath = path.resolve(__dirname, '..', inputArg);

const start = Date.now();
const result = importCsv(csvPath, { keepSourceFile: true });
const elapsed = Date.now() - start;

console.log(`Imported ${result.imported} rows in ${elapsed}ms (${result.skipped} skipped).`);

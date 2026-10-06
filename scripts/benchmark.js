/**
 * benchmark.js
 * ------------
 * Measures query latency against a populated database.
 *
 *   node scripts/benchmark.js
 *
 * Runs each dashboard query many times and reports median and p95 latency.
 * Run it twice, once with the indexes dropped and once with them in place,
 * to see what the indexing actually buys. Pass --no-index to drop them first.
 *
 * The backend must have been seeded already (see README).
 */

const path = require('path');
const Database = require(path.join(__dirname, '..', 'backend', 'node_modules', 'better-sqlite3'));

const DB_PATH = path.join(__dirname, '..', 'backend', 'crm.db');
const ITERATIONS = 200;

const db = new Database(DB_PATH, { readonly: false });

const dropIndexes = process.argv.includes('--no-index');

if (dropIndexes) {
  db.exec(`
    DROP INDEX IF EXISTS idx_stage;
    DROP INDEX IF EXISTS idx_last_contacted;
    DROP INDEX IF EXISTS idx_revenue;
    DROP INDEX IF EXISTS idx_company;
  `);
  console.log('Indexes dropped for this run.\n');
} else {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stage          ON accounts(stage);
    CREATE INDEX IF NOT EXISTS idx_last_contacted ON accounts(last_contacted);
    CREATE INDEX IF NOT EXISTS idx_revenue        ON accounts(revenue);
    CREATE INDEX IF NOT EXISTS idx_company        ON accounts(company);
  `);
}

const rowCount = db.prepare('SELECT COUNT(*) AS count FROM accounts').get().count;

if (rowCount === 0) {
  console.error('The accounts table is empty. Seed it first:');
  console.error('  node scripts/generateSampleCsv.js 10000 sample-data/sample_crm_10k.csv');
  console.error('  node scripts/seed.js sample-data/sample_crm_10k.csv');
  process.exit(1);
}

/* ── Queries under test ──────────────────────────────────────── */

const QUERIES = [
  {
    name: 'Accounts filtered by stage, sorted by revenue',
    statement: db.prepare(
      'SELECT * FROM accounts WHERE stage = ? ORDER BY revenue DESC'
    ),
    run(statement) {
      return statement.all('Negotiation');
    },
  },
  {
    name: 'Company search (LIKE)',
    statement: db.prepare(
      'SELECT * FROM accounts WHERE company LIKE ? OR contact_name LIKE ? ORDER BY company ASC'
    ),
    run(statement) {
      return statement.all('%Cedar%', '%Cedar%');
    },
  },
  {
    name: 'Overdue follow ups (30+ days)',
    statement: db.prepare(
      `SELECT * FROM accounts
       WHERE last_contacted IS NULL
          OR last_contacted < date('now', '-' || ? || ' days')
       ORDER BY last_contacted ASC`
    ),
    run(statement) {
      return statement.all(30);
    },
  },
  {
    name: 'Aggregation grouped by stage',
    statement: db.prepare(
      `SELECT stage, COUNT(*) AS count, COALESCE(SUM(revenue), 0) AS total_revenue
       FROM accounts GROUP BY stage ORDER BY count DESC`
    ),
    run(statement) {
      return statement.all();
    },
  },
];

/* ── Timing helpers ──────────────────────────────────────────── */

function percentile(sortedValues, fraction) {
  const index = Math.min(
    sortedValues.length - 1,
    Math.floor(sortedValues.length * fraction)
  );
  return sortedValues[index];
}

function measure(query) {
  // Warm up so we are not timing first-run statement preparation
  for (let i = 0; i < 20; i += 1) {
    query.run(query.statement);
  }

  const timings = [];
  let lastRowCount = 0;

  for (let i = 0; i < ITERATIONS; i += 1) {
    const start = process.hrtime.bigint();
    const rows = query.run(query.statement);
    const end = process.hrtime.bigint();

    lastRowCount = rows.length;
    timings.push(Number(end - start) / 1e6); // nanoseconds to milliseconds
  }

  timings.sort(function (a, b) {
    return a - b;
  });

  return {
    median: percentile(timings, 0.5),
    p95: percentile(timings, 0.95),
    max: timings[timings.length - 1],
    rows: lastRowCount,
  };
}

/* ── Report ──────────────────────────────────────────────────── */

console.log(`Dataset: ${rowCount.toLocaleString()} rows`);
console.log(`Iterations per query: ${ITERATIONS}`);
console.log(`Indexes: ${dropIndexes ? 'DROPPED' : 'present'}`);
console.log('');

let slowestP95 = 0;

for (const query of QUERIES) {
  const result = measure(query);
  slowestP95 = Math.max(slowestP95, result.p95);

  console.log(query.name);
  console.log(
    `  median ${result.median.toFixed(2)}ms` +
      `   p95 ${result.p95.toFixed(2)}ms` +
      `   max ${result.max.toFixed(2)}ms` +
      `   (${result.rows.toLocaleString()} rows returned)`
  );
  console.log('');
}

console.log(`Slowest p95 across all queries: ${slowestP95.toFixed(2)}ms`);

db.close();

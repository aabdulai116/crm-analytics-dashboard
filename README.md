# CRM Analytics Dashboard

A full stack CRM analytics tool built with React, Node.js, Express and SQLite.
Import a CSV of sales records, then explore pipeline health, revenue by stage,
and accounts that have gone quiet.

![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![SQLite](https://img.shields.io/badge/SQLite-3-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Features

- **CSV import** through the browser, parsed and bulk inserted in a single transaction
- **KPI tiles** for total accounts, open deals, closed won revenue, and overdue follow ups
- **Deals by stage** bar chart built from a SQL aggregation
- **Accounts table** with server side search, stage filtering and sortable columns
- **Overdue follow ups** panel with a configurable day window
- **REST API** with parameterized SQL throughout, so no user input is concatenated into a query
- **Reproducible benchmark** script with published results, see [BENCHMARK.md](BENCHMARK.md)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 (WAL mode) |
| CSV parsing | PapaParse |
| Upload handling | Multer |

---

## Project structure

```
crm-analytics-dashboard/
├── backend/
│   ├── server.js            # Express app and REST routes
│   ├── db.js                # SQLite setup, schema, indexes
│   ├── queries.js           # Prepared statements and query functions
│   ├── csvImport.js         # CSV parsing and bulk insert
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js       # Dev server proxies /api to :3001
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          # Data fetching and layout
│       ├── api.js           # Typed wrapper around the REST API
│       ├── styles.css
│       └── components/
│           ├── MetricCard.jsx
│           ├── StageChart.jsx
│           ├── AccountsTable.jsx
│           ├── OverduePanel.jsx
│           └── CsvUploader.jsx
├── scripts/
│   ├── generateSampleCsv.js # Deterministic synthetic data generator
│   ├── seed.js              # Loads a CSV straight into the database
│   └── benchmark.js         # Query latency measurement
├── sample-data/
│   └── sample_crm.csv       # 50 rows to try the app immediately
├── BENCHMARK.md
└── README.md
```

---

## Getting started

Requires Node.js 18 or newer.

```bash
git clone https://github.com/aabdulai116/crm-analytics-dashboard.git
cd crm-analytics-dashboard
npm run install:all
```

Start the backend on port 3001:

```bash
npm run start:backend
```

In a second terminal, start the frontend on port 5173:

```bash
npm run start:frontend
```

Open http://localhost:5173, click **Import CSV**, and choose
`sample-data/sample_crm.csv`.

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/import` | Upload a CSV (multipart field `file`) |
| `GET` | `/api/accounts` | Accounts, filterable and sortable |
| `GET` | `/api/accounts/overdue` | Accounts not contacted in N days |
| `GET` | `/api/metrics/summary` | Total accounts, open deals, won revenue, stage breakdown |
| `GET` | `/api/metrics/by-stage` | Deal count and revenue grouped by stage |
| `DELETE` | `/api/data/reset` | Clear all imported data |

### Query parameters for `GET /api/accounts`

| Param | Example | Description |
|---|---|---|
| `stage` | `?stage=Negotiation` | Filter by pipeline stage |
| `search` | `?search=Cedar` | Match company, contact name or email |
| `sort` | `?sort=revenue` | Sort column, validated against an allowlist |
| `order` | `?order=desc` | `asc` or `desc` |

Sort and order are checked against an allowlist before being interpolated,
since column names cannot be bound as SQL parameters. Every value filter uses
bound parameters.

---

## CSV format

Headers are matched case insensitively.

```
company,contact_name,email,stage,revenue,last_contacted,created_at
```

- `company` is required; rows without one are skipped and counted
- `stage` must be one of `Lead`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`, and falls back to `Lead`
- `revenue` is parsed as a number, defaulting to 0
- `last_contacted` and `created_at` must be `YYYY-MM-DD`; invalid dates become null

---

## Performance

Full measured results, including the method and the commands to reproduce
them, are in [BENCHMARK.md](BENCHMARK.md).

Summary at 10,000 rows: every dashboard query completes in under 25 ms at p95,
and the indexes defined in `db.js` make no measurable difference at this scale.
They are retained because they are the correct structure as the table grows,
not because they produced a speedup here. The benchmark exists so that claim
can be checked rather than assumed.

```bash
npm run generate:10k
npm run seed:10k
npm run benchmark
```

---

## License

MIT

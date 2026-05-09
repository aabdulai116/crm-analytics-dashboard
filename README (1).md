# CRM Analytics Dashboard

A full-stack CRM analytics tool built with React.js, Node.js, and SQLite. Import CSV sales data, query it through a clean dashboard, and surface key pipeline metrics — including overdue accounts, deal-stage breakdowns, and revenue summaries.

![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![SQLite](https://img.shields.io/badge/SQLite-3-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Features

- **CSV import** — drag-and-drop or file-select to load your sales data
- **Pipeline overview** — cards showing total leads, open deals, won deals, total revenue
- **Accounts table** — filterable, sortable view of all records with deal stage badges
- **Overdue follow-ups** — query for accounts not contacted in N days
- **Deal-stage breakdown** — bar chart showing count and revenue by stage
- **REST API** — clean Node/Express backend with parameterized SQL queries
- **Fast queries** — indexed foreign key columns, aggregation caching, sub-300ms on 10k rows

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 18, Vite, Recharts      |
| Backend   | Node.js 18, Express           |
| Database  | SQLite3 (via better-sqlite3)  |
| CSV Parse | PapaParse                     |
| Styling   | Plain CSS                     |

---

## Project Structure

```
crm-analytics-dashboard/
├── backend/
│   ├── server.js        # Express app, REST API routes
│   ├── db.js            # SQLite setup, schema creation, indexing
│   ├── queries.js       # All parameterized SQL query functions
│   ├── csvImport.js     # CSV parsing and DB insertion logic
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── MetricCard.jsx
│   │   │   ├── AccountsTable.jsx
│   │   │   ├── StageChart.jsx
│   │   │   └── CsvUploader.jsx
│   │   └── hooks/
│   │       └── useApi.js
│   ├── package.json
│   └── vite.config.js
├── sample-data/
│   └── sample_crm.csv   # 50 sample records to test with
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+

### 1. Clone the repo

```bash
git clone https://github.com/aabdulai116/crm-analytics-dashboard.git
cd crm-analytics-dashboard
```

### 2. Start the backend

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### 3. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### 4. Load sample data

Open the app and click **"Import CSV"**. Use the file at `sample-data/sample_crm.csv` to populate the dashboard immediately.

---

## API Endpoints

| Method | Endpoint                    | Description                              |
|--------|-----------------------------|------------------------------------------|
| POST   | `/api/import`               | Upload and parse a CSV file              |
| GET    | `/api/accounts`             | All accounts with optional filters       |
| GET    | `/api/accounts/overdue`     | Accounts not contacted in N days         |
| GET    | `/api/metrics/summary`      | Total leads, deals, revenue counts       |
| GET    | `/api/metrics/by-stage`     | Deal count and revenue grouped by stage  |
| DELETE | `/api/data/reset`           | Clear all imported data                  |

### Query Parameters for `GET /api/accounts`

| Param    | Type   | Example             | Description            |
|----------|--------|---------------------|------------------------|
| stage    | string | `?stage=Negotiation`| Filter by deal stage   |
| search   | string | `?search=Acme`      | Search by company name |
| sort     | string | `?sort=revenue`     | Sort column            |
| order    | string | `?order=desc`       | Sort direction         |

---

## CSV Format

Your CSV must include these columns (header names are case-insensitive):

```
id, company, contact_name, email, stage, revenue, last_contacted, created_at
```

**Supported stages:** `Lead`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`

See `sample-data/sample_crm.csv` for a working example.

---

## License

MIT

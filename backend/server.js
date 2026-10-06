/**
 * server.js
 * ---------
 * Express REST API for the CRM Analytics Dashboard.
 *
 * Routes:
 *   POST   /api/import              — CSV file upload and import
 *   GET    /api/accounts            — All accounts (filterable, sortable)
 *   GET    /api/accounts/overdue    — Accounts overdue for follow-up
 *   GET    /api/metrics/summary     — Aggregate KPI metrics
 *   GET    /api/metrics/by-stage    — Revenue + count grouped by stage
 *   DELETE /api/data/reset          — Clear all imported data
 */

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const { importCsv }                                              = require('./csvImport');
const { getAccounts, getOverdueAccounts, getSummaryMetrics,
        getByStage, resetData }                                  = require('./queries');

const app    = express();
const PORT   = process.env.PORT || 3001;

// Temp folder for CSV uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const upload = multer({
  dest:   UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith('.csv')) {
      return cb(new Error('Only .csv files are accepted.'));
    }
    cb(null, true);
  }
});

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

/* ── Health ──────────────────────────────────────── */

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/* ── CSV Import ──────────────────────────────────── */

app.post('/api/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send file as multipart field "file".' });
  }
  try {
    const result = importCsv(req.file.path);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

/* ── Accounts ────────────────────────────────────── */

app.get('/api/accounts', (req, res) => {
  try {
    const { stage, search, sort, order } = req.query;
    const rows = getAccounts({ stage, search, sort, order });
    res.json({ count: rows.length, accounts: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NOTE: /overdue must be registered BEFORE /api/accounts/:id if you add that later
app.get('/api/accounts/overdue', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const rows = getOverdueAccounts(days);
    res.json({ days, count: rows.length, accounts: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Metrics ─────────────────────────────────────── */

app.get('/api/metrics/summary', (_req, res) => {
  try {
    res.json(getSummaryMetrics());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics/by-stage', (_req, res) => {
  try {
    res.json(getByStage());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Reset ───────────────────────────────────────── */

app.delete('/api/data/reset', (_req, res) => {
  try {
    resetData();
    res.json({ success: true, message: 'All data cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Error handler ───────────────────────────────── */

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CRM backend running at http://localhost:${PORT}`);
});

# Query benchmark

Measured results for the dashboard queries, so the performance numbers in this
repo can be reproduced rather than taken on trust.

## How to reproduce

```bash
npm run install:all
npm run generate:10k     # writes sample-data/sample_crm_10k.csv
npm run seed:10k         # loads it into backend/crm.db
npm run benchmark        # 200 iterations per query, warm cache
```

To see what the indexes contribute, run `npm run benchmark:no-index`, which
drops them first. Re-running `npm run benchmark` recreates them.

## Results

Dataset: 10,000 rows. 200 iterations per query after a 20 iteration warm up.
Measured with `process.hrtime.bigint()` around the `better-sqlite3` call only,
so these are query times and do not include HTTP or render time.

Environment: Node.js 22, Linux container, SQLite in WAL mode.

### With indexes present

| Query | Median | p95 | Rows returned |
|---|---|---|---|
| Accounts filtered by stage, sorted by revenue | 3.99 ms | 5.69 ms | 1,711 |
| Company search (`LIKE`) | 3.68 ms | 4.24 ms | 441 |
| Overdue follow ups (30+ days) | 16.94 ms | 23.35 ms | 8,418 |
| Aggregation grouped by stage | 1.89 ms | 2.21 ms | 6 |

Slowest p95 across all queries: **23.35 ms**

### With indexes dropped

| Query | Median | p95 | Rows returned |
|---|---|---|---|
| Accounts filtered by stage, sorted by revenue | 4.30 ms | 9.16 ms | 1,711 |
| Company search (`LIKE`) | 2.07 ms | 2.95 ms | 441 |
| Overdue follow ups (30+ days) | 18.12 ms | 22.20 ms | 8,418 |
| Aggregation grouped by stage | 2.38 ms | 2.63 ms | 6 |

Slowest p95 across all queries: **22.20 ms**

## What the numbers actually show

Two honest conclusions, both worth stating plainly:

**SQLite is already fast at this scale.** Every query finishes well under
25 ms on 10,000 rows. There was never a 300 ms problem to solve here. A single
table of this size fits comfortably in page cache, and a full scan of 10,000
rows is cheap.

**The indexes make no measurable difference at 10,000 rows.** The two runs are
within noise of each other. A few reasons:

- `LIKE '%term%'` cannot use a B-tree index at all, because the pattern is not
  left anchored. That query is a full scan either way.
- The overdue query returns 8,418 of 10,000 rows. When a query touches most of
  the table, scanning is cheaper than walking an index and dereferencing rows.
- `GROUP BY stage` over six distinct values aggregates the whole table
  regardless.

The indexes are still defined in `backend/db.js`. They are the right structure
to have as the table grows, and they would begin to matter at a few hundred
thousand rows or with a left anchored search. But claiming they produced a
speedup at 10,000 rows would not be true, and this file exists so the repo does
not make that claim.

## Where the real latency is

For the dashboard as a user experiences it, query time is not the bottleneck.
The larger costs are JSON serialization of large result sets and rendering rows
in the browser. That is why `AccountsTable` renders only the first 100 rows
while still reporting the full server side count, and why filtering and sorting
run in SQL rather than in JavaScript.

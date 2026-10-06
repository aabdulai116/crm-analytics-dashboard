/**
 * api.js
 * ------
 * Thin wrapper around the backend REST API.
 * Every call goes through the Vite dev proxy to http://localhost:3001.
 */

const BASE = '/api';

async function request(path, options) {
  const response = await fetch(BASE + path, options);

  let payload;
  try {
    payload = await response.json();
  } catch (parseError) {
    throw new Error(`Server returned a non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

/** GET /api/metrics/summary -> { total_accounts, open_deals, won_revenue, by_stage } */
export function fetchSummary() {
  return request('/metrics/summary');
}

/** GET /api/metrics/by-stage -> [{ stage, count, total_revenue }] */
export function fetchByStage() {
  return request('/metrics/by-stage');
}

/** GET /api/accounts -> { count, accounts } */
export function fetchAccounts({ stage, search, sort, order } = {}) {
  const params = new URLSearchParams();

  if (stage) {
    params.set('stage', stage);
  }
  if (search) {
    params.set('search', search);
  }
  if (sort) {
    params.set('sort', sort);
  }
  if (order) {
    params.set('order', order);
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : '';

  return request(`/accounts${suffix}`);
}

/** GET /api/accounts/overdue -> { days, count, accounts } */
export function fetchOverdue(days) {
  return request(`/accounts/overdue?days=${encodeURIComponent(days)}`);
}

/** POST /api/import (multipart) -> { success, imported, skipped } */
export function importCsv(file) {
  const form = new FormData();
  form.append('file', file);

  return request('/import', { method: 'POST', body: form });
}

/** DELETE /api/data/reset -> { success, message } */
export function resetData() {
  return request('/data/reset', { method: 'DELETE' });
}

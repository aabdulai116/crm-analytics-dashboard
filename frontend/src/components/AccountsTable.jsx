import React from 'react'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

const SORTABLE_COLUMNS = [
  { key: 'company', label: 'Company' },
  { key: 'stage', label: 'Stage' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'last_contacted', label: 'Last contacted' },
]

/**
 * Filterable, sortable table of account rows.
 * Filtering and sorting are performed by the backend, not in the browser,
 * so the table stays responsive on large imports.
 */
export default function AccountsTable({
  accounts,
  count,
  filters,
  onFilterChange,
  loading,
}) {
  function handleSort(columnKey) {
    const isSameColumn = filters.sort === columnKey
    const nextOrder = isSameColumn && filters.order === 'asc' ? 'desc' : 'asc'
    onFilterChange({ sort: columnKey, order: nextOrder })
  }

  function sortIndicator(columnKey) {
    if (filters.sort !== columnKey) {
      return ''
    }
    return filters.order === 'asc' ? ' ↑' : ' ↓'
  }

  function formatMoney(value) {
    const amount = Number(value) || 0
    return '$' + amount.toLocaleString()
  }

  // Only the first 100 rows are rendered. The full count still comes from the
  // server, so the header reflects the real size of the filtered result set.
  const visible = accounts.slice(0, 100)

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Accounts</h2>
        <span className="row-count">
          {loading ? 'Loading...' : `${count.toLocaleString()} matching`}
        </span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          type="search"
          placeholder="Search company, contact, or email"
          value={filters.search}
          onChange={function (event) {
            onFilterChange({ search: event.target.value })
          }}
        />

        <select
          className="stage-select"
          value={filters.stage}
          onChange={function (event) {
            onFilterChange({ stage: event.target.value })
          }}
        >
          <option value="">All stages</option>
          {STAGES.map(function (stage) {
            return (
              <option key={stage} value={stage}>
                {stage}
              </option>
            )
          })}
        </select>
      </div>

      <div className="table-scroll">
        <table className="accounts-table">
          <thead>
            <tr>
              {SORTABLE_COLUMNS.map(function (column) {
                return (
                  <th
                    key={column.key}
                    className="sortable"
                    onClick={function () {
                      handleSort(column.key)
                    }}
                  >
                    {column.label}
                    {sortIndicator(column.key)}
                  </th>
                )
              })}
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  {loading ? 'Loading accounts...' : 'No accounts match these filters.'}
                </td>
              </tr>
            ) : (
              visible.map(function (account) {
                return (
                  <tr key={account.id}>
                    <td className="cell-company">{account.company}</td>
                    <td>
                      <span className={`stage-badge stage-${account.stage.toLowerCase()}`}>
                        {account.stage}
                      </span>
                    </td>
                    <td className="cell-revenue">{formatMoney(account.revenue)}</td>
                    <td className="cell-date">{account.last_contacted || 'Never'}</td>
                    <td className="cell-contact">{account.contact_name || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {count > visible.length ? (
        <p className="truncation-note">
          Showing the first {visible.length} of {count.toLocaleString()} rows. Narrow the filters to
          see more.
        </p>
      ) : null}
    </section>
  )
}

import React from 'react'

const DAY_OPTIONS = [7, 14, 30, 60, 90]

/**
 * Accounts that have not been contacted within the selected window.
 * The cutoff is applied by SQL on the server, not by filtering in the browser.
 */
export default function OverduePanel({ accounts, count, days, onDaysChange, loading }) {
  const visible = accounts.slice(0, 8)

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Overdue follow ups</h2>

        <select
          className="days-select"
          value={days}
          onChange={function (event) {
            onDaysChange(Number(event.target.value))
          }}
        >
          {DAY_OPTIONS.map(function (option) {
            return (
              <option key={option} value={option}>
                {option}+ days
              </option>
            )
          })}
        </select>
      </div>

      {loading ? (
        <p className="empty-note">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="empty-note">Nothing overdue in this window.</p>
      ) : (
        <ul className="overdue-list">
          {visible.map(function (account) {
            return (
              <li key={account.id} className="overdue-row">
                <span className="overdue-company">{account.company}</span>
                <span className="overdue-date">{account.last_contacted || 'Never contacted'}</span>
              </li>
            )
          })}
        </ul>
      )}

      {count > visible.length ? (
        <p className="truncation-note">
          {(count - visible.length).toLocaleString()} more not shown.
        </p>
      ) : null}
    </section>
  )
}

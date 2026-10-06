import React, { useState, useEffect, useCallback } from 'react'
import MetricCard from './components/MetricCard'
import StageChart from './components/StageChart'
import AccountsTable from './components/AccountsTable'
import OverduePanel from './components/OverduePanel'
import CsvUploader from './components/CsvUploader'
import { fetchSummary, fetchAccounts, fetchOverdue } from './api'

export default function App() {
  const [summary, setSummary] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [accountCount, setAccountCount] = useState(0)
  const [overdue, setOverdue] = useState([])
  const [overdueCount, setOverdueCount] = useState(0)
  const [overdueDays, setOverdueDays] = useState(30)

  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    sort: 'revenue',
    order: 'desc',
  })

  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [loadingOverdue, setLoadingOverdue] = useState(false)
  const [error, setError] = useState(null)

  // Bumping this forces every dependent effect to refetch (used after import/reset)
  const [refreshToken, setRefreshToken] = useState(0)

  const triggerRefresh = useCallback(function () {
    setRefreshToken(function (previous) {
      return previous + 1
    })
  }, [])

  // Summary metrics
  useEffect(
    function () {
      let cancelled = false

      fetchSummary()
        .then(function (data) {
          if (!cancelled) {
            setSummary(data)
            setError(null)
          }
        })
        .catch(function (err) {
          if (!cancelled) {
            setError(err.message)
          }
        })

      return function () {
        cancelled = true
      }
    },
    [refreshToken]
  )

  // Accounts, debounced so typing in the search box does not fire a request per keystroke
  useEffect(
    function () {
      let cancelled = false
      setLoadingAccounts(true)

      const timer = setTimeout(function () {
        fetchAccounts(filters)
          .then(function (data) {
            if (!cancelled) {
              setAccounts(data.accounts)
              setAccountCount(data.count)
              setError(null)
            }
          })
          .catch(function (err) {
            if (!cancelled) {
              setError(err.message)
            }
          })
          .finally(function () {
            if (!cancelled) {
              setLoadingAccounts(false)
            }
          })
      }, 250)

      return function () {
        cancelled = true
        clearTimeout(timer)
      }
    },
    [filters, refreshToken]
  )

  // Overdue accounts
  useEffect(
    function () {
      let cancelled = false
      setLoadingOverdue(true)

      fetchOverdue(overdueDays)
        .then(function (data) {
          if (!cancelled) {
            setOverdue(data.accounts)
            setOverdueCount(data.count)
          }
        })
        .catch(function (err) {
          if (!cancelled) {
            setError(err.message)
          }
        })
        .finally(function () {
          if (!cancelled) {
            setLoadingOverdue(false)
          }
        })

      return function () {
        cancelled = true
      }
    },
    [overdueDays, refreshToken]
  )

  function handleFilterChange(partial) {
    setFilters(function (previous) {
      return { ...previous, ...partial }
    })
  }

  function formatMoney(value) {
    const amount = Number(value) || 0
    return '$' + amount.toLocaleString()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">CRM Analytics Dashboard</h1>
          <p className="app-subtitle">
            Import a CSV of sales records to explore pipeline health, revenue by stage, and accounts
            that have gone quiet.
          </p>
        </div>
        <CsvUploader onDataChanged={triggerRefresh} />
      </header>

      {error ? (
        <div className="error-banner">
          <strong>Could not reach the API.</strong> {error} Make sure the backend is running on port
          3001.
        </div>
      ) : null}

      <section className="metrics-row">
        <MetricCard
          label="Total accounts"
          value={summary ? summary.total_accounts.toLocaleString() : '—'}
        />
        <MetricCard
          label="Open deals"
          value={summary ? summary.open_deals.toLocaleString() : '—'}
          note="Excludes Won and Lost"
        />
        <MetricCard
          label="Closed won revenue"
          value={summary ? formatMoney(summary.won_revenue) : '—'}
        />
        <MetricCard
          label="Overdue follow ups"
          value={overdueCount.toLocaleString()}
          note={`No contact in ${overdueDays}+ days`}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Deals by stage</h2>
        </div>
        <StageChart rows={summary ? summary.by_stage : []} />
      </section>

      <div className="split-row">
        <OverduePanel
          accounts={overdue}
          count={overdueCount}
          days={overdueDays}
          onDaysChange={setOverdueDays}
          loading={loadingOverdue}
        />
      </div>

      <AccountsTable
        accounts={accounts}
        count={accountCount}
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loadingAccounts}
      />
    </div>
  )
}

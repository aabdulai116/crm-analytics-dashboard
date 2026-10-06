import React, { useRef, useState } from 'react'
import { importCsv, resetData } from '../api'

/**
 * Handles CSV import and the destructive "clear data" action.
 * Calls onDataChanged() after either operation so the dashboard refetches.
 */
export default function CsvUploader({ onDataChanged }) {
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleFileSelected(event) {
    const file = event.target.files[0]
    if (!file) {
      return
    }

    setBusy(true)
    setStatus(null)

    try {
      const result = await importCsv(file)
      const skippedNote = result.skipped > 0 ? `, ${result.skipped} skipped` : ''
      setStatus({ kind: 'ok', text: `Imported ${result.imported} rows${skippedNote}.` })
      onDataChanged()
    } catch (error) {
      setStatus({ kind: 'error', text: error.message })
    } finally {
      setBusy(false)
      // Reset the input so selecting the same file again still fires onChange
      event.target.value = ''
    }
  }

  async function handleReset() {
    const confirmed = window.confirm('Clear all imported accounts? This cannot be undone.')
    if (!confirmed) {
      return
    }

    setBusy(true)
    setStatus(null)

    try {
      await resetData()
      setStatus({ kind: 'ok', text: 'All data cleared.' })
      onDataChanged()
    } catch (error) {
      setStatus({ kind: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <button
        className="btn btn-primary"
        disabled={busy}
        onClick={function () {
          fileInputRef.current.click()
        }}
      >
        {busy ? 'Working...' : 'Import CSV'}
      </button>

      <button className="btn btn-ghost" disabled={busy} onClick={handleReset}>
        Clear data
      </button>

      {status ? <span className={`status status-${status.kind}`}>{status.text}</span> : null}
    </div>
  )
}

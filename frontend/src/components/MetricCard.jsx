import React from 'react'

/**
 * A single KPI tile: label on top, large value underneath,
 * optional supporting note at the bottom.
 */
export default function MetricCard({ label, value, note }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {note ? <p className="metric-note">{note}</p> : null}
    </div>
  )
}

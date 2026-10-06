import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/**
 * Bar chart of deal count per pipeline stage.
 * Expects rows shaped like { stage, count, total_revenue }.
 */
export default function StageChart({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="empty-note">No stage data yet. Import a CSV to populate this chart.</p>
  }

  // Keep the pipeline in business order rather than whatever order SQL returned
  const STAGE_ORDER = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

  const sorted = [...rows].sort(function (a, b) {
    const indexA = STAGE_ORDER.indexOf(a.stage)
    const indexB = STAGE_ORDER.indexOf(b.stage)
    return indexA - indexB
  })

  function formatRevenue(value) {
    return '$' + Number(value).toLocaleString()
  }

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sorted} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf2" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#5a6474' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5a6474' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(15, 52, 96, 0.06)' }}
            formatter={function (value, name) {
              if (name === 'total_revenue') {
                return [formatRevenue(value), 'Revenue']
              }
              return [value, 'Deals']
            }}
          />
          <Bar dataKey="count" fill="#0f3460" radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

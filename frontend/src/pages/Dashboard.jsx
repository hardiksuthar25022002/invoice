import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import StatusStamp from '../components/StatusStamp.jsx'

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.dashboard().then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorState message={error} />
  if (!stats) return <p className="page-sub">Loading dashboard…</p>

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Where the money stands, at a glance.</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">+ New invoice</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="eyebrow">Total invoiced</span>
          <div className="stat-value">{fmt(stats.total_invoiced)}</div>
        </div>
        <div className="stat-card">
          <span className="eyebrow">Paid</span>
          <div className="stat-value ledger">{fmt(stats.total_paid)}</div>
        </div>
        <div className="stat-card">
          <span className="eyebrow">Outstanding</span>
          <div className="stat-value">{fmt(stats.total_outstanding)}</div>
        </div>
        <div className="stat-card">
          <span className="eyebrow">Overdue</span>
          <div className="stat-value brick">{fmt(stats.total_overdue)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 30 }}>
        <span className="eyebrow">Snapshot</span>
        <div className="snapshot-metrics">
          <Metric label="Invoices" value={stats.invoice_count} />
          <Metric label="Companies" value={stats.company_count} />
          {Object.entries(stats.status_breakdown).map(([status, count]) => (
            <Metric key={status} label={status} value={count} />
          ))}
        </div>
      </div>

      <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>Recent invoices</span>
      {stats.recent_invoices.length === 0 ? (
        <div className="empty-state card">
          <h3>No invoices yet</h3>
          <p>Add a company, then generate your first invoice.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Billed to</th>
                <th>Issued</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_invoices.map((inv) => (
                <tr key={inv.id} className="clickable" onClick={() => (window.location.href = `/invoices/${inv.id}`)}>
                  <td className="mono" data-label="Invoice">{inv.invoice_number}</td>
                  <td data-label="Billed to">{inv.company?.name}</td>
                  <td className="mono" data-label="Issued">{inv.issue_date}</td>
                  <td data-label="Status"><StatusStamp status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'capitalize' }}>{label}</div>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="empty-state card">
      <h3>Couldn't load your dashboard</h3>
      <p>{message}</p>
      <p style={{ fontSize: '0.8rem', marginTop: 10 }}>
        Check your Supabase connection and that the schema has been applied.
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import StatusStamp from '../components/StatusStamp.jsx'

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function total(inv) {
  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  return subtotal * (1 + inv.tax_rate / 100) - inv.discount
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()

  const load = () => api.listInvoices(filter || undefined).then(setInvoices)

  useEffect(() => { load() }, [filter])

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">All records</div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-sub">Every invoice you've issued, in one ledger.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>+ New invoice</button>
      </div>

      <div className="filter-row">
        {['', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
          <button
            key={s || 'all'}
            className="btn btn-ghost btn-sm"
            style={filter === s ? { background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' } : {}}
            onClick={() => setFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state card">
          <h3>No invoices here</h3>
          <p>Try a different filter, or generate a new invoice.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Billed to</th>
                <th>Issued</th>
                <th>Due</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="clickable" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td className="mono" data-label="Invoice">{inv.invoice_number}</td>
                  <td data-label="Billed to">{inv.company?.name}</td>
                  <td className="mono" data-label="Issued">{inv.issue_date}</td>
                  <td className="mono" data-label="Due">{inv.due_date || '—'}</td>
                  <td className="mono" style={{ textAlign: 'right' }} data-label="Total">{fmt(total(inv))}</td>
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

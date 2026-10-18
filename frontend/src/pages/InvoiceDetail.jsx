import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { downloadInvoicePdf } from '../pdf.js'
import { useAuth } from '../AuthContext.jsx'
import StatusStamp from '../components/StatusStamp.jsx'

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [inv, setInv] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const paperRef = useRef(null)

  const load = () => api.getInvoice(id).then(setInv).catch((e) => setError(e.message))

  useEffect(() => { load() }, [id])

  if (error) return <p style={{ color: 'var(--brick)' }}>{error}</p>
  if (!inv) return <p className="page-sub">Loading…</p>

  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = subtotal * (inv.tax_rate / 100)
  const grandTotal = subtotal + taxAmount - inv.discount

  const setStatus = async (status) => {
    await api.updateInvoiceStatus(inv.id, status)
    load()
  }

  const remove = async () => {
    if (!confirm('Delete this invoice permanently?')) return
    await api.deleteInvoice(inv.id)
    navigate('/invoices')
  }

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      await downloadInvoicePdf(paperRef.current, inv.invoice_number)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="page-header no-print">
        <div>
          <div className="eyebrow">Invoice</div>
          <h1 className="page-title">{inv.invoice_number}</h1>
          <div style={{ marginTop: 8 }}><StatusStamp status={inv.status} /></div>
        </div>
        <div className="header-actions">
          {inv.status !== 'paid' && <button className="btn btn-ghost" onClick={() => setStatus('paid')}>Mark as paid</button>}
          {inv.status === 'draft' && <button className="btn btn-ghost" onClick={() => setStatus('sent')}>Mark as sent</button>}
          <button className="btn btn-ghost" onClick={downloadPdf} disabled={downloading}>{downloading ? 'Generating…' : 'Download PDF'}</button>
          <button className="btn btn-danger" onClick={remove}>Delete</button>
        </div>
      </div>

      <div className="invoice-paper" ref={paperRef}>
        <div className="inv-top">
          <div className="inv-title">Invoice</div>
          <div className="inv-meta">
            <div className="inv-num">Invoice no: {inv.invoice_number}</div>
            <div className="inv-date">{formatDate(inv.issue_date)}</div>
          </div>
        </div>

        <div className="inv-sender">
          <div className="sender-name">{me.business_name || me.full_name}</div>
          {me.job_title && <div className="sender-role">Job description : {me.job_title}</div>}

          {me.address && (
            <div className="sender-block">
              <b>Address:</b> <span style={{ whiteSpace: 'pre-line' }}>{me.address}</span>
            </div>
          )}

          <div className="sender-block">
            {me.phone && <div>{me.phone}</div>}
            {me.email && <div>{me.email}</div>}
            {me.pan_number && <div><b>Pancard number :</b> {me.pan_number}</div>}
            {me.tax_id && <div><b>Tax ID:</b> {me.tax_id}</div>}
            {me.sac_code && <div><b>SAC Code:</b> {me.sac_code}</div>}
          </div>
        </div>

        <div className="bill-parties">
          <div className="bill-label">Billed to:</div>
          <div className="inv-client-name">{inv.company.name}</div>
          <div className="inv-client-address">
            {inv.company.address && <div style={{ whiteSpace: 'pre-line' }}>{inv.company.address}</div>}
            {inv.company.email && <div>{inv.company.email}</div>}
            {inv.company.phone && <div>{inv.company.phone}</div>}
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Quantity</th>
              <th className="num">Unit Price</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{fmt(item.unit_price)}</td>
                <td className="num">{fmt(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-total-row">
          <span className="inv-total-label">TOTAL</span>
          <span className="inv-total-value">{fmt(grandTotal)}</span>
        </div>
        {(inv.tax_rate > 0 || inv.discount > 0) && (
          <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#555', marginTop: 6 }}>
            {inv.tax_rate > 0 && <span>Subtotal {fmt(subtotal)} + tax ({inv.tax_rate}%) {fmt(taxAmount)}{inv.discount > 0 ? ' ' : ''}</span>}
            {inv.discount > 0 && <span>− discount {fmt(inv.discount)}</span>}
          </div>
        )}

        {(me.bank_account_name || me.bank_account_number || me.upi_id) && (
          <div className="inv-payment">
            <div className="bill-label">Payment Information</div>
            <div className="inv-payment-details">
              {me.bank_account_name && <div>{me.bank_account_name.toUpperCase()}</div>}
              {me.bank_ifsc && <div>IFSC {me.bank_ifsc}</div>}
              {me.bank_account_number && <div>Acc number: {me.bank_account_number}</div>}
              {me.upi_id && <div>Gpay: {me.upi_id}</div>}
            </div>
          </div>
        )}

        {inv.notes && (
          <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid #ddd' }}>
            <div className="bill-label" style={{ fontSize: '0.95rem' }}>Notes</div>
            <p style={{ fontSize: '0.85rem', color: '#333', whiteSpace: 'pre-line' }}>{inv.notes}</p>
          </div>
        )}
      </div>
    </>
  )
}

function formatDate(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
}

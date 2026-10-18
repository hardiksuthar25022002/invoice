import { Download, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { api } from '@/api'
import { useAuth } from '@/AuthContext'
import StatusStamp from '@/components/StatusStamp'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, invoiceTotals } from '@/lib/format'
import { downloadInvoicePdf } from '@/pdf'
import type { Invoice, InvoiceStatus } from '@/types'

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: me } = useAuth()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const paperRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    if (!id) return

    api
      .getInvoice(id)
      .then(setInvoice)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (error && !invoice) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!invoice || !me) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }

  const { subtotal, taxAmount, total } = invoiceTotals(invoice)

  const setStatus = async (status: InvoiceStatus) => {
    await api.updateInvoiceStatus(invoice.id, status)
    toast.success(`Marked as ${status}`)
    load()
  }

  const remove = async () => {
    await api.deleteInvoice(invoice.id)
    toast.success(`${invoice.invoice_number} deleted`)
    navigate('/invoices')
  }

  const downloadPdf = async () => {
    setDownloading(true)
    setError(null)

    try {
      await downloadInvoicePdf(paperRef.current, invoice.invoice_number)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {invoice.invoice_number}
            </h1>
            <StatusStamp status={invoice.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            Issued {formatDate(invoice.issue_date)}
            {invoice.due_date ? ` · due ${formatDate(invoice.due_date)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <Button variant="outline" onClick={() => setStatus('paid')}>
              Mark as paid
            </Button>
          )}

          {invoice.status === 'draft' && (
            <Button variant="outline" onClick={() => setStatus('sent')}>
              Mark as sent
            </Button>
          )}

          <Button variant="outline" onClick={downloadPdf} disabled={downloading}>
            <Download />
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {invoice.invoice_number}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the invoice and its line items.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="no-print mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="invoice-paper" ref={paperRef}>
        <div className="inv-top">
          <div className="inv-title">Invoice</div>
          <div className="inv-meta">
            <div className="inv-num">Invoice no: {invoice.invoice_number}</div>
            <div className="inv-date">{formatDate(invoice.issue_date)}</div>
          </div>
        </div>

        <div className="inv-sender">
          <div className="sender-name">
            {me.business_name || me.full_name}
          </div>
          {me.job_title && (
            <div className="sender-role">Job description : {me.job_title}</div>
          )}

          {me.address && (
            <div className="sender-block inv-address">
              <b>Address:</b> <span>{me.address}</span>
            </div>
          )}

          <div className="sender-block">
            {me.phone && <div>{me.phone}</div>}
            {me.email && <div>{me.email}</div>}
            {me.pan_number && (
              <div>
                <b>Pancard number :</b> {me.pan_number}
              </div>
            )}
            {me.tax_id && (
              <div>
                <b>Tax ID:</b> {me.tax_id}
              </div>
            )}
            {me.sac_code && (
              <div>
                <b>SAC Code:</b> {me.sac_code}
              </div>
            )}
          </div>
        </div>

        <div className="bill-parties">
          <div className="bill-label">Billed to:</div>
          <div className="inv-client-name">{invoice.company.name}</div>
          <div className="inv-client-address">
            {invoice.company.address && (
              <div className="inv-address">{invoice.company.address}</div>
            )}
            {invoice.company.email && <div>{invoice.company.email}</div>}
            {invoice.company.phone && <div>{invoice.company.phone}</div>}
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
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{formatCurrency(item.unit_price)}</td>
                <td className="num">
                  {formatCurrency(item.quantity * item.unit_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-total-row">
          <span className="inv-total-label">TOTAL</span>
          <span className="inv-total-value">{formatCurrency(total)}</span>
        </div>

        {(invoice.tax_rate > 0 || invoice.discount > 0) && (
          <div className="inv-adjustments">
            {invoice.tax_rate > 0 && (
              <span>
                Subtotal {formatCurrency(subtotal)} + tax ({invoice.tax_rate}%){' '}
                {formatCurrency(taxAmount)}
                {invoice.discount > 0 ? ' ' : ''}
              </span>
            )}
            {invoice.discount > 0 && (
              <span>− discount {formatCurrency(invoice.discount)}</span>
            )}
          </div>
        )}

        {(me.bank_account_name || me.bank_account_number || me.upi_id) && (
          <div className="inv-payment">
            <div className="bill-label">Payment Information</div>
            <div className="inv-payment-details">
              {me.bank_account_name && (
                <div>{me.bank_account_name.toUpperCase()}</div>
              )}
              {me.bank_ifsc && <div>IFSC {me.bank_ifsc}</div>}
              {me.bank_account_number && (
                <div>Acc number: {me.bank_account_number}</div>
              )}
              {me.upi_id && <div>Gpay: {me.upi_id}</div>}
            </div>
          </div>
        )}

        {invoice.notes && (
          <div className="inv-notes">
            <div className="bill-label">Notes</div>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </>
  )
}

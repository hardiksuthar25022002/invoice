import type { Invoice, InvoiceItem } from '@/types'

/**
 * Amounts are shown in Indian rupees with the en-IN grouping
 * (₹1,23,456.78) throughout the app.
 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0)
  return inr.format(Number.isFinite(amount) ? amount : 0)
}

export function itemsSubtotal(
  items: ReadonlyArray<Pick<InvoiceItem, 'quantity' | 'unit_price'>> | null | undefined,
) {
  return (items ?? []).reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  )
}

/** Mirrors dashboard_stats(): subtotal × (1 + tax/100) − discount. */
export function invoiceTotals(
  invoice: Pick<Invoice, 'items' | 'tax_rate' | 'discount'>,
) {
  const subtotal = itemsSubtotal(invoice.items)
  const taxAmount = subtotal * (invoice.tax_rate / 100)

  return { subtotal, taxAmount, total: subtotal + taxAmount - invoice.discount }
}

/** ISO date (yyyy-mm-dd) → the dd.mm.yyyy used on the invoice paper. */
export function formatDate(isoDate?: string | null) {
  if (!isoDate) return ''

  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Avatar fallback: first letter of the first two words, e.g. "Ravi Kumar" → "RK". */
export function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) return '?'

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

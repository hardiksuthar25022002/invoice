/**
 * Domain types mirroring the Supabase schema
 * (see supabase/migrations/0001_init.sql).
 */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
]

/** profiles: the "billed from" side of every invoice. */
export interface Me {
  id: string
  email: string
  full_name: string
  business_name: string | null
  job_title: string | null
  address: string | null
  phone: string | null
  tax_id: string | null
  pan_number: string | null
  sac_code: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  upi_id: string | null
}

export interface Company {
  id: number
  user_id?: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at?: string
}

export type CompanyInput = Pick<Company, 'name' | 'address' | 'phone' | 'email'>

export interface InvoiceItem {
  id: number
  invoice_id?: number
  description: string
  quantity: number
  unit_price: number
}

export interface Invoice {
  id: number
  user_id?: string
  invoice_number: string
  company_id?: number
  issue_date: string
  due_date: string | null
  status: InvoiceStatus
  notes: string | null
  tax_rate: number
  discount: number
  /** Selected with the invoice; the dashboard RPC returns the same shape. */
  company: Pick<Company, 'id' | 'name' | 'address' | 'phone' | 'email'>
  items: InvoiceItem[]
}

export interface InvoiceItemInput {
  description: string
  quantity: number
  unit_price: number
}

export interface NewInvoicePayload {
  company_id: number
  issue_date: string
  due_date: string | null
  status: InvoiceStatus
  tax_rate: number
  discount: number
  notes: string | null
  items: InvoiceItemInput[]
}

export interface MonthlyTotal {
  month: string
  total: number
}

export interface DashboardStats {
  total_invoiced: number
  total_paid: number
  total_outstanding: number
  total_overdue: number
  invoice_count: number
  company_count: number
  status_breakdown: Record<string, number>
  monthly_totals: MonthlyTotal[]
  recent_invoices: Invoice[]
}

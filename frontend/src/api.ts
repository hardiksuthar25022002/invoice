import { supabase } from '@/supabase'
import type {
  Company,
  CompanyInput,
  DashboardStats,
  Invoice,
  InvoiceStatus,
  Me,
  NewInvoicePayload,
} from '@/types'

/**
 * Thin data layer over Supabase, kept deliberately close to the old REST
 * client: same method names, same response shapes, so the pages don't change.
 *
 * Ownership is enforced by row level security in the database (see
 * supabase/migrations/0001_init.sql), not by this code.
 */

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const PROFILE_COLUMNS =
  'id,email,full_name,business_name,job_title,address,phone,tax_id,' +
  'pan_number,sac_code,bank_account_name,bank_account_number,bank_ifsc,upi_id'

const INVOICE_SELECT = '*, company:companies(*), items:invoice_items(*)'

/** emails are nullable in the table but always present for a signed-in user. */
type ProfileRow = Omit<Me, 'email'> & { email: string | null }

interface SupabaseError {
  message: string
  status?: number
}

/** PostgrestError carries no HTTP status, so fall back to the caller's guess. */
function errorStatus(error: unknown, fallback: number) {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' ? status : fallback
}

function unwrap<T>({ data, error }: { data: T | null; error: SupabaseError | null }) {
  if (error) throw new ApiError(errorStatus(error, 400), error.message)

  return data as T
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new ApiError(401, 'Your session expired. Please sign in again.')
  }

  return data.user
}

function withEmail(profile: ProfileRow, email: string | undefined): Me {
  return { ...profile, email: profile.email || email || '' }
}

// Blank strings clear a field; full_name is required, so a blank one is ignored.
function cleanProfile(update: Partial<Me>) {
  const out: Record<string, string | null> = {}

  for (const [key, value] of Object.entries(update)) {
    if (typeof value !== 'string') {
      if (value === null) out[key] = null
      continue
    }

    const trimmed = value.trim()

    if (key === 'full_name') {
      if (trimmed) out.full_name = trimmed
    } else {
      out[key] = trimmed === '' ? null : trimmed
    }
  }

  return out
}

export const api = {
  // ---------------- auth (passwordless, email OTP) ----------------

  /**
   * Emails a one-time code (plus a magic link) to the address. Supabase creates
   * the account on first verification, so there is no separate sign-up step;
   * `handle_new_user()` gives the new user an empty profile row.
   */
  async sendLoginCode(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        // Where the magic link lands; the app picks the session out of the URL.
        emailRedirectTo: window.location.origin,
      },
    })

    // Supabase returns 429 when the per-hour email limit is hit.
    if (error) throw new ApiError(errorStatus(error, 429), error.message)
  },

  /** Exchange the code from the email for a session. */
  async verifyLoginCode(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    })

    if (error) throw new ApiError(errorStatus(error, 401), error.message)

    return data.session
  },

  async logout() {
    await supabase.auth.signOut()
  },

  async me(): Promise<Me> {
    const authUser = await currentUser()

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', authUser.id)
      .maybeSingle<ProfileRow>()

    if (error) throw new ApiError(errorStatus(error, 400), error.message)

    if (data) return withEmail(data, authUser.email)

    // No profile row yet (e.g. the signup trigger didn't run) — create one.
    const created = unwrap<ProfileRow>(
      await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || '',
        })
        .select(PROFILE_COLUMNS)
        .single(),
    )

    return withEmail(created, authUser.email)
  },

  async updateProfile(update: Partial<Me>): Promise<Me> {
    const authUser = await currentUser()

    const profile = unwrap<ProfileRow>(
      await supabase
        .from('profiles')
        .update(cleanProfile(update))
        .eq('id', authUser.id)
        .select(PROFILE_COLUMNS)
        .single(),
    )

    return withEmail(profile, authUser.email)
  },

  // ---------------- companies ----------------

  async listCompanies(): Promise<Company[]> {
    return unwrap<Company[]>(
      await supabase.from('companies').select('*').order('name', {
        ascending: true,
      }),
    )
  },

  async createCompany(data: CompanyInput): Promise<Company> {
    return unwrap<Company>(
      await supabase.from('companies').insert(data).select().single(),
    )
  },

  async deleteCompany(id: number) {
    unwrap(await supabase.from('companies').delete().eq('id', id))
    return { ok: true }
  },

  // ---------------- invoices ----------------

  async listInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
    let query = supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .order('issue_date', { ascending: false })

    if (status) query = query.eq('status', status)

    return unwrap<Invoice[]>(await query)
  },

  async getInvoice(id: string): Promise<Invoice> {
    return unwrap<Invoice>(
      await supabase.from('invoices').select(INVOICE_SELECT).eq('id', id).single(),
    )
  },

  async createInvoice(payload: NewInvoicePayload): Promise<Invoice> {
    const { items = [], ...invoice } = payload

    // The invoice_number is assigned by a database trigger, so insert the
    // header first and hang the line items off the generated id.
    const created = unwrap<{ id: number }>(
      await supabase.from('invoices').insert(invoice).select('id').single(),
    )

    if (items.length) {
      unwrap(
        await supabase
          .from('invoice_items')
          .insert(items.map((item) => ({ ...item, invoice_id: created.id }))),
      )
    }

    return unwrap<Invoice>(
      await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', created.id)
        .single(),
    )
  },

  async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    return unwrap<Invoice>(
      await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select(INVOICE_SELECT)
        .single(),
    )
  },

  async deleteInvoice(id: number) {
    unwrap(await supabase.from('invoices').delete().eq('id', id))
    return { ok: true }
  },

  // ---------------- dashboard ----------------

  async dashboard(): Promise<DashboardStats> {
    return unwrap<DashboardStats>(await supabase.rpc('dashboard_stats'))
  },
}

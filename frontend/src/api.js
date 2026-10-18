import { supabase } from './supabase.js'

/**
 * Thin data layer over Supabase, kept deliberately close to the old REST
 * client: same method names, same response shapes, so the pages don't change.
 *
 * Ownership is enforced by row level security in the database (see
 * supabase/migrations/0001_init.sql), not by this code.
 */

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const PROFILE_COLUMNS =
  'id,email,full_name,business_name,job_title,address,phone,tax_id,' +
  'pan_number,sac_code,bank_account_name,bank_account_number,bank_ifsc,upi_id'

const INVOICE_SELECT = '*, company:companies(*), items:invoice_items(*)'

function unwrap({ data, error }) {
  if (error) throw new ApiError(error.status || 400, error.message)
  return data
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new ApiError(401, 'Your session expired. Please sign in again.')
  }

  return data.user
}

function withEmail(profile, authUser) {
  return { ...profile, email: profile.email || authUser.email }
}

// Blank strings clear a field; full_name is required, so a blank one is ignored.
function cleanProfile(update) {
  const out = {}

  for (const [key, value] of Object.entries(update)) {
    if (typeof value !== 'string') {
      out[key] = value
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
  // ---------------- auth ----------------

  async register({ full_name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: full_name.trim() } },
    })

    if (error) throw new ApiError(error.status || 400, error.message)

    // With email confirmation enabled there is no session until the user
    // clicks the link; surface that instead of silently doing nothing.
    if (!data.session) {
      throw new ApiError(
        200,
        'Check your inbox to confirm your email, then sign in.',
      )
    }

    return data.session
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) throw new ApiError(error.status || 401, error.message)

    return data.session
  },

  async logout() {
    await supabase.auth.signOut()
  },

  async me() {
    const authUser = await currentUser()

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) throw new ApiError(error.status || 400, error.message)

    if (data) return withEmail(data, authUser)

    // No profile row yet (e.g. the signup trigger didn't run) — create one.
    const created = unwrap(
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

    return withEmail(created, authUser)
  },

  async updateProfile(update) {
    const authUser = await currentUser()

    const profile = unwrap(
      await supabase
        .from('profiles')
        .update(cleanProfile(update))
        .eq('id', authUser.id)
        .select(PROFILE_COLUMNS)
        .single(),
    )

    return withEmail(profile, authUser)
  },

  // ---------------- companies ----------------

  async listCompanies() {
    return unwrap(
      await supabase.from('companies').select('*').order('name', {
        ascending: true,
      }),
    )
  },

  async createCompany(data) {
    return unwrap(
      await supabase.from('companies').insert(data).select().single(),
    )
  },

  async deleteCompany(id) {
    unwrap(await supabase.from('companies').delete().eq('id', id))
    return { ok: true }
  },

  // ---------------- invoices ----------------

  async listInvoices(status) {
    let query = supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .order('issue_date', { ascending: false })

    if (status) query = query.eq('status', status)

    return unwrap(await query)
  },

  async getInvoice(id) {
    return unwrap(
      await supabase.from('invoices').select(INVOICE_SELECT).eq('id', id).single(),
    )
  },

  async createInvoice(payload) {
    const { items = [], ...invoice } = payload

    // The invoice_number is assigned by a database trigger, so insert the
    // header first and hang the line items off the generated id.
    const created = unwrap(
      await supabase.from('invoices').insert(invoice).select('id').single(),
    )

    if (items.length) {
      unwrap(
        await supabase
          .from('invoice_items')
          .insert(items.map((item) => ({ ...item, invoice_id: created.id }))),
      )
    }

    return unwrap(
      await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', created.id)
        .single(),
    )
  },

  async updateInvoiceStatus(id, status) {
    return unwrap(
      await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select(INVOICE_SELECT)
        .single(),
    )
  },

  async deleteInvoice(id) {
    unwrap(await supabase.from('invoices').delete().eq('id', id))
    return { ok: true }
  },

  // ---------------- dashboard ----------------

  async dashboard() {
    return unwrap(await supabase.rpc('dashboard_stats'))
  },
}

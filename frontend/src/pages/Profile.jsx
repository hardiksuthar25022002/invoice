import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

const editable = [
  'full_name',
  'business_name',
  'job_title',
  'address',
  'phone',
  'tax_id',
  'pan_number',
  'sac_code',
  'bank_account_name',
  'bank_account_number',
  'bank_ifsc',
  'upi_id',
]

export default function Profile() {
  const { user, saveProfile } = useAuth()

  const [form, setForm] = useState(() =>
    Object.fromEntries(editable.map((f) => [f, user[f] ?? ''])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const setField = (field) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()]),
    )

    try {
      await saveProfile(payload)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Your details</div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">
            This is the “billed from” side of every invoice — it appears in the
            PDF header and payment footer.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 560 }}>
        <span className="eyebrow">Signed in as</span>
        <p className="mono" style={{ marginTop: 6 }}>{user.email}</p>
      </div>

      {error && (
        <p style={{ color: 'var(--brick)', marginBottom: 16 }}>
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 14 }}>
            Business details
          </span>

          <div className="form-grid">
            <div className="field">
              <label>Your name *</label>
              <input required value={form.full_name} onChange={setField('full_name')} />
            </div>

            <div className="field">
              <label>Business name</label>
              <input
                value={form.business_name}
                onChange={setField('business_name')}
              />
            </div>

            <div className="field">
              <label>Job title</label>
              <input
                value={form.job_title}
                onChange={setField('job_title')}
              />
            </div>

            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={setField('phone')} />
            </div>

            <div className="field field-full">
              <label>Address</label>
              <textarea
                rows="3"
                value={form.address}
                onChange={setField('address')}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 14 }}>
            Tax
          </span>

          <div className="form-grid">
            <div className="field">
              <label>Tax ID</label>
              <input value={form.tax_id} onChange={setField('tax_id')} />
            </div>

            <div className="field">
              <label>PAN number</label>
              <input value={form.pan_number} onChange={setField('pan_number')} />
            </div>

            <div className="field">
              <label>SAC code</label>
              <input value={form.sac_code} onChange={setField('sac_code')} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 14 }}>
            Payment details
          </span>

          <div className="form-grid">
            <div className="field">
              <label>Account holder name</label>
              <input
                value={form.bank_account_name}
                onChange={setField('bank_account_name')}
              />
            </div>

            <div className="field">
              <label>Account number</label>
              <input
                value={form.bank_account_number}
                onChange={setField('bank_account_number')}
              />
            </div>

            <div className="field">
              <label>IFSC</label>
              <input value={form.bank_ifsc} onChange={setField('bank_ifsc')} />
            </div>

            <div className="field">
              <label>UPI ID</label>
              <input value={form.upi_id} onChange={setField('upi_id')} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>

          {saved && <span className="save-note">Saved</span>}
        </div>
      </form>
    </>
  )
}

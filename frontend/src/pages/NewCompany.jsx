import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const empty = {
  name: '',
  address: '',
  phone: '',
  email: '',
}

export default function NewCompany() {
  const navigate = useNavigate()

  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const setField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Blank optional fields should be sent as null, not "".
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
    )

    try {
      await api.createCompany(payload)
      navigate('/companies')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Who you bill</div>
          <h1 className="page-title">Add company</h1>
          <p className="page-sub">
            Companies are the clients your invoices are billed to. Your own
            details come from your profile.
          </p>
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--brick)', marginBottom: 16 }}>
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        <div className="card" style={{ marginBottom: 24 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 14 }}>
            Client details
          </span>

          <div className="form-grid">
            <div className="field field-full">
              <label>Company name *</label>
              <input
                required
                value={form.name}
                onChange={setField('name')}
              />
            </div>

            <div className="field field-full">
              <label>Address</label>
              <textarea
                rows="3"
                value={form.address}
                onChange={setField('address')}
              />
            </div>

            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={setField('phone')} />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={setField('email')}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save company'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/companies')}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}

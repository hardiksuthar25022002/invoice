import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState(null)

  const load = () =>
    api.listCompanies()
      .then(setCompanies)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const remove = async (id) => {
    if (!confirm('Delete this company and all its invoices?')) return

    try {
      await api.deleteCompany(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Who you bill</div>
          <h1 className="page-title">Companies</h1>
          <p className="page-sub">
            The clients your invoices are billed to.
          </p>
        </div>

        <Link className="btn btn-primary" to="/companies/new">
          + Add company
        </Link>
      </div>

      {error && (
        <p style={{ color: 'var(--brick)', marginBottom: 16 }}>
          {error}
        </p>
      )}

      {companies.length === 0 ? (
        <div className="empty-state card">
          <h3>No companies yet</h3>
          <p>Add your first company to start generating invoices.</p>

          <Link
            className="btn btn-primary"
            to="/companies/new"
            style={{ marginTop: 16 }}
          >
            Add company
          </Link>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map((c) => (
            <div className="company-card" key={c.id}>
              <div className="company-avatar">
                {c.logo_initial || c.name?.charAt(0)?.toUpperCase()}
              </div>

              <h3>{c.name}</h3>

              {c.address && (
                <p>{c.address}</p>
              )}

              {(c.phone || c.email) && (
                <p className="company-contact">
                  {[c.phone, c.email].filter(Boolean).join(' · ')}
                </p>
              )}

              <div className="card-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => remove(c.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

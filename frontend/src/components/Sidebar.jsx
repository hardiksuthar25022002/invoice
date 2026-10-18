import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', icon: '◧', end: true },
  { to: '/invoices', label: 'Invoices', icon: '▤', end: true },
  { to: '/invoices/new', label: 'New invoice', icon: '✎' },
  { to: '/companies', label: 'Companies', icon: '◆' },
  { to: '/profile', label: 'Profile', icon: '☺' },
]

const MOBILE_QUERY = '(max-width: 900px)'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches,
  )

  // Below 900px the sidebar is an off-canvas drawer; above it, it is always
  // visible. Reacting to the breakpoint keeps the two states in sync.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = (e) => {
      setIsMobile(e.matches)
      if (!e.matches) setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Navigating away should always leave the drawer closed.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // While the drawer is open: lock the page behind it and allow Esc to close.
  useEffect(() => {
    if (!open) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className={`burger${open ? ' open' : ''}`}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="burger-bar" />
          <span className="burger-bar" />
          <span className="burger-bar" />
        </button>

        <span className="brand-mark" aria-hidden="true">§</span>
        <span className="brand-name">Ledger</span>

        {user && (
          <span className="topbar-avatar" aria-hidden="true">
            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        )}
      </header>

      <aside
        id="app-sidebar"
        className={`sidebar${open ? ' open' : ''}`}
        inert={isMobile && !open ? '' : undefined}
      >
        <div className="brand">
          <span className="brand-mark">§</span>
          <span className="brand-name">Ledger</span>
        </div>
        <nav className="nav-group">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name" title={user.full_name}>
                {user.full_name}
              </div>
              <div className="sidebar-user-email" title={user.email}>
                {user.email}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Sign out
            </button>
          </div>
        )}

        <div className="sidebar-footer">
          Ledger — invoicing for small teams.<br />Runs locally on your machine.
        </div>
      </aside>

      {isMobile && open && (
        <div
          className="drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}

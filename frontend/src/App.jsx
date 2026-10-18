import { Routes, Route } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Companies from './pages/Companies.jsx'
import NewCompany from './pages/NewCompany.jsx'
import Invoices from './pages/Invoices.jsx'
import NewInvoice from './pages/NewInvoice.jsx'
import InvoiceDetail from './pages/InvoiceDetail.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="page-sub">Loading your ledger…</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/new" element={<NewCompany />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
        </Routes>
      </main>
    </div>
  )
}

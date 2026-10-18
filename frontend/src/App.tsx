import { Routes, Route, useLocation } from 'react-router-dom'

import { useAuth } from '@/AuthContext'
import { AppHeader } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Companies from '@/pages/Companies'
import Dashboard from '@/pages/Dashboard'
import InvoiceDetail from '@/pages/InvoiceDetail'
import Invoices from '@/pages/Invoices'
import Login from '@/pages/Login'
import NewCompany from '@/pages/NewCompany'
import NewInvoice from '@/pages/NewInvoice'
import Privacy from '@/pages/Privacy'
import Profile from '@/pages/Profile'
import Terms from '@/pages/Terms'

const legalPaths = ['/terms', '/privacy']

export default function App() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()

  // The legal pages carry their own frame and must work signed out, so they are
  // handled before any auth branching.
  if (legalPaths.includes(pathname)) {
    return (
      <Routes>
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        Loading your ledger…
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <AppHeader />

          <Main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/new" element={<NewCompany />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<NewInvoice />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
            </Routes>
          </Main>
        </SidebarInset>

        <Toaster position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
  )
}

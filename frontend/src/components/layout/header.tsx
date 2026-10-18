import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'

import ThemeSwitch from '@/components/theme-switch'
import ProfileDropdown from '@/components/profile-dropdown'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/** Breadcrumb trail for a path. `to` makes an entry a link. */
function trailFor(pathname: string): Array<{ label: string; to?: string }> {
  if (pathname === '/') return [{ label: 'Dashboard' }]
  if (pathname === '/invoices') return [{ label: 'Invoices' }]
  if (pathname === '/invoices/new') {
    return [{ label: 'Invoices', to: '/invoices' }, { label: 'New invoice' }]
  }
  if (pathname.startsWith('/invoices/')) {
    return [{ label: 'Invoices', to: '/invoices' }, { label: 'Invoice' }]
  }
  if (pathname === '/companies') return [{ label: 'Companies' }]
  if (pathname === '/companies/new') {
    return [{ label: 'Companies', to: '/companies' }, { label: 'Add company' }]
  }
  if (pathname === '/profile') return [{ label: 'Profile' }]

  return [{ label: 'Ledger' }]
}

export function AppHeader() {
  const { pathname } = useLocation()
  const trail = trailFor(pathname)

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      {/* The preset's Separator sets `data-vertical:self-stretch`, which leaves
          this short divider top-aligned (and full-height). Force both with `!`
          so it stays a 16px centred tick. */}
      <Separator orientation="vertical" className="mr-1 h-4! self-center!" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1

            return (
              <Fragment key={crumb.label}>
                <BreadcrumbItem>
                  {last ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to ?? '/'}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!last && <BreadcrumbSeparator />}
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ms-auto flex items-center gap-1">
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </header>
  )
}

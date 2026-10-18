import {
  Building2,
  FilePlus2,
  FileText,
  LayoutDashboard,
  ReceiptText,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import type { NavGroupData } from '@/components/layout/types'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const navGroups: NavGroupData[] = [
  {
    title: 'Workspace',
    items: [
      { title: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
      { title: 'Invoices', to: '/invoices', icon: FileText, exact: true },
      { title: 'New invoice', to: '/invoices/new', icon: FilePlus2 },
      { title: 'Companies', to: '/companies', icon: Building2 },
    ],
  },
  {
    title: 'Account',
    items: [{ title: 'Profile', to: '/profile', icon: UserRound, exact: true }],
  },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ReceiptText className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Ledger</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Invoicing
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

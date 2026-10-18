import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
  /** Highlight only on an exact match (e.g. /invoices vs /invoices/new). */
  exact?: boolean
}

export interface NavGroupData {
  title: string
  items: NavItem[]
}

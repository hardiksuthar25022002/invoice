import { Badge } from '@/components/ui/badge'
import { titleCase } from '@/lib/format'
import type { InvoiceStatus } from '@/types'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const variants: Record<InvoiceStatus, BadgeVariant> = {
  paid: 'default',
  sent: 'secondary',
  draft: 'outline',
  overdue: 'destructive',
}

export default function StatusStamp({ status }: { status: InvoiceStatus }) {
  return <Badge variant={variants[status] ?? 'outline'}>{titleCase(status)}</Badge>
}

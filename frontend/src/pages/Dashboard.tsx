import {
  CircleCheck,
  Clock,
  Plus,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '@/api'
import PageHeader from '@/components/PageHeader'
import StatusStamp from '@/components/StatusStamp'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency, titleCase } from '@/lib/format'
import type { DashboardStats } from '@/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .dashboard()
      .then(setStats)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
  }, [])

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn&apos;t load your dashboard</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    )
  }

  if (!stats) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Where the money stands, at a glance."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Where the money stands, at a glance."
      >
        <Button asChild>
          <Link to="/invoices/new">
            <Plus />
            New invoice
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total invoiced"
          value={stats.total_invoiced}
          hint={`${stats.invoice_count} ${stats.invoice_count === 1 ? 'invoice' : 'invoices'} raised`}
          icon={Wallet}
        />
        <StatCard
          label="Paid"
          value={stats.total_paid}
          hint="Settled in full"
          icon={CircleCheck}
        />
        <StatCard
          label="Outstanding"
          value={stats.total_outstanding}
          hint="Issued and awaiting payment"
          icon={Clock}
        />
        <StatCard
          label="Overdue"
          value={stats.total_overdue}
          hint="Past the due date"
          icon={TriangleAlert}
          tone="destructive"
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Snapshot</CardTitle>
          <CardDescription>Everything in your ledger right now.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-10 gap-y-4">
          <Metric label="Invoices" value={stats.invoice_count} />
          <Metric label="Companies" value={stats.company_count} />
          {Object.entries(stats.status_breakdown ?? {}).map(([status, count]) => (
            <Metric key={status} label={titleCase(status)} value={count} />
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent invoices</CardTitle>
          <CardDescription>
            The five most recently generated invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {stats.recent_invoices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No invoices yet</EmptyTitle>
                <EmptyDescription>
                  Add a company, then generate your first invoice.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Billed to</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-mono font-medium">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>{inv.company?.name}</TableCell>
                    <TableCell className="font-mono">
                      {inv.issue_date}
                    </TableCell>
                    <TableCell>
                      <StatusStamp status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  hint?: string
  icon: LucideIcon
  tone?: 'destructive'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardDescription>{label}</CardDescription>
          <CardTitle
            className={cn(
              'text-2xl tabular-nums',
              tone === 'destructive' && 'text-destructive',
            )}
          >
            {formatCurrency(value)}
          </CardTitle>
        </div>
        <Icon className="text-muted-foreground size-4 shrink-0" />
      </CardHeader>
      {hint && (
        <CardContent className="text-muted-foreground text-xs">
          {hint}
        </CardContent>
      )}
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-medium tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  )
}

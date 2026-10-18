import { MoreHorizontal, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { api } from '@/api'
import PageHeader from '@/components/PageHeader'
import StatusStamp from '@/components/StatusStamp'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/format'
import type { Invoice, InvoiceStatus } from '@/types'

const filters: Array<{ label: string; value: InvoiceStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

function invoiceTotal(inv: Invoice) {
  const subtotal = inv.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  )

  return subtotal * (1 + inv.tax_rate / 100) - inv.discount
}

export default function Invoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all')
  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)

    api
      .listInvoices(filter === 'all' ? undefined : filter)
      .then((rows) => {
        if (active) setInvoices(rows)
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filter])

  const changeStatus = useCallback(
    async (invoice: Invoice, status: InvoiceStatus) => {
      try {
        const updated = await api.updateInvoiceStatus(invoice.id, status)

        setInvoices((rows) =>
          rows.map((row) => (row.id === updated.id ? updated : row)),
        )
        toast.success(`${updated.invoice_number} marked ${status}`)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : String(e))
      }
    },
    [],
  )

  const deleteInvoice = useCallback(async (invoice: Invoice) => {
    try {
      await api.deleteInvoice(invoice.id)

      setInvoices((rows) => rows.filter((row) => row.id !== invoice.id))
      toast.success(`${invoice.invoice_number} deleted`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }, [])

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Every invoice you've issued, in one ledger."
      >
        <Button asChild>
          <Link to="/invoices/new">
            <Plus />
            New invoice
          </Link>
        </Button>
      </PageHeader>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as InvoiceStatus | 'all')}
        className="mb-4"
      >
        <TabsList>
          {filters.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-3 px-6 py-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No invoices here</EmptyTitle>
                <EmptyDescription>
                  Try a different filter, or generate a new invoice.
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
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-mono font-medium">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>{inv.company?.name}</TableCell>
                    <TableCell className="font-mono">{inv.issue_date}</TableCell>
                    <TableCell className="font-mono">
                      {inv.due_date || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(invoiceTotal(inv))}
                    </TableCell>
                    <TableCell>
                      <StatusStamp status={inv.status} />
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                            <span className="sr-only">
                              Actions for {inv.invoice_number}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            Open
                          </DropdownMenuItem>

                          {inv.status !== 'sent' && (
                            <DropdownMenuItem
                              onClick={() => void changeStatus(inv, 'sent')}
                            >
                              Mark as sent
                            </DropdownMenuItem>
                          )}
                          {inv.status !== 'paid' && (
                            <DropdownMenuItem
                              onClick={() => void changeStatus(inv, 'paid')}
                            >
                              Mark as paid
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingDelete(inv)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.invoice_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The invoice and its line items will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) void deleteInvoice(pendingDelete)
                setPendingDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

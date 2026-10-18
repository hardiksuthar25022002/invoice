import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { api } from '@/api'
import PageHeader from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, todayISO } from '@/lib/format'
import type { Company, InvoiceStatus } from '@/types'

interface DraftItem {
  description: string
  quantity: string
  unit_price: string
}

interface InvoiceForm {
  company_id: string
  issue_date: string
  due_date: string
  tax_rate: string
  discount: string
  notes: string
  status: InvoiceStatus
}

const emptyItem = (): DraftItem => ({
  description: '',
  quantity: '1',
  unit_price: '0',
})

export default function NewInvoice() {
  const navigate = useNavigate()

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<InvoiceForm>({
    company_id: '',
    issue_date: todayISO(),
    due_date: '',
    tax_rate: '0',
    discount: '0',
    notes: '',
    status: 'draft',
  })

  const [items, setItems] = useState<DraftItem[]>([emptyItem()])

  useEffect(() => {
    api
      .listCompanies()
      .then((list) => {
        setCompanies(list)

        if (list.length) {
          setForm((f) => ({ ...f, company_id: String(list[0].id) }))
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false))
  }, [])

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  )
  const taxAmount = (subtotal * (Number(form.tax_rate) || 0)) / 100
  const grandTotal = subtotal + taxAmount - (Number(form.discount) || 0)

  const selectedCompany = companies.find(
    (company) => String(company.id) === form.company_id,
  )

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.company_id) {
      setError('Select a company first.')
      return
    }

    const validItems = items
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      }))

    if (validItems.length === 0) {
      setError('Add at least one line item.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const invoice = await api.createInvoice({
        company_id: Number(form.company_id),
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        status: form.status,
        tax_rate: Number(form.tax_rate) || 0,
        discount: Number(form.discount) || 0,
        notes: form.notes || null,
        items: validItems,
      })

      toast.success(`${invoice.invoice_number} created`)
      navigate(`/invoices/${invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }

  if (companies.length === 0) {
    return (
      <>
        <PageHeader title="New invoice" />
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Add a company first</EmptyTitle>
            <EmptyDescription>
              You need at least one company before creating an invoice.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => navigate('/companies')}>
              Go to companies
            </Button>
          </EmptyContent>
        </Empty>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="New invoice"
        description="Fill in the details below — the invoice number is assigned automatically."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Billed to</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="company">Company</FieldLabel>
                  <Select
                    value={form.company_id}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, company_id: value }))
                    }
                  >
                    <SelectTrigger id="company" className="w-full">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, status: value as InvoiceStatus }))
                    }
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="issue_date">Issue date</FieldLabel>
                  <Input
                    id="issue_date"
                    type="date"
                    required
                    value={form.issue_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issue_date: e.target.value }))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="due_date">Due date</FieldLabel>
                  <Input
                    id="due_date"
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, due_date: e.target.value }))
                    }
                  />
                </Field>
              </div>

              {selectedCompany?.address && (
                <Field>
                  <FieldLabel htmlFor="company_address">
                    Billing address
                  </FieldLabel>
                  <Textarea
                    id="company_address"
                    rows={2}
                    readOnly
                    value={selectedCompany.address}
                  />
                </Field>
              )}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>
              Only rows with a description are saved.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-28">Quantity</TableHead>
                  <TableHead className="w-36">Unit price</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        aria-label={`Line item ${index + 1} description`}
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, 'description', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Line item ${index + 1} quantity`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Line item ${index + 1} unit price`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, 'unit_price', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove line item ${index + 1}`}
                        onClick={() =>
                          setItems((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setItems((current) => [...current, emptyItem()])}
            >
              <Plus />
              Add line item
            </Button>

            <div className="ml-auto mt-6 w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="flex items-center gap-1.5">
                  <Input
                    aria-label="Tax rate"
                    type="number"
                    min="0"
                    step="0.1"
                    className="h-7 w-20 text-right"
                    value={form.tax_rate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tax_rate: e.target.value }))
                    }
                  />
                  <span className="text-muted-foreground">%</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">₹</span>
                  <Input
                    aria-label="Discount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-7 w-24 text-right"
                    value={form.discount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount: e.target.value }))
                    }
                  />
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Optional — printed at the bottom of the invoice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Generating…' : 'Generate invoice'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/invoices')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}

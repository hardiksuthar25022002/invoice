import { useState } from 'react'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface CompanyForm {
  name: string
  address: string
  phone: string
  email: string
}

const empty: CompanyForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
}

export default function NewCompany() {
  const navigate = useNavigate()

  const [form, setForm] = useState<CompanyForm>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (field: keyof CompanyForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Blank optional fields should be sent as null, not "".
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        value.trim() === '' ? null : value.trim(),
      ]),
    ) as { name: string; address: string | null; phone: string | null; email: string | null }

    try {
      await api.createCompany(payload)
      toast.success('Company added')
      navigate('/companies')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Add company"
        description="Companies are the clients your invoices are billed to. Your own details come from your profile."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Client details</CardTitle>
            <CardDescription>Only the name is required.</CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Company name</FieldLabel>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea
                  id="address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save company'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/companies')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}

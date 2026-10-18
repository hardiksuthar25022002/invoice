import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/AuthContext'
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
import type { Me } from '@/types'

const editableFields = [
  'full_name',
  'business_name',
  'job_title',
  'address',
  'phone',
  'tax_id',
  'pan_number',
  'sac_code',
  'bank_account_name',
  'bank_account_number',
  'bank_ifsc',
  'upi_id',
] as const

type EditableField = (typeof editableFields)[number]

type ProfileForm = Record<EditableField, string>

export default function Profile() {
  const { user, saveProfile } = useAuth()

  const [form, setForm] = useState<ProfileForm>(() =>
    Object.fromEntries(
      editableFields.map((field) => [field, user?.[field] ?? '']),
    ) as ProfileForm,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (field: EditableField, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: Partial<Me> = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    )

    try {
      await saveProfile(payload)
      toast.success('Profile saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="This is the “billed from” side of every invoice — it appears in the PDF header and payment footer."
      />

      <Card className="mb-4 max-w-xl">
        <CardHeader>
          <CardDescription>Signed in as</CardDescription>
          <CardTitle className="font-mono text-sm font-medium">
            {user?.email}
          </CardTitle>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={submit}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="full_name">Your name</FieldLabel>
                    <Input
                      id="full_name"
                      required
                      value={form.full_name}
                      onChange={(e) => setField('full_name', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="business_name">
                      Business name
                    </FieldLabel>
                    <Input
                      id="business_name"
                      value={form.business_name}
                      onChange={(e) => setField('business_name', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="job_title">Job title</FieldLabel>
                    <Input
                      id="job_title"
                      value={form.job_title}
                      onChange={(e) => setField('job_title', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Textarea
                    id="address"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setField('address', e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="tax_id">Tax ID</FieldLabel>
                    <Input
                      id="tax_id"
                      value={form.tax_id}
                      onChange={(e) => setField('tax_id', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="pan_number">PAN number</FieldLabel>
                    <Input
                      id="pan_number"
                      value={form.pan_number}
                      onChange={(e) => setField('pan_number', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sac_code">SAC code</FieldLabel>
                    <Input
                      id="sac_code"
                      value={form.sac_code}
                      onChange={(e) => setField('sac_code', e.target.value)}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="bank_account_name">
                      Account holder name
                    </FieldLabel>
                    <Input
                      id="bank_account_name"
                      value={form.bank_account_name}
                      onChange={(e) =>
                        setField('bank_account_name', e.target.value)
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bank_account_number">
                      Account number
                    </FieldLabel>
                    <Input
                      id="bank_account_number"
                      value={form.bank_account_number}
                      onChange={(e) =>
                        setField('bank_account_number', e.target.value)
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bank_ifsc">IFSC</FieldLabel>
                    <Input
                      id="bank_ifsc"
                      value={form.bank_ifsc}
                      onChange={(e) => setField('bank_ifsc', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="upi_id">UPI ID</FieldLabel>
                    <Input
                      id="upi_id"
                      value={form.upi_id}
                      onChange={(e) => setField('upi_id', e.target.value)}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>

      <p className="text-muted-foreground mt-8 text-sm">
        <Link
          to="/terms"
          className="hover:text-foreground underline underline-offset-4"
        >
          Terms of Service
        </Link>
        <span aria-hidden className="px-2">
          ·
        </span>
        <Link
          to="/privacy"
          className="hover:text-foreground underline underline-offset-4"
        >
          Privacy Policy
        </Link>
      </p>
    </>
  )
}

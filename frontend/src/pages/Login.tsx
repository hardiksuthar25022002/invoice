import { Eye, EyeOff, ReceiptText } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/AuthContext'
import { ConfirmEmailCard } from '@/components/confirm-email-card'
import { LegalFooter } from '@/components/legal-footer'
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

type Mode = 'signin' | 'signup'

interface LoginForm {
  full_name: string
  email: string
  password: string
}

export default function Login() {
  const { login, register } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [form, setForm] = useState<LoginForm>({
    full_name: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Set after signing up when Supabase wants the address confirmed first.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const isSignup = mode === 'signup'

  const setField = (field: keyof LoginForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const switchMode = () => {
    setMode(isSignup ? 'signin' : 'signup')
    setShowPassword(false)
    setError(null)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      if (isSignup) {
        const { needsConfirmation } = await register({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
        })

        // "Confirm email" is on: there is no session until the link is opened.
        if (needsConfirmation) setPendingEmail(form.email.trim())
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  if (pendingEmail) {
    return (
      <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
        <ConfirmEmailCard
          email={pendingEmail}
          onUseDifferentEmail={() => {
            setPendingEmail(null)
            setMode('signin')
            setShowPassword(false)
            setForm({ full_name: '', email: '', password: '' })
          }}
        />

        <LegalFooter />
      </div>
    )
  }

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
            <ReceiptText className="size-4" />
          </div>
          <CardTitle className="text-xl">
            {isSignup ? 'Create your account' : 'Sign in to Ledger'}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? 'Your companies and invoices stay private to your account.'
              : 'Sign in to reach your invoices and companies.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              {isSignup && (
                <Field>
                  <FieldLabel htmlFor="full_name">Full name</FieldLabel>
                  <Input
                    id="full_name"
                    required
                    autoComplete="name"
                    value={form.full_name}
                    onChange={(e) => setField('full_name', e.target.value)}
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={isSignup ? 8 : undefined}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className="pr-10"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </Field>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-muted-foreground mt-4 text-center text-sm">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="text-foreground font-medium underline-offset-4 hover:underline"
              onClick={switchMode}
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </CardContent>
      </Card>

      <LegalFooter />
    </div>
  )
}

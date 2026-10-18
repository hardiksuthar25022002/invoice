import { Eye, EyeOff, ReceiptText } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/AuthContext'
import { CheckInboxCard } from '@/components/check-inbox-card'
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

type Mode = 'signin' | 'signup' | 'forgot'

interface LoginForm {
  full_name: string
  email: string
  password: string
}

const HEADINGS: Record<Mode, { title: string; description: string }> = {
  signin: {
    title: 'Sign in to Ledger',
    description: 'Sign in to reach your invoices and companies.',
  },
  signup: {
    title: 'Create your account',
    description: 'Your companies and invoices stay private to your account.',
  },
  forgot: {
    title: 'Reset your password',
    description: 'We will email you a link to choose a new one.',
  },
}

export default function Login() {
  const { login, register, resendConfirmation, requestPasswordReset } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [form, setForm] = useState<LoginForm>({
    full_name: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Set once Supabase has emailed something the visitor has to click.
  const [pending, setPending] = useState<{
    email: string
    kind: 'confirm' | 'reset'
  } | null>(null)

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'

  const setField = (field: keyof LoginForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const switchMode = (next: Mode) => {
    setMode(next)
    setShowPassword(false)
    setError(null)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const email = form.email.trim()

    try {
      if (isForgot) {
        await requestPasswordReset(email)
        setPending({ email, kind: 'reset' })
      } else if (isSignup) {
        const { needsConfirmation } = await register({
          full_name: form.full_name.trim(),
          email,
          password: form.password,
        })

        // "Confirm email" is on: there is no session until the link is opened.
        if (needsConfirmation) setPending({ email, kind: 'confirm' })
      } else {
        await login({ email, password: form.password })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      // Signing in swaps this screen for the app, but the reader can come back
      // here through "Use a different email", so never leave it stuck busy.
      setBusy(false)
    }
  }

  if (pending) {
    return (
      <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
        <CheckInboxCard
          email={pending.email}
          kind={pending.kind}
          onResend={() =>
            pending.kind === 'reset'
              ? requestPasswordReset(pending.email)
              : resendConfirmation(pending.email)
          }
          onUseDifferentEmail={() => {
            setPending(null)
            switchMode('signin')
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
          <CardTitle className="text-xl">{HEADINGS[mode].title}</CardTitle>
          <CardDescription>{HEADINGS[mode].description}</CardDescription>
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

              {!isForgot && (
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

                  {!isSignup && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                        onClick={() => switchMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </Field>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? 'Please wait…'
                  : isForgot
                    ? 'Send reset link'
                    : isSignup
                      ? 'Create account'
                      : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-muted-foreground mt-4 text-center text-sm">
            {isForgot ? (
              <button
                type="button"
                className="text-foreground font-medium underline-offset-4 hover:underline"
                onClick={() => switchMode('signin')}
              >
                Back to sign in
              </button>
            ) : (
              <>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                  onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
                >
                  {isSignup ? 'Sign in' : 'Create one'}
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <LegalFooter />
    </div>
  )
}

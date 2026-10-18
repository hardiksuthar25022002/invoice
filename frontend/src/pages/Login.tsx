import { ArrowLeft, ReceiptText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/AuthContext'
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/** Supabase emails are rate limited, so the resend button waits its turn. */
const RESEND_SECONDS = 30

type Step = 'email' | 'code'

export default function Login() {
  const { sendLoginCode, verifyLoginCode } = useAuth()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const isCodeStep = step === 'code'

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const send = async (address: string) => {
    setBusy(true)
    setError(null)

    try {
      await sendLoginCode(address)
      setSentTo(address)
      setToken('')
      setStep('code')
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send(email.trim())
  }

  const submitCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await verifyLoginCode(email, token)
      // No navigation needed: the auth listener swaps in the app shell.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const backToEmail = () => {
    setStep('email')
    setToken('')
    setError(null)
    setCooldown(0)
  }

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
            <ReceiptText className="size-4" />
          </div>
          <CardTitle className="text-xl">
            {isCodeStep ? 'Enter your code' : 'Sign in to Ledger'}
          </CardTitle>
          <CardDescription>
            {isCodeStep
              ? `We emailed a six-digit code to ${sentTo}.`
              : 'No password to remember — we email you a one-time code.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isCodeStep ? (
            <form onSubmit={submitCode}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="token">One-time code</FieldLabel>
                  <Input
                    id="token"
                    name="token"
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center font-mono text-lg tracking-[0.5em]"
                    value={token}
                    onChange={(e) =>
                      setToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                  />
                  <FieldDescription>
                    You can tap the link in the email instead, if you prefer.
                  </FieldDescription>
                </Field>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || token.length < 6}
                >
                  {busy ? 'Checking…' : 'Verify and sign in'}
                </Button>

                <div className="flex items-center justify-between gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={backToEmail}
                  >
                    <ArrowLeft />
                    Different email
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy || cooldown > 0}
                    onClick={() => void send(email)}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={submitEmail}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <FieldDescription>
                    New addresses get an account automatically — no sign-up
                    form.
                  </FieldDescription>
                </Field>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || !email.trim()}
                >
                  {busy ? 'Sending…' : 'Email me a code'}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground max-w-sm text-center text-xs leading-relaxed">
        By continuing you agree to our{' '}
        <Link
          to="/terms"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          to="/privacy"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

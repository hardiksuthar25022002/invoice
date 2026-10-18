import { MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Supabase allows a fresh confirmation or recovery email 60 seconds after the
 * last one for the same address, so the button waits that long before asking
 * again — the hourly cap is a separate limit anyway.
 */
const RESEND_SECONDS = 60

const COPY = {
  confirm: {
    title: 'Confirm your email',
    resendLabel: 'Resend confirmation email',
    description: (email: ReactNode) => (
      <>We sent a confirmation link to {email}. Open it to finish signing in.</>
    ),
  },
  reset: {
    title: 'Check your inbox',
    resendLabel: 'Resend reset link',
    description: (email: ReactNode) => (
      <>
        We sent a password reset link to {email}. Open it to choose a new
        password.
      </>
    ),
  },
} as const

/**
 * Shown wherever we have emailed the visitor something they have to click:
 * after signing up, after asking for a password reset, and whenever a session
 * turns out to belong to an address that was never confirmed.
 */
export function CheckInboxCard({
  email,
  kind,
  onResend,
  onUseDifferentEmail,
}: {
  email: string
  kind: keyof typeof COPY
  onResend: () => Promise<void>
  onUseDifferentEmail: () => void
}) {
  const { title, resendLabel, description } = COPY[kind]

  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const resend = async () => {
    setBusy(true)
    setError(null)

    try {
      await onResend()
      setResent(true)
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
          <MailCheck className="size-4" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          {description(
            <span className="text-foreground font-medium break-all">
              {email}
            </span>,
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resent && !error && (
          <p className="text-muted-foreground text-xs">
            Sent again — it can take a minute to arrive.
          </p>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => void resend()}
          disabled={busy || cooldown > 0}
        >
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : busy
              ? 'Sending…'
              : resendLabel}
        </Button>

        <Button variant="ghost" className="w-full" onClick={onUseDifferentEmail}>
          Use a different email
        </Button>

        <p className="text-muted-foreground text-xs">
          Nothing yet? Check your spam folder too.
        </p>
      </CardContent>
    </Card>
  )
}

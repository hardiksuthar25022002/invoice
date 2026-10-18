import { MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

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

/** Supabase rate limits its emails, so resending has to wait its turn. */
const RESEND_SECONDS = 30

/**
 * Shown in two places: right after signing up (no session yet) and whenever a
 * session turns out to belong to an address that was never confirmed.
 */
export function ConfirmEmailCard({
  email,
  onUseDifferentEmail,
}: {
  email: string
  onUseDifferentEmail: () => void
}) {
  const { resendConfirmation } = useAuth()

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
      await resendConfirmation(email)
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
        <CardTitle className="text-xl">Confirm your email</CardTitle>
        <CardDescription>
          We sent a confirmation link to{' '}
          <span className="text-foreground font-medium break-all">{email}</span>
          . Open it to finish signing in.
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
              : 'Resend confirmation email'}
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

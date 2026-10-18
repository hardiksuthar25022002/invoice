import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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

/** Matches the minimum the sign-up form asks for. */
const MIN_PASSWORD = 8

/**
 * Shown when the visitor arrives from a "reset your password" link. Supabase
 * has already signed them in with a recovery session, so picking the new
 * password is all that is left; afterwards the app shell opens as usual.
 */
export default function ResetPassword() {
  const { updatePassword, logout } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }

    setBusy(true)
    setError(null)

    try {
      await updatePassword(password)
      // The signed-in shell takes over from here, so announce it from there.
      toast.success('Password updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
            <KeyRound className="size-4" />
          </div>
          <CardTitle className="text-xl">Choose a new password</CardTitle>
          <CardDescription>
            You followed a reset link, so set the password you would like to use
            from now on.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new_password">New password</FieldLabel>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={MIN_PASSWORD}
                    autoComplete="new-password"
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <FieldDescription>
                  At least {MIN_PASSWORD} characters.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm_password">
                  Confirm password
                </FieldLabel>
                <Input
                  id="confirm_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Saving…' : 'Save new password'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => void logout()}
              >
                Cancel and sign out
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { useAuth } from '@/AuthContext'
import { ConfirmEmailCard } from '@/components/confirm-email-card'
import { LegalFooter } from '@/components/legal-footer'

/**
 * Shown when a session belongs to an address that was never confirmed: the
 * "Confirm email" project setting can be off, and the app still will not let
 * that session in.
 */
export default function ConfirmEmail({ email }: { email: string }) {
  const { logout } = useAuth()

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <ConfirmEmailCard
        email={email}
        onUseDifferentEmail={() => void logout()}
      />
      <LegalFooter />
    </div>
  )
}

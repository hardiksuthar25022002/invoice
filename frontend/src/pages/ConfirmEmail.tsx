import { useAuth } from '@/AuthContext'
import { CheckInboxCard } from '@/components/check-inbox-card'
import { LegalFooter } from '@/components/legal-footer'

/**
 * Shown when a session belongs to an address that was never confirmed: the
 * "Confirm email" project setting can be off, and the app still will not let
 * that session in.
 */
export default function ConfirmEmail({ email }: { email: string }) {
  const { logout, resendConfirmation } = useAuth()

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <CheckInboxCard
        email={email}
        kind="confirm"
        onResend={() => resendConfirmation(email)}
        onUseDifferentEmail={() => void logout()}
      />

      <LegalFooter />
    </div>
  )
}

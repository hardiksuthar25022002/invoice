import { Link } from 'react-router-dom'

/** The "By continuing you agree…" line, shown under the sign-in screens. */
export function LegalFooter() {
  return (
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
  )
}

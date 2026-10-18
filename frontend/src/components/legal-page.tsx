import { ReceiptText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { legal } from '@/lib/legal'

/**
 * Shared frame for the legal pages. They are reachable signed out as well, so
 * they carry their own header and links instead of the app shell.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="bg-muted/40 min-h-svh px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <ReceiptText className="size-4" />
          </div>
          <span className="font-semibold">{legal.product}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>Last updated {legal.lastUpdated}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            {children}
          </CardContent>
        </Card>

        <nav className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link
            to="/terms"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            to="/"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Back to {legal.product}
          </Link>
        </nav>
      </div>
    </div>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="text-muted-foreground space-y-2">{children}</div>
    </section>
  )
}

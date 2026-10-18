import { LegalPage, LegalSection } from '@/components/legal-page'
import { legal } from '@/lib/legal'

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms cover your use of {legal.product}, the invoicing app hosted
        at this address. By signing in — or by continuing to use the app — you
        accept them.
      </p>

      <LegalSection title="1. The service">
        <p>
          {legal.product} is a small invoicing tool. There is no server of its
          own: the app runs in your browser and reads and writes the Supabase
          project it is configured with. You are responsible for that project,
          including keeping it running and taking backups.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <p>
          Sign-in uses your email address and a password you choose. Keep that
          password to yourself — anyone who has it can sign in as you, and you
          are responsible for what happens through your account, and for the
          accuracy of the details on the invoices you issue.
        </p>
      </LegalSection>

      <LegalSection title="3. Your data">
        <p>
          The businesses, clients, invoices, line items, tax details, notes and
          payment instructions you enter belong to you. You grant us only the
          access needed to store and show them back to you. Make sure you have
          the right to keep the details you enter about your own clients, and
          remember that an invoice is a legal and tax record — it is your
          responsibility, not ours, to make sure it is correct and complete.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Do not use {legal.product} to create fraudulent, misleading or
            unlawful documents, or to avoid tax you owe.
          </li>
          <li>
            Do not try to reach another account&apos;s data, break the app, or
            interrupt it for anyone else.
          </li>
          <li>
            Do not use the sign-in emails to send unsolicited mail to people who
            are not you.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Availability">
        <p>
          {legal.product} is provided &ldquo;as is&rdquo;, without warranties of
          any kind. We do not promise that it will be available, error-free, or
          fit for a particular accounting or legal requirement. Keep your own
          copies of anything you cannot afford to lose.
        </p>
      </LegalSection>

      <LegalSection title="6. Limits on our liability">
        <p>
          To the extent the law allows, we are not liable for lost or corrupted
          data, lost profits or business, or for fines, penalties or interest
          arising from the invoices you issue with the app.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes">
        <p>
          These terms may change as the app changes. The date at the top is the
          most recent revision; continuing to use {legal.product} after a change
          means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          Questions about these terms? Email{' '}
          <a
            className="text-foreground underline underline-offset-4"
            href={`mailto:${legal.contactEmail}`}
          >
            {legal.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}

import { LegalPage, LegalSection } from '@/components/legal-page'
import { legal } from '@/lib/legal'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what {legal.product} stores, where it is kept, and
        what leaves your browser. It should be read together with our Terms of
        Service.
      </p>

      <LegalSection title="1. What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground font-medium">Your email address</span>
            , used to sign you in.
          </li>
          <li>
            <span className="text-foreground font-medium">
              The business details you enter
            </span>{' '}
            — business name, job title, address, phone, tax ID, PAN, SAC code,
            bank account and UPI details.
          </li>
          <li>
            <span className="text-foreground font-medium">
              Your clients and documents
            </span>{' '}
            — companies, invoices, line items, tax and discount amounts, notes
            and due dates.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. What we do not collect">
        <p>
          There are no passwords (sign-in codes are single use), no card or
          payment details, no advertising identifiers and no third-party
          analytics or tracking scripts in the app.
        </p>
      </LegalSection>

      <LegalSection title="3. Where your data lives">
        <p>
          Everything is stored in the Supabase project this deployment is
          configured with — a Postgres database that Supabase hosts. Row level
          security policies mean a signed-in account can only read and write its
          own rows. If someone else operates this deployment, they control that
          project and can access the database directly.
        </p>
      </LegalSection>

      <LegalSection title="4. Email">
        <p>
          Supabase sends the one-time sign-in codes on our behalf. Your address
          is not used for marketing, and it is not shared with anyone else.
        </p>
      </LegalSection>

      <LegalSection title="5. What is stored in your browser">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground font-medium">Session token</span> —
            set by the Supabase client so you stay signed in.
          </li>
          <li>
            <span className="text-foreground font-medium">Theme preference</span>{' '}
            — light, dark or system, kept in local storage.
          </li>
        </ul>
        <p>Neither is used to track you across other sites.</p>
      </LegalSection>

      <LegalSection title="6. PDF exports">
        <p>
          Invoice PDFs are rendered inside your browser and downloaded straight
          to your device. The document is never uploaded to be rendered.
        </p>
      </LegalSection>

      <LegalSection title="7. How long we keep it">
        <p>
          Your data stays until you delete it. Deleting an invoice removes its
          line items with it, and deleting a company removes the invoices that
          belonged to it. To have your account and everything in it removed,
          email us and we will delete the rows.
        </p>
      </LegalSection>

      <LegalSection title="8. Who we share it with">
        <p>
          Supabase, as the database and email provider. We do not sell your data
          and do not pass it to advertisers or data brokers.
        </p>
      </LegalSection>

      <LegalSection title="9. Your choices">
        <p>
          Everything the app holds is visible to you: correct your details on
          the Profile page, delete invoices and companies from their pages, and
          export any invoice as a PDF. For a copy of your data, or to have it
          erased, contact us.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Privacy questions or requests: email{' '}
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

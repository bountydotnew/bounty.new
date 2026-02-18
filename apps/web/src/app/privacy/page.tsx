import type { Metadata } from 'next';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { TableOfContents } from '@/components/legal/table-of-contents';

export const metadata: Metadata = {
  title: 'Privacy Policy - bounty.new',
  description:
    'Privacy Policy for bounty.new. Learn how we collect, use, and protect your personal information.',
  openGraph: {
    title: 'Privacy Policy - bounty.new',
    description:
      'Privacy Policy for bounty.new. Learn how we collect, use, and protect your personal information.',
    url: 'https://bounty.new/privacy',
    siteName: 'bounty.new',
  },
};

const sections = [
  { id: 'commitment', title: 'Our Commitment' },
  { id: 'collection', title: 'Information We Collect' },
  { id: 'usage', title: 'How We Use It' },
  { id: 'storage', title: 'Data Storage & Location' },
  { id: 'visibility', title: 'What We Can See' },
  { id: 'third-parties', title: 'Third-Party Services' },
  { id: 'sharing', title: 'Data Sharing' },
  { id: 'rights', title: 'Your Rights' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'security', title: 'Security' },
  { id: 'changes', title: 'Changes to Policy' },
  { id: 'contact', title: 'Contact' },
];

function PrivacyPageHeader() {
  return (
    <header className="mb-12">
      <h1 className="text-balance font-display text-4xl tracking-tight text-foreground md:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-[15px] text-text-muted">
        Last updated: February 1, 2026
      </p>
    </header>
  );
}

function CommitmentSection() {
  return (
    <section id="commitment">
      <h2>Our Commitment</h2>
      <p>
        We collect what we need to run the platform. We don't sell your data.
        This policy explains what we collect and why.
      </p>
    </section>
  );
}

function InformationCollectionSection() {
  return (
    <>
      <hr />

      <section id="collection">
        <h2>Information We Collect</h2>

        <h3>Account Information</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>
            <strong>Basic info:</strong> Name, email address, username
          </li>
          <li>
            <strong>Profile picture:</strong> If you upload one, or use a social
            login that provides one
          </li>
          <li>
            <strong>Authentication data:</strong> Password (hashed - we can't
            see it) or OAuth tokens if you use social login
          </li>
        </ul>

        <h3>Profile Data</h3>
        <p>Information you choose to add to your profile:</p>
        <ul>
          <li>Bio and description</li>
          <li>Skills and expertise</li>
          <li>Links to your website, GitHub, Twitter, etc.</li>
          <li>Location (if you share it)</li>
        </ul>

        <h3>Content You Create</h3>
        <p>Everything you post on the platform:</p>
        <ul>
          <li>Bounties you create</li>
          <li>Submissions you make</li>
          <li>Comments and messages</li>
          <li>Any files or attachments you upload</li>
        </ul>

        <h3>Payment Information</h3>
        <p>
          Payment processing is handled by <strong>Stripe</strong>. We do not
          store your full credit card number, CVV, or other sensitive payment
          details on our servers. Stripe handles all of that securely.
        </p>
        <p>We do receive and store:</p>
        <ul>
          <li>Last 4 digits of your card (for your reference)</li>
          <li>Card type and expiration date</li>
          <li>Billing address</li>
          <li>Transaction history and amounts</li>
        </ul>

        <h3>Analytics Data</h3>
        <p>
          We use privacy-focused analytics (Databuddy) to understand how people
          use the platform. This is GDPR compliant and collects:
        </p>
        <ul>
          <li>Page views (which pages are visited)</li>
          <li>Referrer information (how you found us)</li>
          <li>
            General geographic region (country-level, not precise location)
          </li>
        </ul>
        <p>
          We don't track individual user behavior across sessions or build
          profiles about you.
        </p>

        <h3>Device & Technical Information</h3>
        <ul>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>IP address</li>
          <li>Device type (mobile, desktop, etc.)</li>
          <li>Referring website (how you found us)</li>
        </ul>
      </section>
    </>
  );
}

function HowWeUseSection() {
  return (
    <>
      <hr />

      <section id="usage">
        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide the service (bounties, submissions, profiles)</li>
          <li>Process payments</li>
          <li>Send notifications</li>
          <li>Prevent fraud and abuse</li>
          <li>Provide support</li>
          <li>Comply with legal requirements</li>
        </ul>
        <p>
          We <strong>don't</strong> sell your data to advertisers or data
          brokers.
        </p>
      </section>
    </>
  );
}

function DataStorageSection() {
  return (
    <>
      <hr />

      <section id="storage">
        <h2>Data Storage & Location</h2>
        <p>
          Data stored in the <strong>United States</strong> on secure cloud
          infrastructure. Encrypted in transit (TLS) and at rest. Access limited
          to authorized team members.
        </p>
      </section>
    </>
  );
}

function VisibilitySection() {
  return (
    <>
      <hr />

      <section id="visibility">
        <h2>What We Can See</h2>
        <p>
          <strong>We can see:</strong> Profile info, bounties, submissions,
          comments, transaction history.
        </p>
        <p>
          <strong>We cannot see:</strong> Your password (hashed), full card
          details (Stripe handles that).
        </p>
        <p>
          We only access user data for support, investigating abuse, debugging
          issues, or legal requirements.
        </p>
      </section>
    </>
  );
}

function ThirdPartiesSection() {
  return (
    <>
      <hr />

      <section id="third-parties">
        <h2>Third-Party Services</h2>
        <ul>
          <li>
            <strong>Stripe:</strong> Payment processing (
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              their privacy policy
            </a>
            )
          </li>
          <li>
            <strong>Databuddy:</strong> GDPR-compliant analytics
          </li>
          <li>
            <strong>Cloud hosting:</strong> Secure infrastructure providers
          </li>
          <li>
            <strong>Email services:</strong> For notifications
          </li>
        </ul>
      </section>
    </>
  );
}

function DataSharingSection() {
  return (
    <>
      <hr />

      <section id="sharing">
        <h2>Data Sharing</h2>
        <ul>
          <li>
            <strong>Public info:</strong> Profile, bounties, submissions are
            visible to other users
          </li>
          <li>
            <strong>Service providers:</strong> Only what's needed to operate
            (payment, hosting, etc.)
          </li>
          <li>
            <strong>Legal:</strong> If required by law
          </li>
          <li>
            <strong>Business transfers:</strong> If acquired, data may transfer
            (you'd be notified)
          </li>
        </ul>
        <p>
          <strong>We never sell your personal data.</strong>
        </p>
      </section>
    </>
  );
}

function YourRightsSection() {
  return (
    <>
      <hr />

      <section id="rights">
        <h2>Your Rights</h2>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of your data
          </li>
          <li>
            <strong>Correct:</strong> Update inaccurate info in settings
          </li>
          <li>
            <strong>Delete:</strong> Request account deletion
          </li>
          <li>
            <strong>Export:</strong> Download your data
          </li>
          <li>
            <strong>Opt-out:</strong> Unsubscribe from marketing emails
          </li>
        </ul>
        <p>
          Email <a href="mailto:support@bounty.new">support@bounty.new</a> to
          exercise these rights.
        </p>
      </section>
    </>
  );
}

function RetentionSection() {
  return (
    <>
      <hr />

      <section id="retention">
        <h2>Data Retention</h2>
        <p>
          Active accounts: data retained while account exists. Deleted accounts:
          data removed within 30 days (backups may briefly retain data).
        </p>
        <p>
          Transaction records kept for tax/legal purposes. Banned account info
          retained to prevent re-registration.
        </p>
      </section>
    </>
  );
}

function CookiesSection() {
  return (
    <>
      <hr />

      <section id="cookies">
        <h2>Cookies</h2>
        <p>We use cookies and similar technologies. Here's what they do:</p>

        <h3>Essential Cookies</h3>
        <p>
          Required for the site to function. These handle things like keeping
          you logged in and remembering your preferences. You can't opt out of
          these without breaking the site.
        </p>

        <h3>Analytics Cookies</h3>
        <p>
          Help us understand how people use the platform. We try to use
          privacy-friendly analytics that don't track you across the web. You
          can opt out of these.
        </p>

        <h3>Preference Cookies</h3>
        <p>Remember your settings, like dark mode or language preferences.</p>

        <h3>Managing Cookies</h3>
        <p>
          Your browser lets you control cookies. You can block or delete them,
          but this may affect how bounty.new works for you.
        </p>
      </section>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <hr />

      <section id="security">
        <h2>Security</h2>
        <p>We take security seriously. Here's what we do:</p>
        <ul>
          <li>Encryption for data in transit and at rest</li>
          <li>Secure authentication practices</li>
          <li>Regular security reviews and updates</li>
          <li>Access controls and monitoring</li>
          <li>Secure coding practices</li>
        </ul>
        <p>
          That said, no system is 100% secure. We can't guarantee absolute
          security, so please:
        </p>
        <ul>
          <li>Use a strong, unique password</li>
          <li>Don't share your login credentials</li>
          <li>Log out on shared devices</li>
          <li>Let us know if you notice anything suspicious</li>
        </ul>
        <p>
          If you discover a security vulnerability, please report it to{' '}
          <a href="mailto:support@bounty.new">support@bounty.new</a>. We
          appreciate responsible disclosure.
        </p>
      </section>
    </>
  );
}

function ChangesSection() {
  return (
    <>
      <hr />

      <section id="changes">
        <h2>Changes to This Policy</h2>
        <p>We may update this privacy policy from time to time. When we do:</p>
        <ul>
          <li>We'll update the "Last updated" date at the top</li>
          <li>
            For significant changes, we'll notify you via email or through the
            app
          </li>
          <li>
            We'll keep previous versions available if you want to see what
            changed
          </li>
        </ul>
        <p>
          Continued use of bounty.new after changes means you accept the updated
          policy. If you don't agree with changes, you can delete your account.
        </p>
      </section>
    </>
  );
}

function ContactSection() {
  return (
    <>
      <hr />

      <section id="contact">
        <h2>Contact Us</h2>
        <p>
          Questions, concerns, or requests about your privacy? We're here to
          help.
        </p>
        <p>
          <strong>Email:</strong>{' '}
          <a href="mailto:support@bounty.new">support@bounty.new</a>
        </p>
        <p>
          We aim to respond within a few business days. For data requests,
          please allow up to 30 days.
        </p>
        <p>
          Thanks for trusting bounty.new with your information. We don't take
          that lightly.
        </p>
      </section>
    </>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <section className="flex-1 px-8 pt-32 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-12 xl:grid-cols-[200px_1fr]">
            {/* Sticky Table of Contents - Desktop */}
            <div className="hidden xl:block">
              <div className="sticky top-32">
                <TableOfContents sections={sections} />
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl">
              <PrivacyPageHeader />

              <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-text-secondary prose-p:leading-[1.8] prose-a:text-foreground prose-a:underline prose-a:decoration-border-subtle hover:prose-a:decoration-foreground prose-strong:text-foreground prose-ul:text-text-secondary prose-li:text-text-secondary prose-li:leading-[1.8] prose-hr:border-border-subtle">
                <CommitmentSection />
                <InformationCollectionSection />
                <HowWeUseSection />
                <DataStorageSection />
                <VisibilitySection />
                <ThirdPartiesSection />
                <DataSharingSection />
                <YourRightsSection />
                <RetentionSection />
                <CookiesSection />
                <SecuritySection />
                <ChangesSection />
                <ContactSection />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

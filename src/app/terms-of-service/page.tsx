import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>

      <p className="mb-8 text-sm text-muted-foreground">
        Effective September 7, 2026
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            1. Acceptance of Terms
          </h2>

          <p>
            By accessing or using Useless Achievements, you agree to be bound by
            these Terms of Service. If you do not agree with these Terms, you
            must not access or use the service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. Description of Service
          </h2>

          <p className="mb-2">
            Useless Achievements is a digital platform where users can unlock,
            collect, track, and share intentionally ridiculous achievements.
          </p>

          <p className="mb-2">
            The service may include user accounts, achievement tracking,
            streaks, leaderboards, Achievement Packs, subscription features, and
            tools for creating shareable achievement images.
          </p>

          <p>
            We may add, modify, suspend, or discontinue features of the service
            as it evolves.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">3. User Accounts</h2>

          <p className="mb-2">
            Certain features require an account. You are responsible for:
          </p>

          <ul className="list-disc space-y-1 pl-6">
            <li>Providing accurate and complete account information</li>

            <li>
              Maintaining the confidentiality and security of your account
              credentials
            </li>

            <li>Keeping your contact information reasonably up to date</li>

            <li>Activity that occurs through your account</li>
          </ul>

          <p className="mt-3">
            We may suspend or terminate accounts that violate these Terms, abuse
            the service, threaten the security or integrity of the service,
            engage in fraudulent activity, or where required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">4. Achievement Packs</h2>

          <p className="mb-2">
            Useless Achievements may offer optional Achievement Packs that
            provide access to additional achievements or themed collections.
          </p>

          <p className="mb-2">
            Achievement Packs may include seasonal, event-based, themed, or
            other special achievement content.
          </p>

          <p className="mb-2">
            Purchasing an Achievement Pack provides access to the digital
            content associated with that pack for the account that completed the
            purchase.
          </p>

          <p>
            Achievement Packs are digital products. They do not represent
            physical goods, currency, cash value, securities, prizes, or
            transferable property.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            5. Seasonal and Limited-Time Achievements
          </h2>

          <p className="mb-2">
            Some Achievement Packs or individual achievements may only be
            available, unlockable, or active during specific dates, seasons,
            events, or time periods.
          </p>

          <p>
            Owning a seasonal Achievement Pack does not necessarily mean that
            every achievement in that pack can be unlocked at any time. Certain
            achievements may require you to use the service during the
            applicable season or event.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">6. Subscriptions</h2>

          <p className="mb-2">
            Useless Achievements may offer paid subscription plans that provide
            access to additional features, content, benefits, or achievement
            experiences.
          </p>

          <p className="mb-2">
            Paid subscriptions automatically renew at the applicable billing
            interval unless canceled before the next renewal date.
          </p>

          <p className="mb-2">
            You may cancel your subscription at any time using the
            subscription-management options made available through the service.
          </p>

          <p>
            Canceling a subscription prevents future renewals. Unless otherwise
            stated, subscription benefits remain available through the end of
            the current paid billing period.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            7. Subscription Content and Purchased Packs
          </h2>

          <p className="mb-2">
            Some content may be available because of an active subscription,
            while other content may be purchased separately as an Achievement
            Pack.
          </p>

          <p className="mb-2">
            Content that is available only through a subscription may become
            unavailable when the subscription ends.
          </p>

          <p>
            Achievement Packs purchased separately from a subscription remain
            associated with the purchasing account unless otherwise stated at
            the time of purchase or required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            8. Pricing and Billing
          </h2>

          <p className="mb-2">
            Prices for subscriptions, Achievement Packs, and other paid features
            will be displayed before you complete a purchase.
          </p>

          <p className="mb-2">
            Payments are processed by third-party payment processors. By
            submitting a purchase, you agree to provide valid payment
            information and authorize the applicable charges.
          </p>

          <p className="mb-2">
            Taxes or other charges may apply depending on your location and
            applicable law.
          </p>

          <p>
            We may change pricing for future purchases or future subscription
            periods. Changes to recurring subscription pricing will be
            communicated as required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">9. Refunds</h2>

          <p className="mb-2">
            Except where required by law or otherwise stated during checkout,
            digital Achievement Pack purchases and subscription charges are
            non-refundable once access to the applicable digital content or
            service has been provided.
          </p>

          <p>
            If you believe you were charged incorrectly, charged more than once,
            or experienced another billing problem, contact us and we will
            review the issue.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            10. Achievement Availability and Changes
          </h2>

          <p className="mb-2">
            Achievements are part of an evolving digital service. We may
            occasionally change achievement names, descriptions, requirements,
            rarity levels, artwork, availability, or other characteristics.
          </p>

          <p className="mb-2">
            We may also add, replace, retire, rebalance, or reorganize
            achievements and Achievement Packs as the service evolves.
          </p>

          <p>
            Where paid content is affected, we will make reasonable efforts to
            preserve equivalent access or provide another appropriate remedy
            where required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            11. Achievement Progress and Streaks
          </h2>

          <p className="mb-2">
            Achievement progress, streaks, unlock conditions, leaderboard
            positions, and similar features are provided as part of the
            entertainment experience.
          </p>

          <p>
            We do not guarantee that streaks, rankings, achievement
            availability, or other progress-based features will remain unchanged
            indefinitely.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            12. Sharing Achievements
          </h2>

          <p className="mb-2">
            Useless Achievements may provide tools that allow you to create,
            download, copy, or share images representing achievements you have
            unlocked.
          </p>

          <p>
            You are responsible for how and where you share achievement images
            outside of Useless Achievements and for complying with the terms and
            rules of any third-party platform where you share them.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            13. Prohibited Activities
          </h2>

          <p className="mb-2">
            You agree not to misuse Useless Achievements or engage in activities
            that may harm the service or other users, including:
          </p>

          <ul className="list-disc space-y-1 pl-6">
            <li>Violating applicable laws or regulations</li>

            <li>
              Attempting to gain unauthorized access to accounts, systems, or
              data
            </li>

            <li>
              Interfering with or disrupting the service or its infrastructure
            </li>

            <li>
              Attempting to bypass security, billing, achievement, or
              entitlement systems
            </li>

            <li>
              Using automated systems, bots, scripts, or scraping tools to
              access the service in a manner that creates unreasonable load or
              circumvents intended functionality
            </li>

            <li>
              Attempting to fraudulently obtain paid content, subscriptions,
              Achievement Packs, achievements, or account benefits
            </li>

            <li>
              Impersonating another person or misrepresenting your identity
            </li>

            <li>
              Using the service to distribute malware or other harmful code
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            14. Intellectual Property
          </h2>

          <p className="mb-2">
            Useless Achievements, including its original artwork, achievement
            names and descriptions, visual designs, software, branding,
            graphics, and other original content, is owned by Useless
            Achievements or its licensors and is protected by applicable
            intellectual property laws.
          </p>

          <p>
            These Terms do not transfer ownership of the service or its
            intellectual property to you.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            15. Third-Party Services
          </h2>

          <p>
            Useless Achievements may rely on third-party services for features
            such as authentication, hosting, analytics, email delivery,
            payments, and other infrastructure. Those services may be subject to
            their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            16. Disclaimer of Warranties
          </h2>

          <p>
            Useless Achievements is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; without warranties of any kind, express or implied,
            to the maximum extent permitted by law. We do not guarantee that the
            service will always be available, uninterrupted, secure, or
            error-free.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            17. Limitation of Liability
          </h2>

          <p>
            To the maximum extent permitted by applicable law, Useless
            Achievements and its operators will not be liable for indirect,
            incidental, special, consequential, exemplary, or punitive damages
            arising from or related to your use of, or inability to use, the
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            18. Account Termination
          </h2>

          <p className="mb-2">
            You may stop using Useless Achievements at any time.
          </p>

          <p className="mb-2">
            We may suspend or terminate access to the service where reasonably
            necessary to enforce these Terms, prevent abuse or fraud, protect
            users or the service, or comply with legal obligations.
          </p>

          <p>
            Account termination may result in the loss of saved achievements,
            streaks, progress, preferences, and other account data, subject to
            applicable legal requirements.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            19. Changes to These Terms
          </h2>

          <p className="mb-2">
            We may update these Terms from time to time as Useless Achievements
            changes.
          </p>

          <p>
            When material changes are made, we will post the updated Terms and
            update the effective date above. Your continued use of the service
            after updated Terms take effect means you accept the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">20. Governing Law</h2>

          <p>
            These Terms will be governed by the laws applicable in the
            jurisdiction in which Useless Achievements operates, without regard
            to conflict-of-law principles, except where applicable consumer law
            requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">21. Severability</h2>

          <p>
            If any provision of these Terms is found to be invalid or
            unenforceable, the remaining provisions will remain in effect to the
            fullest extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">22. Contact Us</h2>

          <p>
            If you have questions about these Terms of Service or a billing
            issue, contact us at{" "}
            <a
              href="mailto:info@uselessachievements.com"
              className="text-blue-600 hover:underline"
            >
              info@uselessachievements.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

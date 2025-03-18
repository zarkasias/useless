import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="mb-2">
            By accessing or using Pointless Achievements, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access or use our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
          <p className="mb-2">
            Pointless Achievements is a platform that allows users to unlock and share achievements. The service includes features such as user accounts, achievement tracking, and social sharing capabilities.
          </p>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
          <p className="mb-2">
            To use certain features of the service, you may need to create an account. You are responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Providing accurate and complete information when creating your account</li>
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
          </ul>
          <p className="mt-2">
            We reserve the right to terminate accounts or refuse service to anyone for any reason at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. User Content</h2>
          <p className="mb-2">
            Users may post content, including profile information and achievement comments. You retain all rights to your content, but grant us a non-exclusive, transferable, sub-licensable, royalty-free, worldwide license to use any content you post.
          </p>
          <p className="mb-2">
            You are solely responsible for your content and the consequences of posting it. We reserve the right to remove any content that violates these terms or that we find objectionable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Prohibited Activities</h2>
          <p className="mb-2">You agree not to engage in any of the following activities:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Violating laws or regulations</li>
            <li>Infringing on the rights of others</li>
            <li>Posting content that is harmful, abusive, or offensive</li>
            <li>Attempting to interfere with or compromise the system integrity or security</li>
            <li>Using automated means to access or collect data from the service</li>
            <li>Impersonating another person or entity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Intellectual Property</h2>
          <p className="mb-2">
            The service and its original content, features, and functionality are owned by Pointless Achievements and are protected by copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
          <p className="mb-2">
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="mb-2">
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">9. Changes to Terms</h2>
          <p className="mb-2">
            We may modify these terms at any time. We will notify users of any material changes by posting a notice on our website. Your continued use of the service after any changes indicates your acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">10. Governing Law</h2>
          <p className="mb-2">
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
          <p className="mb-2">
            If you have any questions about these Terms of Service, please contact us at terms@pointlessachievements.com.
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
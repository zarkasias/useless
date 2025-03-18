import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
          <p className="mb-2">
            Welcome to Useless Achievements. We respect your privacy and are committed to protecting your personal data.
            This privacy policy explains how we collect, use, and share information about you when you use our website and services.
          </p>
          <p>
            Please read this privacy policy carefully. If you do not agree with our policies, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
          <p className="mb-2">We may collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Personal information (name, email address) when you create an account</li>
            <li>Usage data about how you interact with our service</li>
            <li>Device information including IP address and browser type</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-4 mb-2">Analytics</h3>
          <p className="mb-2">
            We use Google Analytics to help us understand how visitors interact with our website. 
            Google Analytics uses cookies and similar technologies to collect information about your use of our services 
            and provides us with anonymized statistics about user behavior.
          </p>
          <p>
            You can learn more about how Google Analytics collects and processes data by visiting: 
            <Link href="https://policies.google.com/technologies/partner-sites" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
              Google Analytics Privacy Policy
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p className="mb-2">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and manage your account</li>
            <li>Send notifications related to your account or activity</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends and usage</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Sharing Your Information</h2>
          <p className="mb-2">
            We do not sell your personal information. We may share your information in the following situations:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With service providers who help us operate our business</li>
            <li>To comply with legal obligations</li>
            <li>With your consent or at your direction</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information.
            However, no internet transmission is completely secure, and we cannot guarantee the security of information you provide.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
          <p className="mb-2">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your information</li>
            <li>Objection to certain processing of your information</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-4 mb-2">Opting Out of Analytics</h3>
          <p>
            You can opt out of Google Analytics tracking by using the Google Analytics Opt-Out Browser Add-on, available at:
            <Link href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
              https://tools.google.com/dlpage/gaoptout
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page
            and updating the effective date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy, please contact us at privacy@uselessachievements.com.
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
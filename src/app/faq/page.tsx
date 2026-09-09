import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Useless Achievements?",
      answer:
        "Useless Achievements is a collection of intentionally ridiculous digital achievements you can unlock while using the site. Some reward ordinary behavior, some require unusual timing or milestones, and some exist simply because they made us laugh.",
    },
    {
      question: "Do I need an account?",
      answer:
        "You can explore parts of Useless Achievements without an account, but an account is required to permanently save achievements, streaks, purchases, and other progress.",
    },
    {
      question: "What are Achievement Packs?",
      answer:
        "Achievement Packs are themed collections of additional achievements. Packs may be based on holidays, events, themes, or other special collections.",
    },
    {
      question: "Are Achievement Packs physical products?",
      answer:
        "No. Achievement Packs are digital content available inside Useless Achievements. Nothing will arrive in the mail, unfortunately.",
    },
    {
      question: "Do purchased Achievement Packs expire?",
      answer:
        "Purchased packs are associated with your Useless Achievements account. Some packs may contain seasonal achievements that can only be unlocked during certain dates or events, even though the pack remains associated with your account.",
    },
    {
      question: "What happens if an Achievement Pack is seasonal?",
      answer:
        "Seasonal packs may only allow certain achievements to be earned during their associated season or event. For example, a Halloween achievement may only become available around Halloween.",
    },
    {
      question: "What is a subscription?",
      answer:
        "A subscription provides access to additional Useless Achievements features or content for as long as the subscription remains active.",
    },
    {
      question: "Does my subscription renew automatically?",
      answer:
        "Yes, paid subscriptions automatically renew at the applicable billing interval unless you cancel before the next renewal date.",
    },
    {
      question: "Can I cancel my subscription?",
      answer:
        "Yes. You can cancel your subscription at any time. Canceling prevents the next renewal, and you will normally retain access to paid subscription features until the end of your current billing period.",
    },
    {
      question: "Do I lose Achievement Packs if I cancel my subscription?",
      answer:
        "Achievement Packs that you purchased separately remain associated with your account. Subscription-only content or benefits may no longer be available after your subscription period ends.",
    },
    {
      question: "Can I buy the same Achievement Pack twice?",
      answer:
        "A pack you already own should remain associated with your account, so there should normally be no reason to purchase it again.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Digital purchases and subscription charges are generally non-refundable after access has been provided, except where required by law or otherwise stated during checkout. Contact us if you believe there has been a billing error.",
    },
    {
      question: "How are payments handled?",
      answer:
        "Payments are processed by a third-party payment provider. Useless Achievements does not store your full payment card number or card security code.",
    },
    {
      question: "Why didn't I unlock an achievement?",
      answer:
        "Some achievements have specific requirements involving dates, times, streaks, milestones, packs, or other activity. If you think something should have unlocked but didn't, try again later or contact us.",
    },
    {
      question: "Can achievement requirements change?",
      answer:
        "Occasionally. We may adjust achievement requirements, descriptions, rarity, or availability as the site evolves.",
    },
    {
      question: "Can I share my achievements?",
      answer:
        "Yes. Collected achievements can be prepared as shareable images so you can save or share them outside Useless Achievements.",
    },
    {
      question: "Can I delete my account?",
      answer:
        "If you want your account or personal information deleted, contact us at info@uselessachievements.com. Account deletion may permanently remove saved achievements, streaks, and other account data.",
    },
    {
      question: "I found a bug. Did I unlock an achievement?",
      answer:
        "Possibly. Around here, it's difficult to tell where the bugs end and the achievements begin.",
    },
  ];
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>

        <p className="mt-2 text-muted-foreground">
          Everything you never knew you needed to know about useless
          achievements.
        </p>
      </div>

      <div className="space-y-8">
        {faqs.map((faq) => (
          <section key={faq.question}>
            <h2 className="mb-2 text-xl font-semibold">{faq.question}</h2>

            <p className="leading-7 text-muted-foreground">{faq.answer}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Still have a question? Email{" "}
          <a
            href="mailto:info@uselessachievements.com"
            className="text-blue-600 hover:underline"
          >
            info@uselessachievements.com
          </a>
          .
        </p>

        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Script from "next/script";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Useless Achievements",
  description: "Unlock and share hilariously useless achievements!",
  keywords: [
    "useless achievements",
    "funny achievements",
    "virtual achievements",
    "achievement unlocked",
    "web achievements",
    "online achievements",
    "gaming achievements",
    "digital awards",
    "shareable achievements"
  ],
  authors: [
    {
      name: "Useless Achievements Team",
      url: "https://uselessachievements.com",
    },
  ],
  creator: "Useless Achievements",
  publisher: "Useless Achievements",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://uselessachievements.com",
    title: "Useless Achievements - Unlock Hilariously Useless Digital Awards",
    description: "Collect and share fun, absurd achievements that celebrate life's mundane moments. Unlock your first achievement today!",
    siteName: "Useless Achievements",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Useless Achievements - Collect and share fun digital awards",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://uselessachievements.com",
    languages: {
      'en-US': "https://uselessachievements.com",
    },
  },
  other: {
    'msapplication-TileColor': '#38bdf8', // Set a branded tile color
    'theme-color': '#38bdf8' // Set a theme color for mobile browsers
  },
  category: 'entertainment',
};

function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left ml-2">
          © {new Date().getFullYear()} Useless Achievements. All rights reserved.
        </p>
        <nav className="flex items-center space-x-4 text-sm">
          <Link href="/privacy-policy" className="text-muted-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="text-muted-foreground hover:underline">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}

// JSON-LD structured data for enhanced SEO
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Useless Achievements",
    "url": "https://uselessachievements.com",
    "description": "Unlock and share hilariously useless achievements!",
    "applicationCategory": "Entertainment",
    "genre": "Achievement Collection",
    "image": "https://uselessachievements.com/og-image.png",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "ratingCount": "89"
    }
  };

  return (
    <Script 
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          fontSans.variable
        )}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <StructuredData />
        <Toaster position="top-right" expand={true} richColors />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

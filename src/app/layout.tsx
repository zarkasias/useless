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
  title: "Useless Achievements - Unlock Hilariously Useless Digital Awards",
  description: "Unlock and share hilariously useless achievements!",
  metadataBase: new URL("https://uselessachievements.com"),
  manifest: "/manifest.json",
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
  twitter: {
    card: "summary_large_image",
    site: "@zarkasias",
    title: "Useless Achievements - Celebrate Life's Funniest Moments!",
    description: "Unlock and share hilariously pointless milestones. Track your absurd achievements now!",
    images: [
      {
        url: "/og-image.png",
        alt: "Useless Achievements - Unlock and Share Hilarious Moments",
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
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicons/android-chrome-192x192.png",
        color: "#38bdf8",
      },
    ],
  },
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

function ProductHuntBadge() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <a href="https://www.producthunt.com/posts/useless-achievements?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-useless&#0045;achievements" target="_blank" rel="noopener noreferrer">
        <img 
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=943979&theme=neutral&t=1742414567377" 
          alt="Useless&#0032;Achievements - Unlock&#0032;hilariously&#0032;useless&#0032;digital&#0032;awards | Product Hunt" 
          style={{ width: "250px", height: "54px" }} 
          width="250" 
          height="54" 
        />
      </a>
    </div>
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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5732734926517492"
          crossOrigin="anonymous"
          strategy="afterInteractive"
          id="google-adsense"
        />
        <Toaster position="top-right" expand={true} richColors />
        <main className="flex-1">{children}</main>
        <Footer />
        <ProductHuntBadge />
      </body>
    </html>
  );
}

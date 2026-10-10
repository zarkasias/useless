import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { Instagram } from "lucide-react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Script from "next/script";
import { IdleSessionManager } from "@/components/auth/idle-session-manager";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default:
      "Useless Achievements - Collect Ridiculously Pointless Achievements",
    template: "%s | Useless Achievements",
  },
  description:
    "Collect hilariously useless achievements, build your collection, keep a daily streak, climb the leaderboard, and unlock themed achievement packs.",
  metadataBase: new URL("https://www.uselessachievements.com"),
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
    "shareable achievements",
  ],
  authors: [
    {
      name: "Useless Achievements Team",
      url: "https://www.uselessachievements.com",
    },
  ],
  creator: "Useless Achievements",
  publisher: "Useless Achievements",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.uselessachievements.com",

    title: "Useless Achievements - Collect Ridiculously Pointless Achievements",
    description:
      "Collect absurd daily achievements, build your collection, maintain your streak, climb the leaderboard, and unlock themed packs.",
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
    title: "Useless Achievements - Celebrate Absoluteley Nothing",
    description:
      "Collect absurd daily achievements, build your collection, maintain your streak, climb the leaderboard, and unlock themed packs.",
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
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.uselessachievements.com",
    languages: {
      "en-US": "https://www.uselessachievements.com",
    },
  },
  other: {
    "msapplication-TileColor": "#38bdf8", // Set a branded tile color
    "theme-color": "#38bdf8", // Set a theme color for mobile browsers
  },
  category: "entertainment",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/favicons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
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
    <footer className="border-t w-full">
      <div className="flex flex-col items-center gap-6 pt-2">
        {/* Featured badges */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Featured on
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Product Hunt */}
            <a
              href="https://www.producthunt.com/products/useless-achievements?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-useless-achievements-2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Useless Achievements on Product Hunt"
            >
              <Image
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1246099&theme=light&t=1789058787565"
                alt="Useless Achievements on Product Hunt"
                priority
                width={185}
                height={40}
                className="h-10 w-auto"
              />
            </a>

            <a
              href="https://viberank.dev/apps/Useless%20Achievements"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://viberank.dev/badge?app=Useless%20Achievements&theme=dark"
                width={185}
                height={40}
                className="h-10 w-auto"
                alt="Useless Achievements on VibeRank"
              />
            </a>

            {/* <a
              href="https://tinyhunt.dev/projects/useless-achievements?utm_source=badge"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://r2.direasy-multi-tenant.focusapps.app/uploads/616d0b1a-3979-4b8c-94d1-b4f1fedd3ead/1783232956807/nynif7cioz/featured-on-light.svg"
                alt="Featured on TinyHunt"
                width={185}
                height={40}
                className="h-10 w-auto"
              />
            </a> */}

            {/* SaaS Hunt */}
            {/* <a
              href="https://saashunt.best/projects/useless-achievements?utm_source=badge"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Useless Achievements on SaaS Hunt"
            >
              <Image
                src="https://saashunt.best/images/badges/featured-on-light.svg"
                alt="Useless Achievements featured on SaaS Hunt"
                width={185}
                height={40}
                className="h-10 w-auto"
              />
            </a> */}
          </div>
        </div>

        {/* Footer links / copyright */}
        <div className="w-full gap-4 border-t pt-5">
          <div className="px-5 container flex flex-col gap-4 pb-4 md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex flex-wrap items-baseline justify-center gap-x-2 md:justify-start">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} Useless Achievements. All rights
                  reserved.
                </p>

                <p className="text-xs text-muted-foreground/70">v2.0</p>
              </div>

              <nav
                aria-label="Social media"
                className="-mt-2 sm:-ml-3 flex items-center gap-1"
              >
                <a
                  href="https://www.instagram.com/uselessachievements/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Useless Achievements on Instagram (opens in a new tab)"
                  className="inline-flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Instagram className="size-5" aria-hidden="true" />
                </a>
              </nav>
            </div>

            <nav
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
              aria-label="Footer navigation"
            >
              <Link
                href="/faq"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                FAQ
              </Link>

              <Link
                href="/privacy-policy"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms-of-service"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

// JSON-LD structured data for enhanced SEO
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Useless Achievements",
    url: "https://uselessachievements.com",
    description: "Unlock and share hilariously useless achievements!",
    applicationCategory: "Entertainment",
    genre: "Achievement Collection",
    image: "https://uselessachievements.com/og-image.png",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-gradient-to-b from-violet-50 via-blue-50 to-background font-sans antialiased flex flex-col",
          fontSans.variable,
        )}
        suppressHydrationWarning
      >
        <IdleSessionManager />
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
      </body>
    </html>
  );
}

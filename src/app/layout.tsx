import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Pointless Achievements",
  description: "Unlock and share hilariously pointless achievements!",
  icons: {
    icon: "/favicon.ico",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          fontSans.variable
        )}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <Toaster position="top-right" expand={true} richColors />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SiteHeaderServer } from "@/components/layout/site-header-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TechnoStore – Premium Electronics & Computers",
    template: "%s | TechnoStore",
  },
  description:
    "A modern, high-performance electronics store for laptops, components and peripherals.",
  metadataBase: new URL("https://example.com"),
  keywords: [
    "electronics store",
    "gaming laptops",
    "computer components",
    "mechanical keyboards",
  ],
  openGraph: {
    title: "TechnoStore – Premium Electronics & Computers",
    description:
      "Discover curated laptops, components and peripherals for creators and gamers.",
    type: "website",
    locale: "en_US",
    url: "https://example.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ts-shell antialiased`}
      >
        <ThemeProvider>
          <SiteHeaderServer />
          <main className="ts-container pb-16 pt-10">{children}</main>
          <footer className="border-t border-[var(--border-subtle)] bg-[var(--background)]">
            <div className="ts-container flex flex-col gap-4 py-6 text-xs text-[var(--foreground-muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} TechnoStore. All rights reserved.</p>
              <p className="text-[var(--foreground-muted)] opacity-80">
                Techo Store Marketplace
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}


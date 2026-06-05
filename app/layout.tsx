import type { Metadata } from "next";
import { Geist_Mono, Exo_2 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TechnoStore – Electrónica y PCs de alta gama",
    template: "%s | TechnoStore",
  },
  description:
    "Descubrí laptops, componentes y periféricos seleccionados para creadores y gamers.",
  metadataBase: new URL("https://example.com"),
  keywords: [
    "electronics store",
    "gaming laptops",
    "computer components",
    "mechanical keyboards",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${exo2.variable} ${geistMono.variable} ts-shell antialiased`}
      >
        <ThemeProvider>
          <Toaster position="bottom-right" richColors closeButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

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
          <main className="pb-16 pt-10">{children}</main>
          <footer className="border-t border-[var(--border-subtle)] bg-[var(--background)] mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--foreground)]">TechnoStore</h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Tu tienda de confianza para tecnología, componentes y periféricos.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Navegación</h4>
                <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                  <li><a href="/category/almacenamiento" className="hover:text-[var(--foreground)]">Almacenamiento</a></li>
                  <li><a href="/category/perifericos" className="hover:text-[var(--foreground)]">Periféricos</a></li>
                  <li><a href="/category/equipos" className="hover:text-[var(--foreground)]">Equipos</a></li>
                  <li><a href="/category/componentes" className="hover:text-[var(--foreground)]">Componentes</a></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Contacto</h4>
                <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                  <li>ventas@technostore.com</li>
                  <li>+54 11 1234-5678</li>
                  <li>Buenos Aires, Argentina</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Horario</h4>
                <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                  <li>Lun - Vie: 9:00 a 18:00</li>
                  <li>Sáb: 9:00 a 13:00</li>
                  <li>Dom: Cerrado</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] py-4 flex flex-col gap-2 text-xs text-[var(--foreground-muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} TechnoStore. Todos los derechos reservados.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-[var(--foreground)]">Términos</a>
                <a href="#" className="hover:text-[var(--foreground)]">Privacidad</a>
              </div>
            </div>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail } from "lucide-react";
import { SiteHeaderServer } from "@/components/layout/site-header-server";
import { ScrollNavbar } from "@/components/layout/scroll-navbar";

// SVG icons para redes sociales
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const footerNavigation = [
  { name: "Cargadores", href: "/categorias/cargadores-energia" },
  { name: "SSD", href: "/categorias/memorias" },
  { name: "Mouse", href: "/categorias/mouse-gamer" },
  { name: "Teclados", href: "/categorias/teclado-gamer" },
  { name: "Pendrive", href: "/categorias/pendrive" },
  { name: "Adaptadores", href: "/categorias/conversores-adaptadores-imagen" },
];

const socialLinks = [
  { 
    name: "Instagram", 
    href: "https://instagram.com/technostore",
    icon: InstagramIcon,
  },
  { 
    name: "WhatsApp", 
    href: "https://wa.me/5492984130230",
    icon: WhatsAppIcon,
  },
  { 
    name: "Facebook", 
    href: "https://facebook.com/technostore",
    icon: FacebookIcon,
  },
];

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeaderServer />
      <ScrollNavbar />
      <main className="pb-16">{children}</main>
      
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main footer content */}
          <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Logo & Description */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo-texto.png"
                  alt="TechnoStore"
                  width={160}
                  height={48}
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-sm text-[var(--foreground-muted)]">
                Tu tienda de confianza para tecnología, componentes y periféricos en General Roca.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)] transition-all"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
              
            </div>

            {/* Products Navigation */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Productos</h4>
              <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                {footerNavigation.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href} 
                      className="hover:text-[var(--foreground)] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Contacto</h4>
              <ul className="space-y-3 text-sm text-[var(--foreground-muted)]">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                  <span>9 de Julio 793, General Roca, Río Negro, Argentina</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                  <a 
                    href="mailto:ventas.store900@gmail.com"
                    className="hover:text-[var(--foreground)] transition-colors"
                  >
                    ventas.store900@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">Horario de Atención</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[var(--foreground-muted)] mb-1">Lunes a Viernes</p>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[var(--foreground)]">9am - 1pm</span>
                    <span className="text-[var(--foreground)]">5:30pm - 8:30pm</span>
                  </div>
                </div>
                <div>
                  <p className="text-[var(--foreground-muted)] mb-1">Sábado</p>
                  <span className="text-[var(--foreground)]">9:30am - 1pm</span>
                </div>
                <div>
                  <p className="text-[var(--foreground-muted)] mb-1">Domingo</p>
                  <span className="text-rose-400">Cerrado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[var(--border-subtle)] py-4 flex flex-col gap-2 text-xs text-[var(--foreground-muted)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} TechnoStore. Todos los derechos reservados.</p>
              <div className="flex gap-4">
                <Link href="/terminos-y-condiciones" className="hover:text-[var(--foreground)] transition-colors">
                  Términos y Condiciones
                </Link>
              </div>
            </div>
            <p className="text-center pt-1">
              Desarrollada por{" "}
              <a 
                href="https://devwebpatagonia.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                devweb gestión y presencia digital
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

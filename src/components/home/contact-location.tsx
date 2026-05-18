"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
import { clsx } from "clsx";
import { MapPin, Phone, Clock, Navigation, Mail } from "lucide-react";
import { ReactNode } from "react";

// Iconos SVG para redes sociales
const InstagramIcon = ({ className }: { className?: string }): ReactNode => (
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

interface ContactLocationProps {
  className?: string;
}

// Datos de contacto - TechnoStore General Roca
const storeInfo = {
  phone: "+54 298 413-0230",
  email: "ventas.store900@gmail.com",
  address: "9 de Julio 793, General Roca, Río Negro",
  directionsLink: "https://maps.google.com/?q=9+de+Julio+793+General+Roca+R%C3%ADo+Negro+Argentina",
  // Coordenadas de General Roca, Río Negro
  coordinates: {
    lat: -39.0332,
    lng: -67.5780,
  },
  schedule: {
    weekdaysMorning: "9am - 1pm",
    weekdaysAfternoon: "5:30pm - 8:30pm",
    saturday: "9:30am - 1pm",
    sunday: "Cerrado",
  },
};

type SocialIcon = ({ className }: { className?: string }) => ReactNode;

interface SocialLink {
  name: string;
  icon: SocialIcon;
  url: string;
}

const socialLinks: SocialLink[] = [
  { name: "Instagram", icon: InstagramIcon, url: "https://instagram.com/technostore" },
  { name: "Facebook", icon: FacebookIcon, url: "https://facebook.com/technostore" },
  { name: "WhatsApp", icon: WhatsAppIcon, url: "https://wa.me/5492984130230" },
];

export function ContactLocation({ className }: ContactLocationProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Título */}
      <motion.div
        className="text-center"
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: TRANSITION.medium }}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
          Visitanos en Nuestra Tienda
        </h2>
        <p className="mt-2 text-[var(--foreground-muted)] text-sm md:text-base max-w-xl mx-auto">
          Te esperamos para asesoramiento personalizado y ver nuestros productos en persona
        </p>
      </motion.div>

      {/* Contenedor principal: Mapa + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: TRANSITION.slow, ease: EASE.emphasis }}
          className="relative rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-900/80"
        >
          <iframe
            src="https://maps.google.com/maps?q=9+de+Julio+793+General+Roca+R%C3%ADo+Negro&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-[350px]"
            title="Ubicación de TechnoStore en General Roca"
          />
        </motion.div>

        {/* Info de contacto */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: TRANSITION.slow, ease: EASE.emphasis }}
          className="space-y-4"
        >
          {/* Tarjetas de info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teléfono */}
            <motion.div
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              className="group relative overflow-hidden rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-zinc-900/80 p-4 will-change-transform"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30 shrink-0">
                  <Phone className="w-5 h-5 text-zinc-900" />
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Teléfono</p>
                  <a href={`tel:${storeInfo.phone}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                    {storeInfo.phone}
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              className="group relative overflow-hidden rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-zinc-900/80 p-4 will-change-transform"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30 shrink-0">
                  <Mail className="w-5 h-5 text-zinc-900" />
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Email</p>
                  <a href={`mailto:${storeInfo.email}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                    {storeInfo.email}
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Dirección */}
            <motion.div
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              className="group relative overflow-hidden rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-zinc-900/80 p-4 sm:col-span-2 will-change-transform"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30 shrink-0">
                  <MapPin className="w-5 h-5 text-zinc-900" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--foreground-muted)]">Dirección</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {storeInfo.address}
                  </p>
                  <a
                    href={storeInfo.directionsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    <Navigation className="w-3 h-3" />
                    Cómo llegar
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Horarios */}
          <motion.div
            whileHover={reducedMotion ? {} : { scale: 1.01 }}
            className="group relative overflow-hidden rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-zinc-900/80 p-4 will-change-transform"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30 shrink-0">
                <Clock className="w-5 h-5 text-zinc-900" />
              </div>
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">Horarios de atención</p>
                <div className="text-sm font-semibold text-[var(--foreground)] space-y-0.5">
                  <p>Lun - Vie: {storeInfo.schedule.weekdaysMorning}</p>
                  <p>Lun - Vie: {storeInfo.schedule.weekdaysAfternoon}</p>
                  <p>Sáb: {storeInfo.schedule.saturday}</p>
                  <p className="text-rose-400">{storeInfo.schedule.sunday}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Redes sociales */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: TRANSITION.medium }}
            className="flex items-center gap-3 pt-2"
          >
            <span className="text-xs text-[var(--foreground-muted)]">Seguinos:</span>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-[var(--foreground-muted)] hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]/50 transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default ContactLocation;
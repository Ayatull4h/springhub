"use client";

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { Logo } from "./logo";
import { CONTACTS } from "@/lib/contacts";
import { useI18n } from "@/lib/i18n";

// TikTok isn't in lucide — inline SVG.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.66 20.1a6.34 6.34 0 0 0 10.86-4.43V8.94a8.16 8.16 0 0 0 4.78 1.52V7.05a4.83 4.83 0 0 1-1.71-.36z" />
    </svg>
  );
}

export function SiteFooter() {
  const { t } = useI18n();

  const columns = [
    {
      title: t("footer.platform"),
      links: [
        { label: t("map.title"), href: "#map" },
        { label: t("dashboard.title"), href: "#dashboard" },
        { label: t("volunteer.title"), href: "#community" },
        { label: t("learn.title"), href: "#learn" },
        { label: t("media.title"), href: "#media" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("footer.helpCenter"), href: "/help" },
        { label: t("footer.contactUs"), href: CONTACTS.whatsapp.waUrl },
        { label: t("footer.reportIssue"), href: "/report-issue" },
        { label: t("footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("footer.about"),
      links: [
        { label: t("footer.ourMission"), href: "/#about" },
        { label: t("footer.becomePartner"), href: "#donate" },
        { label: t("footer.impactReport"), href: "#media" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacyPolicy"), href: "/privacy" },
        { label: t("footer.termsOfService"), href: "/terms" },
        { label: t("footer.cookiePolicy"), href: "/privacy" },
        { label: t("footer.dataProtection"), href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-slate-900 text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            {t("footer.tagline")}
          </p>

          <div className="mt-6">
            <div className="text-sm font-semibold text-white">
              {t("footer.stayUpdated")}
            </div>
            <form
              action="/api/newsletter"
              method="POST"
              className="mt-2 flex max-w-sm gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const email = data.get("email");
                if (email) {
                  try {
                    await fetch("/api/newsletter", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    form.reset();
                    alert(t("footer.newsletterSuccess"));
                  } catch {
                    alert(t("footer.newsletterError"));
                  }
                }
              }}
            >
              <input
                name="email"
                type="email"
                required
                placeholder={t("footer.newsletterPlaceholder")}
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button type="submit" className="btn-primary">
                {t("footer.subscribe")}
              </button>
            </form>
          </div>

          {/* Social row */}
          <div className="mt-6 flex items-center gap-3">
            <Link
              href={CONTACTS.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram · @jagasemesta"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 hover:bg-slate-700 hover:text-white"
            >
              <Instagram className="h-4 w-4" />
            </Link>
            <Link
              href={CONTACTS.social.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube · @jagasemesta"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 hover:bg-slate-700 hover:text-white"
            >
              <Youtube className="h-4 w-4" />
            </Link>
            <Link
              href={CONTACTS.social.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok · @jagasemesta"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 hover:bg-slate-700 hover:text-white"
            >
              <TikTokIcon className="h-4 w-4" />
            </Link>
            <Link
              href={CONTACTS.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook · Jaga Semesta"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 hover:bg-slate-700 hover:text-white"
            >
              <Facebook className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-5 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold text-white">{col.title}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-slate-400 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="md:col-span-3">
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
              <span>
                <span className="block text-xs uppercase tracking-wider text-slate-500">
                  WhatsApp
                </span>
                <a href={CONTACTS.whatsapp.waUrl} className="hover:text-white">
                  {CONTACTS.whatsapp.display}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block text-xs uppercase tracking-wider text-slate-500">
                  {t("footer.phone")}
                </span>
                <a href={CONTACTS.whatsapp.telUrl} className="hover:text-white">
                  {CONTACTS.whatsapp.display}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block text-xs uppercase tracking-wider text-slate-500">
                  {t("footer.email")}
                </span>
                <a href={CONTACTS.email.mailto} className="hover:text-white">
                  {CONTACTS.email.address}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block text-xs uppercase tracking-wider text-slate-500">
                  {t("footer.address")}
                </span>
                {CONTACTS.address.city}, {CONTACTS.address.country}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-5 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div>{t("footer.copyright")}</div>
          <div className="flex items-center gap-3">
            <Link
              href={CONTACTS.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-white"
            >
              <Instagram className="h-4 w-4" />
            </Link>
            <Link
              href={CONTACTS.social.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="hover:text-white"
            >
              <Youtube className="h-4 w-4" />
            </Link>
            <Link
              href={CONTACTS.social.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="hover:text-white"
            >
              <TikTokIcon className="h-4 w-4" />
            </Link>
            <Link
              href={CONTACTS.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="hover:text-white"
            >
              <Facebook className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

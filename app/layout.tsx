import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { I18nProvider } from "@/lib/i18n";
import { DarkModeProvider } from "@/lib/darkmode";
import Watermark from "@/components/layout/watermark";
import { QueueWorker } from "@/components/queue-worker";
import { ToastProvider } from "@/components/toast";
import { ErrorBoundary } from "@/lib/error-boundary";
import { ErrorLoggerInit } from "@/components/error-logger-init";
import { DataSaverProvider } from "@/lib/use-data-saver";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "SpringHub · Community-Driven Spring Restoration",
    template: "%s · SpringHub",
  },
  description:
    "Grassroots platform to monitor, restore, and protect Indonesia's artesian springs — by Jaga Semesta.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.springhub.id"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpringHub",
  },
  openGraph: {
    title: "SpringHub · Community-Driven Spring Restoration",
    description:
      "Grassroots platform to monitor, restore, and protect Indonesia's artesian springs — by Jaga Semesta.",
    url: "https://www.springhub.id",
    siteName: "SpringHub",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpringHub · Community-Driven Spring Restoration",
    description:
      "Grassroots platform to monitor, restore, and protect Indonesia's artesian springs — by Jaga Semesta.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var m = document.cookie.match(/(?:^|; )locale=([^;]*)/);
                if (m && (m[1]==="id"||m[1]==="en")) document.documentElement.lang = m[1];
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.springhub.id/#organization",
                  "name": "SpringHub",
                  "alternateName": "Jaga Semesta",
                  "url": "https://www.springhub.id",
                  "description": "Platform komunitas untuk memonitor, merestorasi, dan melindungi mata air Indonesia.",
                  "foundingDate": "2026",
                  "areaServed": { "@type": "Country", "name": "Indonesia" },
                  "sameAs": [
                    "https://www.instagram.com/jagasemesta",
                    "https://www.youtube.com/@jagasemesta"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.springhub.id/#website",
                  "url": "https://www.springhub.id",
                  "name": "SpringHub · Community-Driven Spring Restoration",
                  "description": "Grassroots platform to monitor, restore, and protect Indonesia's artesian springs — by Jaga Semesta.",
                  "publisher": { "@id": "https://www.springhub.id/#organization" },
                  "inLanguage": ["id", "en"]
                }
              ]
            })
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
          Langsung ke konten utama
        </a>
        <ToastProvider>
        <QueueWorker />
        <DarkModeProvider>
          <I18nProvider>
            <DataSaverProvider>
              <ErrorBoundary>
                <SiteHeader />
              </ErrorBoundary>
              <ErrorBoundary>
                <main id="main-content">{children}</main>
              </ErrorBoundary>
              <ErrorBoundary>
                <SiteFooter />
              </ErrorBoundary>
              <Watermark />
              <ErrorLoggerInit />
            </DataSaverProvider>
          </I18nProvider>
        </DarkModeProvider>
        </ToastProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {
                    // SW registration failed — app works without it
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

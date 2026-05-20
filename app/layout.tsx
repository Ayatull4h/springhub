import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { I18nProvider } from "@/lib/i18n";
import { DarkModeProvider } from "@/lib/darkmode";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "SpringHub · Community-Driven Spring Restoration",
    template: "%s · SpringHub",
  },
  description:
    "Grassroots platform to monitor, restore, and protect Indonesia's artesian springs — by Jaga Semesta.",
  metadataBase: new URL("https://springhub.vercel.app"),
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "SpringHub · Community-Driven Spring Restoration",
    description:
      "Grassroots platform to monitor, restore, and protect Indonesia's artesian springs — by Jaga Semesta.",
    url: "https://springhub.id",
    siteName: "SpringHub",
    locale: "id_ID",
    type: "website",
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
      </head>
      <body className="min-h-screen font-sans">
        <DarkModeProvider>
          <I18nProvider>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </I18nProvider>
        </DarkModeProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

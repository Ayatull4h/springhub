"use client";

import Link from "next/link";
import { Shield, Users, TreePine, Droplets, Heart, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const values = [
  { icon: Droplets, labelKey: "about.value1", descKey: "about.value1Desc" },
  { icon: Users, labelKey: "about.value2", descKey: "about.value2Desc" },
  { icon: TreePine, labelKey: "about.value3", descKey: "about.value3Desc" },
  { icon: Shield, labelKey: "about.value4", descKey: "about.value4Desc" },
  { icon: Heart, labelKey: "about.value5", descKey: "about.value5Desc" },
  { icon: MapPin, labelKey: "about.value6", descKey: "about.value6Desc" },
];

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">
          {t("about.title")} <span className="text-brand-600">{t("about.titleBrand")}</span>
        </h1>
        <p
          className="mt-4 text-lg text-ink-muted leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t("about.description") }}
        />
      </div>

      {/* Visi */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-2xl font-bold text-ink">{t("about.vision")}</h2>
        <p className="mt-4 text-ink-muted leading-relaxed">
          {t("about.visionText")}
        </p>
      </div>

      {/* Values */}
      <div className="mx-auto mt-12 max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.labelKey} className="card">
                <Icon className="h-8 w-8 text-brand-600" />
                <h3 className="mt-3 font-semibold text-ink">{t(v.labelKey)}</h3>
                <p className="mt-1 text-sm text-ink-muted">{t(v.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl bg-brand-50 dark:bg-brand-900/20 p-8 text-center">
        <h2 className="text-2xl font-bold text-ink">{t("about.ctaTitle")}</h2>
        <p className="mt-2 text-ink-muted">
          {t("about.ctaDesc")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/join" className="btn-primary inline-flex items-center gap-2">
            <Users className="h-4 w-4" /> {t("about.ctaJoin")}
          </Link>
          <Link href="/#map" className="btn-secondary inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {t("about.ctaMap")}
          </Link>
        </div>
      </div>
    </div>
  );
}

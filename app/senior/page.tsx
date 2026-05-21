"use client";

import dynamic from "next/dynamic";

const Page = dynamic(
  () => import("@/_senior/senior-landing"),
  { ssr: false, loading: () => (
    <div className="flex min-h-screen items-center justify-center text-ink-muted">
      Loading senior preview...
    </div>
  )}
);

export default function SeniorPreview() {
  return <Page />;
}

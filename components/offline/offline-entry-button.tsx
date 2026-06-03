"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";

type UserInfo = {
  id: string;
  username: string;
  role: string;
} | null;

export function OfflineEntryButton() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <button
      onClick={() => {
        if (!user) {
          router.push("/sign-in?redirect=/offline");
        } else {
          router.push("/offline");
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50 px-5 py-3 text-sm font-bold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 hover:shadow-md dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/40"
    >
      <WifiOff className="h-5 w-5" />
      Aktifkan Mode Offline
    </button>
  );
}

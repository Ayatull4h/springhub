"use client";

import { X, Star, Eye, Wrench, TreePine, Sprout, Flame, CalendarCheck, ClipboardCheck, Camera, Compass, Award, Trophy, Crown, BookOpen, Gem, Sparkles, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type PointRule = {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  icon: string;
  sortOrder: number;
};

const FALLBACK_RULES: PointRule[] = [
  { id: "basic-1", name: "Spring Monitoring", description: "Laporan pemantauan mata air", points: 25, category: "basic", icon: "Eye", sortOrder: 1 },
  { id: "basic-2", name: "Spring Restoration", description: "Laporan restorasi mata air", points: 100, category: "basic", icon: "Wrench", sortOrder: 2 },
  { id: "basic-3", name: "Trench Development", description: "Pembangunan rorak/resapan", points: 50, category: "basic", icon: "TreePine", sortOrder: 3 },
  { id: "basic-4", name: "Tree Planting", description: "Penanaman pohon endemik", points: 50, category: "basic", icon: "Sprout", sortOrder: 4 },
  { id: "basic-5", name: "Seedling Stock", description: "Penyediaan bibit", points: 15, category: "basic", icon: "Sprout", sortOrder: 5 },
  { id: "bonus-1", name: "Streak Harian", description: "Lapor 3 hari berturut-turut", points: 5, category: "bonus", icon: "Flame", sortOrder: 6 },
  { id: "bonus-2", name: "Streak Mingguan", description: "Lapor tiap hari seminggu", points: 50, category: "bonus", icon: "CalendarCheck", sortOrder: 7 },
  { id: "bonus-3", name: "Laporan Lengkap", description: "Semua field + foto + notes", points: 10, category: "bonus", icon: "ClipboardCheck", sortOrder: 8 },
  { id: "bonus-4", name: "Foto Before/After", description: "Minimal 2 foto", points: 15, category: "bonus", icon: "Camera", sortOrder: 9 },
  { id: "bonus-5", name: "Penemu (Discovery)", description: "Mata air baru belum ada di map", points: 50, category: "bonus", icon: "Compass", sortOrder: 10 },
  { id: "bonus-6", name: "Verifikator", description: "Verifikasi laporan volunteer lain", points: 10, category: "bonus", icon: "Award", sortOrder: 11 },
  { id: "bonus-7", name: "Course Selesai", description: "Learning Hub course completed", points: 25, category: "bonus", icon: "BookOpen", sortOrder: 12 },
  { id: "milestone-1", name: "10 Laporan", description: "Milestone 10 laporan", points: 50, category: "milestone", icon: "Trophy", sortOrder: 13 },
  { id: "milestone-2", name: "50 Laporan", description: "Milestone 50 laporan", points: 250, category: "milestone", icon: "Crown", sortOrder: 14 },
  { id: "milestone-3", name: "100 Laporan", description: "Milestone 100 laporan", points: 500, category: "milestone", icon: "Gem", sortOrder: 15 },
  { id: "milestone-4", name: "Threshold 20K Poin", description: "Sekali seumur hidup", points: 1000, category: "milestone", icon: "Sparkles", sortOrder: 16 },
];

const iconMap: Record<string, LucideIcon> = {
  Star,
  Eye,
  Wrench,
  TreePine,
  Sprout,
  Flame,
  CalendarCheck,
  ClipboardCheck,
  Camera,
  Compass,
  Award,
  Trophy,
  Crown,
  BookOpen,
  Gem,
  Sparkles,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PointsGuideModal({ open, onClose }: Props) {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{ points: number; trustScore: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/point-rules")
      .then((r) => r.json())
      .then((data) => {
        const fetched = data.rules || [];
        setRules(fetched.length > 0 ? fetched : FALLBACK_RULES);
        setLoading(false);
      })
      .catch(() => {
        setRules(FALLBACK_RULES);
        setLoading(false);
      });

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setUserData({ points: data.profile.points, trustScore: data.profile.trustScore });
        }
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const categories = [
    { key: "basic", label: "📋 Laporan Dasar", bg: "bg-emerald-50" },
    { key: "bonus", label: "⭐ Bonus", bg: "bg-amber-50" },
    { key: "milestone", label: "🏆 Milestone", bg: "bg-purple-50" },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 p-6 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-ink">Cara Mendapatkan Poin</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Kumpulkan poin dengan berkontribusi dan raih milestone!
        </p>

        {userData !== null && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/80">Poin Kamu</p>
                <p className="text-2xl font-bold">{userData.points.toLocaleString("id-ID")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-white/80">Trust Score</p>
                <p className="text-lg font-semibold">{userData.trustScore}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          categories.map((cat) => {
            const items = rules.filter((r) => r.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key} className={`mt-4 rounded-xl ${cat.bg} p-3`}>
                <h4 className="mb-2 text-sm font-semibold text-ink">
                  {cat.label}
                </h4>
                <div className="space-y-1.5">
                  {items.map((rule) => {
                    const Icon = iconMap[rule.icon] || Star;
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-lg bg-white/80 dark:bg-slate-800/80 px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-brand-600 shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-ink">
                              {rule.name}
                            </span>
                            <p className="text-xs text-ink-muted">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-brand-600">
                          +{rule.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {!loading && rules.length === 0 && (
          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-ink-muted">
            Belum ada aturan poin yang tersedia.
          </div>
        )}
      </div>
    </div>
  );
}

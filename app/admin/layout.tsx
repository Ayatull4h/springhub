"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/lib/error-boundary";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Heart,
  ShieldCheck,
  BookOpen,
  Award,
  FolderKanban,
  LogOut,
  ChevronDown,
  MessageSquare,
  Image,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebar = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Forms", href: "/admin/forms", icon: ClipboardList },
  { label: "Donations", href: "/admin/donations", icon: Heart },
  { label: "Points", href: "/admin/points", icon: Award },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { label: "Review Queue", href: "/admin/review", icon: ShieldCheck },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Content", href: "/admin/content", icon: Image },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/sign-in?redirect=/admin");
          return;
        }
        setUser(data.user);
      })
      .catch(() => router.push("/sign-in?redirect=/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside data-testid="admin-sidebar" className="hidden w-64 flex-col border-r border-ink-line bg-white dark:border-slate-700 dark:bg-slate-800 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink-line px-5 dark:border-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            S
          </div>
          <span className="text-sm font-bold text-ink">SpringHub Admin</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {sidebar.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-ink-line p-3 dark:border-slate-700">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {user?.username?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 truncate">
              <div className="text-sm font-medium text-ink">{user?.username}</div>
              <div className="text-xs text-ink-subtle">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-ink-line bg-white px-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-2 text-ink-muted hover:bg-slate-100 md:hidden dark:hover:bg-slate-700"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base font-semibold text-ink">
              {sidebar.find((s) => s.href === pathname)?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-subtle sm:inline">
              Live data from Postgres
            </span>
            <div className="flex items-center gap-2 rounded-lg border border-ink-line px-3 py-1.5 text-sm text-ink-muted dark:border-slate-700">
              <span className="hidden sm:inline">SpringHub / Local</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-ink-line bg-white dark:border-slate-700 dark:bg-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-ink-line px-5 dark:border-slate-700">
              <span className="text-sm font-bold text-ink dark:text-white">SpringHub Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white" aria-label="Tutup menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {sidebar.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-ink-line p-3 dark:border-slate-700">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {user?.username?.charAt(0).toUpperCase() ?? "A"}
                </div>
                <div className="flex-1 truncate">
                  <div className="text-sm font-medium text-ink dark:text-white">{user?.username}</div>
                  <div className="text-xs text-ink-subtle dark:text-slate-400">{user?.email}</div>
                </div>
                <button onClick={handleLogout} className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

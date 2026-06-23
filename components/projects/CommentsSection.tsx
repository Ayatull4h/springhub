"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Send, Loader2, LogIn, Clock, User } from "lucide-react";

type CommentUser = {
  username: string;
};

type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
  user: CommentUser;
};

type CommentsSectionProps = {
  projectId: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return `${Math.floor(days / 7)} minggu lalu`;
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [error, setError] = useState("");

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // Silent fail — comments are non-critical
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Check auth
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError("");

    // Optimistic UI
    const optimistic: CommentItem = {
      id: `opt-${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
      user: { username: user?.username || "Anda" },
    };
    setComments((prev) => [optimistic, ...prev]);
    setText("");

    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengirim komentar");
      }

      const data = await res.json();
      // Replace optimistic with real comment
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? data.comment : c))
      );
    } catch (err: any) {
      // Revert optimistic
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setError(err.message || "Gagal mengirim komentar. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-ink flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Komentar ({comments.length})
      </h2>

      {/* Comment input — only if logged in */}
      {user ? (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis komentar..."
            maxLength={500}
            disabled={submitting}
            className="flex-1 rounded-lg border border-ink-line px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Kirim
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-lg border border-ink-line bg-slate-50 px-4 py-3 text-sm text-ink-muted dark:bg-slate-800/50">
          <a
            href="/sign-in"
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
          >
            <LogIn className="h-3.5 w-3.5" />
            Masuk
          </a>{" "}
          untuk berkomentar
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="mt-4 flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
        </div>
      ) : comments.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-ink-line px-4 py-8 text-center text-sm text-ink-muted">
          <MessageSquare className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="mt-2">Belum ada komentar. Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-ink-line bg-white px-4 py-3 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {comment.user?.username || "Pengguna"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-subtle">
                  <Clock className="h-3 w-3" />
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

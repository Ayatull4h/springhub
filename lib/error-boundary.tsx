"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 dark:bg-slate-900">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-xl font-bold text-red-600 dark:text-red-300">!</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-ink dark:text-white">Terjadi kesalahan</h2>
            <p className="mt-2 text-sm text-ink-muted dark:text-slate-400">
              {this.state.error?.message || "Something went wrong"}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="btn-primary"
              >
                Coba lagi
              </button>
              <Link href="/admin" className="btn-secondary">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

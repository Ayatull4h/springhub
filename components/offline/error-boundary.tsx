"use client";

import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Lightweight error boundary — catches render errors in its subtree
 * so the rest of the app stays interactive.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Terjadi kesalahan saat memuat peta.
              </p>
              <p className="mt-1 text-xs text-red-600/70 dark:text-red-400/70">
                {this.state.error?.message ?? "Unknown error"}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

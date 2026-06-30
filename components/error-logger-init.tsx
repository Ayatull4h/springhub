"use client";

import { useEffect } from "react";
import { setupGlobalErrorLogger } from "@/lib/error-logger";

/**
 * Inisialisasi global error logger (uncaught exceptions, promise rejections).
 * Dipasang sekali di root layout.
 */
export function ErrorLoggerInit() {
  useEffect(() => {
    setupGlobalErrorLogger();
  }, []);

  return null;
}

"use client";
import { useState, useEffect } from "react";

type Report = {
  id: string;
  formSlug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  user?: { username: string; region: string };
};

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(data => setReports(data.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return { reports, loading };
}

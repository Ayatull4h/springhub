"use client";
import { useState, useEffect } from "react";

export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  points: number;
  trustScore: number;
  region: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAdmin: user?.role === "admin" };
}

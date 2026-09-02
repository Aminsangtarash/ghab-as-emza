"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { PublicUser } from "@/lib/store";

type AuthStatus = "loading" | "guest" | "user";

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  refresh: () => Promise<PublicUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      const payload = (await response.json()) as { user?: PublicUser | null };
      const nextUser = payload.user ?? null;
      setUser(nextUser);
      setStatus(nextUser ? "user" : "guest");
      return nextUser;
    } catch {
      setUser(null);
      setStatus("guest");
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, status, refresh, logout }),
    [user, status, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

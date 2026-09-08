"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api-client";
import type { BackendUser } from "@/lib/api-client";
import type { AppUser } from "@/lib/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AppUser | null;
  status: AuthStatus;
  login: (phone: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function toAppUser(user: BackendUser): AppUser {
  return { id: user.id, name: user.name, phone: user.phone, role: user.role, initials: getInitials(user.name) };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // On mount, try to mint a fresh access token from the httpOnly refresh
  // cookie — this is what keeps the user signed in across a hard reload
  // even though the access token itself only lives in memory.
  useEffect(() => {
    let cancelled = false;
    api
      .refreshSession()
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setUser(toAppUser(result.user));
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const result = await api.login(phone, password);
    const appUser = toAppUser(result.user);
    setUser(appUser);
    setStatus("authenticated");
    return appUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchApi } from "@/services/apiClient";

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "stellar_token";
const USER_KEY = "stellar_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetchApi<{
      access_token: string;
      user_id: number;
      username: string;
      full_name: string;
      role: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const userData: User = {
      id: res.user_id,
      username: res.username,
      full_name: res.full_name,
      role: res.role,
    };
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(res.access_token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

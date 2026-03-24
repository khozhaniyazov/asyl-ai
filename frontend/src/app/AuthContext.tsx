import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "./api";

export interface Therapist {
  id: number;
  email: string;
  full_name: string;
  clinic_name: string | null;
}

interface AuthContextType {
  user: Therapist | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; clinic_name?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (!api.isAuthenticated()) {
        setUser(null);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
      api.logout();
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await refreshUser();
  };

  const register = async (data: { email: string; password: string; full_name: string; clinic_name?: string }) => {
    await api.register(data);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

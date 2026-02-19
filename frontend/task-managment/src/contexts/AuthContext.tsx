/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  type RegisterInput,
  type User,
} from "../services/authService";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "task_management_token";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function persistToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = readStoredToken();
    if (!activeToken) {
      setUser(null);
      return;
    }

    const profile = await getCurrentUser(activeToken);
    setToken(activeToken);
    setUser(profile);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = readStoredToken();
      if (!storedToken) {
        setIsReady(true);
        return;
      }

      try {
        const profile = await getCurrentUser(storedToken);
        setToken(storedToken);
        setUser(profile);
      } catch {
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const payload = await loginUser(username, password);
    const nextToken = payload.token.access_token;
    persistToken(nextToken);
    setToken(nextToken);
    setUser(payload.user);
  }, []);

  const register = useCallback(
    async (payload: RegisterInput) => {
      await registerUser(payload);
      await login(payload.username, payload.password);
    },
    [login]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isReady, login, register, refreshUser, logout }),
    [token, user, isReady, login, register, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

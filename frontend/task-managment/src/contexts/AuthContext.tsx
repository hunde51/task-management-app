import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getToken, setToken as persistToken, clearToken } from "../lib/auth";
import { login as apiLogin, register as apiRegister, type RegisterInput } from "../lib/api";

type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setIsReady(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { access_token } = await apiLogin(username, password);
    persistToken(access_token);
    setTokenState(access_token);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await apiRegister(input);
    await login(input.username, input.password);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isReady, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

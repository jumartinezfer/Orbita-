import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setSessionExpiredHandler } from "../lib/api";

const STORAGE_KEY = "orbita.token";

interface AuthContextValue {
  token: string | null;
  sessionMessage: string | null;
  login: (token: string) => void;
  logout: () => void;
  dismissSessionMessage: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    setSessionExpiredHandler((reason) => {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setSessionMessage(reason);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      sessionMessage,
      login: (newToken: string) => {
        localStorage.setItem(STORAGE_KEY, newToken);
        setToken(newToken);
        setSessionMessage(null);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setSessionMessage(null);
      },
      dismissSessionMessage: () => setSessionMessage(null),
    }),
    [token, sessionMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return ctx;
}

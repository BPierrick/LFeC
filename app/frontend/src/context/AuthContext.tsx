import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { adminLogin, adminLogout, getAdminSession } from "../api/endpoints";

interface AuthContextValue {
  isAuthed: boolean;
  checking: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminSession()
      .then((data) => setIsAuthed(data.isAdmin))
      .catch(() => setError("Impossible de vérifier la session admin."))
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (password: string) => {
    setError(null);
    try {
      await adminLogin(password);
      setIsAuthed(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    setIsAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, checking, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}

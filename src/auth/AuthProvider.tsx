import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  beginDiscordLogin,
  bootstrapAuth,
  clearStoredToken,
  endSession,
  fetchMe,
  getStoredToken,
  type AuthSnapshot,
  type AuthUser,
} from "../lib/api";

interface AuthContextValue extends AuthSnapshot {
  busy: boolean;
  signedIn: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY: AuthSnapshot = {
  status: "loading",
  user: null,
  health: null,
  error: null,
  errorDetail: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void bootstrapAuth().then((next) => {
      if (active) setSnapshot(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(() => {
    setBusy(true);
    void beginDiscordLogin()
      .then((started) => {
        if (!started) {
          setBusy(false);
          setSnapshot((previous) => ({ ...previous, status: "unconfigured" }));
        }
      })
      .catch(() => setBusy(false));
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    const token = getStoredToken();

    try {
      if (token) await endSession(token);
    } catch {
      // A failed remote logout must not trap the user in a stale session.
    } finally {
      clearStoredToken();
      setSnapshot((previous) => ({
        ...previous,
        status: "signed-out",
        user: null,
        error: null,
        errorDetail: null,
      }));
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const user: AuthUser = await fetchMe(token);
      setSnapshot((previous) => ({ ...previous, status: "signed-in", user }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredToken();
        setSnapshot((previous) => ({ ...previous, status: "signed-out", user: null }));
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...snapshot,
      busy,
      signedIn: Boolean(snapshot.user),
      signIn,
      signOut,
      refresh,
    }),
    [snapshot, busy, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

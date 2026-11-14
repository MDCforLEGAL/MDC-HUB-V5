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
  beginOAuthLogin,
  bootstrapAuth,
  clearStoredToken,
  endSession,
  fetchMe,
  firebaseLogin,
  getStoredToken,
  storeToken,
  type AuthSnapshot,
  type AuthUser,
  type OAuthProvider,
} from "../lib/api";

function firebaseErrorDetail(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0 || error.code === "network") return "network";
    if (error.status === 503) return "config";
    return "google";
  }

  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return "cancelled";
  if (code.includes("unauthorized-domain") || code.includes("invalid-continue-uri")) return "domain";
  if (code.includes("operation-not-allowed")) return "config";
  return "google";
}

interface AuthContextValue extends AuthSnapshot {
  busy: boolean;
  signedIn: boolean;
  signIn: (provider?: OAuthProvider) => void;
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

  const signIn = useCallback((provider: OAuthProvider = "discord") => {
    setBusy(true);

    if (provider === "google") {
      void (async () => {
        try {
          const { requestGoogleIdToken } = await import("../lib/firebase");
          const idToken = await requestGoogleIdToken();
          const session = await firebaseLogin(idToken);
          storeToken(session.token);
          setSnapshot((previous) => ({
            ...previous,
            status: "signed-in",
            user: session.user,
            error: null,
            errorDetail: null,
          }));
        } catch (error) {
          setSnapshot((previous) => ({
            ...previous,
            status: "signed-out",
            user: null,
            error: "callback",
            errorDetail: firebaseErrorDetail(error),
          }));
        } finally {
          setBusy(false);
        }
      })();
      return;
    }

    void beginOAuthLogin(provider)
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
      try {
        const { signOutOfFirebase } = await import("../lib/firebase");
        await signOutOfFirebase();
      } catch {
        // Firebase is optional and must not block the MDC sign-out.
      }
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

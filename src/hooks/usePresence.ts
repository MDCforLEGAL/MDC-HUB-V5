import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchPresenceStats,
  getStoredToken,
  sendPresenceHeartbeat,
  type PresenceStats,
} from "../lib/api";

export type PresenceState = "loading" | "live" | "error";

const VISITOR_KEY = "mdc-hub.visitor";
const HEARTBEAT_MS = 30_000;
const VISITOR_PATTERN = /^[a-zA-Z0-9_-]{16,64}$/;

function createVisitorId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getVisitorId(): string {
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored && VISITOR_PATTERN.test(stored)) return stored;

    const next = createVisitorId();
    window.localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return createVisitorId();
  }
}

/**
 * Keeps one anonymous visitor heartbeat alive and refreshes the public
 * community counters. The API treats a heartbeat with a valid token as a
 * registered user; everything else is an active guest.
 */
export function usePresence() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<PresenceStats | null>(null);
  const [state, setState] = useState<PresenceState>("loading");
  const [visitorId] = useState(getVisitorId);
  const userId = user?.id ?? null;

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        await sendPresenceHeartbeat(visitorId, getStoredToken());
      } catch {
        if (active) setState((current) => (current === "live" ? current : "error"));
        return;
      }

      try {
        const next = await fetchPresenceStats();
        if (!active) return;
        setSnapshot(next);
        setState("live");
      } catch {
        if (active) setState((current) => (current === "live" ? current : "error"));
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), HEARTBEAT_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [visitorId, userId]);

  return { stats: snapshot, state };
}

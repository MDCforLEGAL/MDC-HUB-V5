import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "installed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

/**
 * Wraps Chrome's `beforeinstallprompt` event so the site can offer its own
 * "Install app" entry instead of sending people to the browser menu.
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (installed) return "installed";
    if (!promptEvent) return "unavailable";

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);

    if (choice.outcome === "accepted") {
      setInstalled(true);
      return "accepted";
    }
    return "dismissed";
  }, [installed, promptEvent]);

  return { canPrompt: Boolean(promptEvent) && !installed, installed, install };
}

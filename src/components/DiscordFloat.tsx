import { useState } from "react";
import { useI18n } from "../i18n";
import { DISCORD_INVITE_URL } from "../lib/links";
import { Discord, X } from "./Icons";

const DISMISS_KEY = "mdc-hub.discord-cta-dismissed";

function initiallyDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function DiscordFloat() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(initiallyDismissed);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // The button still hides for this visit when storage is unavailable.
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <div className="discord-card flex items-center p-1">
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 py-2 pl-3 pr-3.5 text-[0.7rem] font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
        >
          <span className="grid h-6 w-6 place-items-center bg-[var(--info-soft)] text-[var(--info)] transition-colors group-hover:bg-[var(--info)] group-hover:text-white">
            <Discord className="h-3.5 w-3.5" />
          </span>
          <span className="hidden whitespace-nowrap sm:inline">{t("social.joinDiscord")}</span>
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("social.discordClose")}
          title={t("social.discordClose")}
          className="mr-0.5 grid h-7 w-7 place-items-center text-[var(--faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

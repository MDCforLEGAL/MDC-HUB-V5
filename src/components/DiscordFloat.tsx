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
      <div className="discord-float flex items-center rounded-full border border-neon/25 bg-[#060b13]/95 p-1 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.95),0_0_36px_-18px_rgba(0,240,255,0.7)] backdrop-blur-2xl">
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-full py-2 pl-3 pr-3.5 text-[11px] font-medium text-white/75 transition-colors hover:text-white"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-neon/[0.1] text-neon transition-colors group-hover:bg-neon/[0.16]">
            <Discord className="h-3.5 w-3.5" />
          </span>
          <span className="whitespace-nowrap">{t("social.joinDiscord")}</span>
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("social.discordClose")}
          title={t("social.discordClose")}
          className="mr-0.5 grid h-7 w-7 place-items-center rounded-full text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/80"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

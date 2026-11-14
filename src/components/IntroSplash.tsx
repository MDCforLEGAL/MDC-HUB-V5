import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";

interface IntroSplashProps {
  onDone: () => void;
}

export function IntroSplash({ onDone }: IntroSplashProps) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? 420 : 1400;
    const exit = reduced ? 80 : 300;

    const leaveTimer = window.setTimeout(() => setLeaving(true), hold);
    const doneTimer = window.setTimeout(onDone, hold + exit);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="MDC HUB V5"
      className={cn("intro-screen", leaving && "is-leaving")}
    >
      <div className="intro-frame">
        <div className="intro-mark" aria-hidden="true">
          M
        </div>
        <div className="intro-word">
          MDC <span>HUB</span>
        </div>
        <p className="intro-tagline">{t("intro.tagline")}</p>
        <span aria-hidden="true" className="intro-progress">
          <span className="intro-progress__bar" />
        </span>
      </div>
    </div>
  );
}

import { useEffect, useState, type CSSProperties } from "react";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";

interface IntroSplashProps {
  onDone: () => void;
}

const LETTERS = "MDC".split("");
const HUB_LETTERS = "HUB".split("");

export function IntroSplash({ onDone }: IntroSplashProps) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? 500 : 2100;
    const exit = reduced ? 120 : 480;

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
      <div aria-hidden="true" className="intro-screen__grid" />
      <div aria-hidden="true" className="intro-screen__glow" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div aria-hidden="true" className="intro-word">
          {LETTERS.map((letter, index) => (
            <span
              key={`mdc-${letter}`}
              className="intro-letter"
              style={{ "--intro-index": index } as CSSProperties}
            >
              {letter}
            </span>
          ))}

          <span className="intro-word__gap" />

          {HUB_LETTERS.map((letter, index) => (
            <span
              key={`hub-${letter}`}
              className="intro-letter intro-letter--accent"
              style={{ "--intro-index": index + 3 } as CSSProperties}
            >
              {letter}
            </span>
          ))}

          <span
            className="intro-version"
            style={{ "--intro-index": 6 } as CSSProperties}
          >
            V5
          </span>
        </div>

        <p className="intro-tagline">{t("intro.tagline")}</p>
        <span aria-hidden="true" className="intro-progress">
          <span className="intro-progress__bar" />
        </span>
      </div>
    </div>
  );
}

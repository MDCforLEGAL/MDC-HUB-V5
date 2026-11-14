import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { applyGraphicsMode, readGraphicsMode } from "../lib/graphics";
import { Gauge, X, Zap } from "./Icons";

const PROMPT_KEY = "mdc-hub.graphics-prompt";
const FPS_THRESHOLD = 43;

interface PerformanceGuardProps {
  onNotify: (message: string) => void;
}

/**
 * Samples real frame delivery on touch devices. When the page is visibly
 * struggling, offer a lightweight graphics mode instead of leaving the
 * visitor with a phone that feels like it is about to take off.
 */
export function PerformanceGuard({ onNotify }: PerformanceGuardProps) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (readGraphicsMode() === "low") {
      applyGraphicsMode("low");
      return;
    }

    try {
      if (window.sessionStorage.getItem(PROMPT_KEY) === "1") return;
    } catch {
      // Continue without the per-session suppression.
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!coarsePointer && window.innerWidth > 900) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let measureTimer = 0;

    const measure = () => {
      if (document.visibilityState !== "visible") return;

      let frames = 0;
      const started = performance.now();

      const tick = (now: number) => {
        frames += 1;

        if (now - started < 2200) {
          frame = window.requestAnimationFrame(tick);
          return;
        }

        const fps = frames / ((now - started) / 1000);
        if (fps > 0 && fps < FPS_THRESHOLD) setAsking(true);
      };

      frame = window.requestAnimationFrame(tick);
    };

    // Let the intro and layout prompt finish before judging frame delivery.
    measureTimer = window.setTimeout(measure, 3400);

    return () => {
      window.clearTimeout(measureTimer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const dismiss = () => {
    setAsking(false);
    try {
      window.sessionStorage.setItem(PROMPT_KEY, "1");
    } catch {
      // Ask again next visit when storage is unavailable.
    }
  };

  const lowerGraphics = () => {
    applyGraphicsMode("low");
    setAsking(false);
    onNotify(t("performance.enabled"));
  };

  if (!asking) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="performance-title"
      className="perf-panel fixed bottom-24 left-4 right-4 z-[80] p-4 sm:bottom-6 sm:left-6 sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center border border-[var(--accent)] text-[var(--accent)]">
          <Gauge className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="performance-title"
            className="font-display text-[0.86rem] font-semibold leading-snug text-[var(--ink)]"
          >
            {t("performance.title")}
          </p>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-[var(--muted)]">
            {t("performance.body")}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("performance.dismiss")}
          className="grid h-7 w-7 shrink-0 place-items-center text-[var(--faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={lowerGraphics} className="btn btn-primary btn-sm">
          <Zap className="h-3 w-3" />
          {t("performance.accept")}
        </button>
        <button type="button" onClick={dismiss} className="btn btn-secondary btn-sm">
          {t("performance.later")}
        </button>
      </div>
    </div>
  );
}

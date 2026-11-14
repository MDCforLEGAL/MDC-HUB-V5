import { useEffect } from "react";
import { useI18n } from "../i18n";
import type { LayoutMode } from "../lib/layout";
import { ArrowRight, Monitor, Smartphone } from "./Icons";

interface LayoutPromptProps {
  onChoose: (mode: LayoutMode) => void;
}

export function LayoutPrompt({ onChoose }: LayoutPromptProps) {
  const { t } = useI18n();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const options = [
    {
      mode: "mobile" as const,
      icon: Smartphone,
      title: t("layout.mobileTitle"),
      body: t("layout.mobileBody"),
      hint: t("layout.mobileHint"),
    },
    {
      mode: "desktop" as const,
      icon: Monitor,
      title: t("layout.desktopTitle"),
      body: t("layout.desktopBody"),
      hint: t("layout.desktopHint"),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="layout-prompt-title"
      className="modal-overlay fixed inset-0 z-[100] overflow-y-auto px-4 py-5 sm:py-8"
    >
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="modal-panel modal-in my-auto w-full max-w-xl p-5 sm:p-7">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-[var(--accent)]" />
          <span className="section-kicker">{t("layout.kicker")}</span>
        </div>

        <h2
          id="layout-prompt-title"
          className="mt-4 font-display text-[1.5rem] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--ink)] sm:text-[1.8rem]"
        >
          {t("layout.title")}
        </h2>
        <p className="mt-2 max-w-md text-[0.76rem] leading-relaxed text-[var(--muted)]">
          {t("layout.body")}
        </p>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.mode}
                type="button"
                onClick={() => onChoose(option.mode)}
                className="group panel p-4 text-left transition-colors hover:border-[var(--line-strong)]"
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center border border-[var(--line)] bg-[var(--surface-2)] text-[var(--info)] transition-colors group-hover:border-[var(--info)]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                </span>
                <span className="mt-3 block text-[0.8rem] font-semibold text-[var(--ink)]">
                  {option.title}
                </span>
                <span className="mt-1 block text-[0.68rem] leading-relaxed text-[var(--muted)]">
                  {option.body}
                </span>
                <span className="mt-2.5 block font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--accent)]">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[0.58rem] leading-relaxed text-[var(--faint)]">
          {t("layout.note")}
        </p>
        </div>
      </div>
    </div>
  );
}

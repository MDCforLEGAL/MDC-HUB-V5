import { useEffect } from "react";
import { useI18n } from "../i18n";
import type { LayoutMode } from "../lib/layout";
import { ArrowRight, Monitor, Smartphone, Sparkles } from "./Icons";

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
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#020508]/82 px-4 py-5 backdrop-blur-md sm:py-8"
    >
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="modal-in my-auto w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#060b13] p-5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95),0_0_80px_-50px_rgba(0,240,255,0.7)] sm:p-7">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl border border-neon/25 bg-neon/[0.08] text-neon">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-neon/60">
            {t("layout.kicker")}
          </span>
        </div>

        <h2
          id="layout-prompt-title"
          className="mt-4 font-display text-[24px] font-medium leading-[1.1] tracking-[-0.03em] text-white sm:text-[28px]"
        >
          {t("layout.title")}
        </h2>
        <p className="mt-2 max-w-md text-[12px] leading-relaxed text-white/45">
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
                className="group rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 text-left transition-all duration-300 hover:border-neon/35 hover:bg-neon/[0.06] hover:shadow-[0_18px_50px_-30px_rgba(0,240,255,0.8)]"
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-black/30 text-neon/75 transition-colors group-hover:border-neon/30 group-hover:text-neon">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-neon/70" />
                </span>
                <span className="mt-3 block text-[13px] font-semibold text-white/90">
                  {option.title}
                </span>
                <span className="mt-1 block text-[10.5px] leading-relaxed text-white/40">
                  {option.body}
                </span>
                <span className="mt-2.5 block font-mono text-[8px] uppercase tracking-[0.14em] text-neon/45">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[8.5px] leading-relaxed text-white/25">
          {t("layout.note")}
        </p>
        </div>
      </div>
    </div>
  );
}

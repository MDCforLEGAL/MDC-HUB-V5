import { useEffect, useRef, type FormEvent } from "react";
import type { LibraryState } from "../hooks/useScriptLibrary";
import { useI18n } from "../i18n";
import { formatCompact, timeAgo } from "../lib/format";
import { ArrowRight, Search, Sparkles, X } from "./Icons";

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  resultCount: number;
  scriptCount: number;
  gameCount: number;
  workingRate: number;
  lastSync: string | null;
  libraryState: LibraryState;
  popularSearches: string[];
}

export function Hero({
  query,
  onQueryChange,
  onSubmitSearch,
  resultCount,
  scriptCount,
  gameCount,
  workingRate,
  lastSync,
  libraryState,
  popularSearches,
}: HeroProps) {
  const { t, locale } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmitSearch();
  };

  const trimmedQuery = query.trim();

  const syncValue =
    libraryState === "live"
      ? timeAgo(lastSync, locale).replace(locale === "tr" ? " önce" : " ago", "")
      : t("hero.statLocal");

  const stats = [
    { value: formatCompact(scriptCount, locale), label: t("hero.statScripts") },
    { value: formatCompact(gameCount, locale), label: t("hero.statGames") },
    {
      value: `${workingRate.toLocaleString(locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1 })}%`,
      label: t("hero.statWorking"),
    },
    {
      value: syncValue,
      label: libraryState === "live" ? t("hero.statSync") : t("hero.statSource"),
    },
  ];

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-32 sm:pt-40 md:pb-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-4 -z-10 h-[420px] w-[min(1000px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.13),transparent_66%)] blur-2xl"
      />

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <div
          className="animate-rise inline-flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.035] py-1.5 pl-2.5 pr-3.5 backdrop-blur-xl"
          style={{ animationDelay: "40ms" }}
        >
          <span className="relative flex h-1.5 w-1.5 items-center justify-center">
            <span className="pulse-ring absolute inset-0 rounded-full text-neon/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_2px_rgba(0,240,255,0.7)]" />
          </span>
          <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/55">
            {libraryState === "live"
              ? t("hero.badgeLive")
              : libraryState === "loading"
                ? t("hero.badgeLoading")
                : t("hero.badgeCurated")}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-white/15" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-neon/80">
            {formatCompact(scriptCount, locale)}{" "}
            {scriptCount === 1 ? t("explorer.scriptOne") : t("explorer.scriptMany")}
          </span>
        </div>

        <h1
          className="animate-rise mx-auto mt-7 max-w-5xl font-display text-[clamp(2.5rem,7.4vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.045em] text-white"
          style={{ animationDelay: "120ms" }}
        >
          <span className="block">Next-Gen Roblox</span>
          <span className="mt-1 block bg-gradient-to-r from-[#E7FEFF] via-[#00F0FF] to-[#4E86FF] bg-clip-text pb-2 text-transparent drop-shadow-[0_0_50px_rgba(0,240,255,0.16)]">
            Script Ecosystem
          </span>
        </h1>

        <p
          className="animate-rise mx-auto mt-5 max-w-xl text-[13.5px] leading-relaxed text-white/55 sm:text-[15px]"
          style={{ animationDelay: "200ms" }}
        >
          {t("hero.subtitle")}
          <span className="text-white/70">{t("hero.subtitleEmphasis")}</span>
        </p>

        <form
          onSubmit={handleSubmit}
          role="search"
          className="animate-rise relative mx-auto mt-10 max-w-2xl"
          style={{ animationDelay: "280ms" }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.16),transparent_68%)] blur-2xl"
          />

          <div className="group rounded-[18px] bg-[linear-gradient(100deg,rgba(0,240,255,0.55),rgba(0,102,255,0.28)_46%,rgba(0,240,255,0.12))] p-px shadow-[0_20px_70px_-30px_rgba(0,240,255,0.6)] transition-all duration-300 focus-within:shadow-[0_24px_80px_-26px_rgba(0,240,255,0.75)]">
            <div className="flex items-center gap-2 rounded-[17px] bg-[#050a11]/95 py-1.5 pl-4 pr-1.5 backdrop-blur-2xl sm:gap-3">
              <Search className="h-[18px] w-[18px] shrink-0 text-neon/60 transition-colors duration-300 group-focus-within:text-neon" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                type="search"
                name="script-search"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label={t("hero.searchAria")}
                placeholder={t("hero.searchPlaceholder")}
                className="h-11 min-w-0 flex-1 appearance-none bg-transparent text-[13.5px] font-normal text-white placeholder:text-white/30 focus:outline-none sm:text-[14px] [&::-webkit-search-cancel-button]:hidden"
              />
              {trimmedQuery && (
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  aria-label={t("hero.clearSearch")}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-1 font-mono text-[9.5px] text-white/35 lg:flex">
                <span className="text-[11px] leading-none">⌘</span>K
              </kbd>
              <button
                type="submit"
                className="group/btn inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-neon to-electric px-3.5 text-[12.5px] font-semibold text-[#02070a] shadow-[0_8px_24px_-10px_rgba(0,240,255,0.8)] transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(0,240,255,0.95)] sm:px-4"
              >
                <span>{t("hero.search")}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex min-h-[18px] items-center justify-center gap-2 text-[10.5px] text-white/30">
            {trimmedQuery ? (
              <>
                <Sparkles className="h-3 w-3 text-neon/60" />
                <span>
                  {resultCount === 1
                    ? t("hero.foundOne")
                    : t("hero.foundMany", { count: resultCount })}
                </span>
                <span aria-hidden="true" className="text-white/15">·</span>
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  className="text-white/45 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                >
                  {t("hero.clear")}
                </button>
              </>
            ) : (
              <span className="hidden sm:inline">{t("hero.keyboardHint")}</span>
            )}
          </div>
        </form>

        <div
          className="animate-rise mt-4 flex flex-wrap items-center justify-center gap-1.5"
          style={{ animationDelay: "340ms" }}
        >
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
            {t("hero.popular")}
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onQueryChange(term)}
              className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10.5px] text-white/45 transition-all duration-300 hover:border-neon/30 hover:bg-neon/[0.07] hover:text-neon"
            >
              {term}
            </button>
          ))}
        </div>

        <dl
          className="animate-rise mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0"
          style={{ animationDelay: "420ms" }}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={
                index > 0
                  ? "border-white/[0.07] px-3 sm:border-l"
                  : "px-3"
              }
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="font-display text-[22px] font-medium tracking-[-0.02em] text-white/90 sm:text-2xl">
                  {stat.value}
                </span>
                <span className="mt-1.5 block font-mono text-[8.5px] uppercase tracking-[0.22em] text-white/28">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

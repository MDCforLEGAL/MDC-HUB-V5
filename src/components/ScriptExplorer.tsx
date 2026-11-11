import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import type { LibraryCategory, LibrarySource, ScriptEntry } from "../data/scripts";
import type { LibraryState } from "../hooks/useScriptLibrary";
import type { SourcePageId } from "../hooks/useSourcePage";
import { useI18n, type MessageKey } from "../i18n";
import { cn } from "../lib/cn";
import { timeAgo } from "../lib/format";
import { ScriptCard } from "./ScriptCard";
import { SourceTabs } from "./SourceTabs";
import { Reveal } from "./Reveal";
import {
  ArrowRight,
  Globe,
  Layers,
  Plus,
  Search,
  Sliders,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "./Icons";

type StatusFilter = "all" | "working" | "patched";

interface ScriptExplorerProps {
  page: SourcePageId;
  scripts: ScriptEntry[];
  categories: LibraryCategory[];
  sources: LibrarySource[];
  libraryState: LibraryState;
  lastSync: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenScript: (script: ScriptEntry) => void;
  onNotify: (message: string) => void;
  onPublish: () => void;
}

const ALL_GAMES = "__all_games__";

const statusTabs: Array<{ id: StatusFilter; labelKey: MessageKey }> = [
  { id: "all", labelKey: "explorer.statusAll" },
  { id: "working", labelKey: "explorer.statusWorking" },
  { id: "patched", labelKey: "explorer.statusPatched" },
];

const CATEGORY_IDS = new Set([
  "trending",
  "new",
  "popular",
  "keyless",
  "universal",
  "verified",
  "patched",
  "curated",
  "mdc",
  "community",
]);

export function ScriptExplorer({
  page,
  scripts,
  categories,
  sources,
  libraryState,
  lastSync,
  query,
  onQueryChange,
  onOpenScript,
  onNotify,
  onPublish,
}: ScriptExplorerProps) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [game, setGame] = useState(ALL_GAMES);
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const [autoLoad, setAutoLoad] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const autoTriggeredRef = useRef(false);

  const primarySource =
    sources[0]?.id === "mdc" ? t("sources.mdc") : (sources[0]?.label ?? "MDC");

  const pageKey = (part: "kicker" | "title" | "titleHighlight" | "description" | "label") =>
    `pages.${page}.${part}` as MessageKey;

  const pageSourceLabel = page === "all" ? primarySource : t(pageKey("label"));

  const categoryLabel = (item: LibraryCategory) =>
    CATEGORY_IDS.has(item.id)
      ? t(`categories.${item.id}` as MessageKey)
      : item.label;

  const categoryDescription = (item: LibraryCategory) =>
    CATEGORY_IDS.has(item.id)
      ? t(`categories.${item.id}Desc` as MessageKey)
      : item.description;

  const counts = useMemo(
    () => ({
      all: scripts.length,
      working: scripts.filter((script) => script.status === "working").length,
      patched: scripts.filter((script) => script.status === "patched").length,
    }),
    [scripts],
  );

  const gameOptions = useMemo(() => {
    const frequency = new Map<string, number>();
    for (const script of scripts) {
      frequency.set(script.game, (frequency.get(script.game) ?? 0) + 1);
    }

    return [
      ALL_GAMES,
      ...Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name]) => name),
    ];
  }, [scripts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return scripts.filter((script) => {
      if (status !== "all" && script.status !== status) return false;
      if (game !== ALL_GAMES && script.game !== game) return false;
      if (category !== "all" && !(script.categoryIds ?? []).includes(category)) {
        return false;
      }
      if (!needle) return true;

      const haystack = [
        script.game,
        script.title,
        script.author,
        script.category,
        script.sourceLabel ?? "",
        ...script.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [category, game, query, scripts, status]);

  const visibleScripts = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + 6, filtered.length));
  }, [filtered.length]);
  const activeCategory = categories.find((item) => item.id === category);
  const activeCategoryLabel = activeCategory ? categoryLabel(activeCategory) : "";
  const activeFilters =
    status !== "all" || game !== ALL_GAMES || category !== "all" || query.trim().length > 0;

  useEffect(() => {
    setVisibleCount(6);
    autoTriggeredRef.current = false;
  }, [category, game, query, scripts.length, status]);

  useEffect(() => {
    if (!autoLoad || !hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          autoTriggeredRef.current = false;
          return;
        }
        if (autoTriggeredRef.current) return;
        autoTriggeredRef.current = true;
        loadMore();
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [autoLoad, hasMore, loadMore]);

  useEffect(() => {
    if (category !== "all" && !categories.some((item) => item.id === category)) {
      setCategory("all");
    }
  }, [categories, category]);

  useEffect(() => {
    if (game !== ALL_GAMES && !gameOptions.includes(game)) {
      setGame(ALL_GAMES);
    }
  }, [game, gameOptions]);

  const resetFilters = () => {
    setStatus("all");
    setGame(ALL_GAMES);
    setCategory("all");
    onQueryChange("");
  };

  return (
    <section
      id="kesfet"
      className={cn(
        "relative scroll-mt-28 py-20 sm:py-24",
        page !== "all" && "pt-28 sm:pt-32",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-neon/70 to-transparent" />
              <span className="section-kicker text-neon/70">
                {page === "all" ? t("explorer.kicker") : t(pageKey("kicker"))}
              </span>
            </div>
            <h2 className="mt-4 max-w-xl font-display text-[30px] font-medium leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">
              {page === "all" ? t("explorer.titleLead") : t(pageKey("title"))}
              <span className="bg-gradient-to-r from-white via-[#B9F8FF] to-[#5F91FF] bg-clip-text text-transparent">
                {page === "all" ? t("explorer.titleHighlight") : t(pageKey("titleHighlight"))}
              </span>
            </h2>
            <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-white/50 sm:text-[13.5px]">
              {page === "all" ? t("explorer.description") : t(pageKey("description"))}
            </p>
            {page !== "all" && <SourceTabs className="mt-4 justify-start" />}
            {page !== "all" && (
              <div className="mt-3 flex max-w-md items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-neon/35">
                <Search className="h-3.5 w-3.5 shrink-0 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  aria-label={t("hero.searchAria")}
                  className="w-full bg-transparent text-[12.5px] text-white/85 placeholder:text-white/25 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    aria-label={t("hero.clearSearch")}
                    className="text-white/35 transition-colors hover:text-neon"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </Reveal>

          <Reveal delay={100} className="shrink-0">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 backdrop-blur-xl">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-neon/40 [animation-duration:2.6s]" />
                <span className="h-2 w-2 rounded-full bg-neon shadow-[0_0_10px_2px_rgba(0,240,255,0.5)]" />
              </span>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/25">
                  {t("hero.statSource")}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/60">
                  {libraryState === "live"
                    ? t("explorer.sourceLive", { source: pageSourceLabel })
                    : libraryState === "loading"
                      ? t("explorer.sourceLoading")
                      : t("explorer.sourceCurated")}
                </p>
              </div>
              <span aria-hidden="true" className="ml-1 h-6 w-px bg-white/[0.08]" />
              <TrendingUp className="h-3.5 w-3.5 text-neon/50" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={140}>
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2.5 backdrop-blur-2xl sm:p-3">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <span className="hidden shrink-0 items-center gap-1.5 pl-1 pr-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 sm:flex">
                <Layers className="h-3 w-3" />
                {t("explorer.category")}
              </span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  aria-pressed={category === "all"}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition-all duration-300",
                    category === "all"
                      ? "border-neon/35 bg-neon/[0.1] text-neon shadow-[0_0_22px_-10px_rgba(0,240,255,0.9)]"
                      : "border-transparent bg-white/[0.025] text-white/45 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white/80",
                  )}
                >
                  {t("explorer.all")}
                  <span className="font-mono text-[8.5px] opacity-50">{scripts.length}</span>
                </button>
                {categories.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      aria-pressed={active}
                      title={categoryDescription(item)}
                      className={cn(
                        "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition-all duration-300",
                        active
                          ? "border-neon/35 bg-neon/[0.1] text-neon shadow-[0_0_22px_-10px_rgba(0,240,255,0.9)]"
                          : "border-transparent bg-white/[0.025] text-white/45 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white/80",
                      )}
                    >
                      {categoryLabel(item)}
                      <span className="font-mono text-[8.5px] opacity-50">{item.count}</span>
                    </button>
                  );
                })}
              </div>
              <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/25 sm:flex">
                <Globe className="h-2.5 w-2.5 text-neon/50" />
                {libraryState === "live" ? pageSourceLabel : t("explorer.local")}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-2.5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <span className="hidden shrink-0 items-center gap-1.5 pl-1 pr-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 sm:flex">
                  <Sliders className="h-3 w-3" />
                  {t("explorer.status")}
                </span>
                <div className="flex shrink-0 rounded-xl border border-white/[0.07] bg-black/25 p-1">
                  {statusTabs.map((tab) => {
                    const active = status === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatus(tab.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10.5px] font-medium transition-all duration-300",
                          active
                            ? tab.id === "patched"
                              ? "bg-blood-deep/60 text-[#ffb3b3] shadow-[inset_0_0_0_1px_rgba(139,0,0,0.4)]"
                              : "bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                            : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
                        )}
                      >
                        {tab.id !== "all" && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              tab.id === "working"
                                ? "bg-neon shadow-[0_0_6px_1px_rgba(0,240,255,0.5)]"
                                : "bg-[#ff5a5a]",
                              !active && "opacity-60",
                            )}
                          />
                        )}
                        {t(tab.labelKey)}
                        <span
                          className={cn(
                            "font-mono text-[8.5px]",
                            active ? "text-white/40" : "text-white/20",
                          )}
                        >
                          {counts[tab.id]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar xl:justify-end">
                {gameOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGame(item)}
                    aria-pressed={game === item}
                    className={cn(
                      "whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition-all duration-300",
                      game === item
                        ? "border-neon/35 bg-neon/[0.09] text-neon shadow-[0_0_20px_-10px_rgba(0,240,255,0.8)]"
                        : "border-transparent bg-white/[0.02] text-white/45 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white/80",
                    )}
                  >
                    {item === ALL_GAMES ? t("explorer.gameAll") : item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10.5px] text-white/40">
            <Sparkles className="h-3 w-3 text-neon/50" />
            <span>
              <span className="font-medium text-white/60">{filtered.length}</span>{" "}
              {filtered.length === 1
                ? t("explorer.scriptOne")
                : t("explorer.scriptMany")}
              {activeCategory ? ` · ${activeCategoryLabel}` : ""}
              {query.trim()
                ? t("explorer.searchSuffix", { query: query.trim() })
                : libraryState === "live"
                  ? t("explorer.liveSuffix", { source: pageSourceLabel })
                  : t("explorer.curatedSuffix")}
            </span>
            {activeFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 text-[9.5px] text-white/40 transition-colors hover:border-neon/25 hover:text-neon"
              >
                <X className="h-2.5 w-2.5" />
                {t("explorer.clear")}
              </button>
            )}
          </div>
          {user && (
            <button
              type="button"
              onClick={onPublish}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neon/25 bg-neon/[0.07] px-2.5 py-1.5 text-[10.5px] font-medium text-neon/85 transition-colors duration-300 hover:border-neon/45 hover:bg-neon/[0.12] hover:text-neon"
            >
              <Plus className="h-3 w-3" />
              {t("explorer.publish")}
            </button>
          )}
          <div className="hidden items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/20 sm:flex">
            <span className="h-1 w-1 rounded-full bg-neon/60" />
            {libraryState === "live"
              ? t("explorer.syncLive", { time: timeAgo(lastSync, locale) })
              : libraryState === "loading"
                ? t("explorer.syncLoading")
                : t("explorer.syncLocal")}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center backdrop-blur-xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/30">
              <Search className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-[18px] font-medium text-white/85">
              {t("explorer.emptyTitle")}
            </h3>
            <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-white/45">
              {t("explorer.emptyDescription")}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl border border-neon/25 bg-neon/[0.07] px-4 py-2.5 text-[11.5px] font-medium text-neon transition-colors duration-300 hover:bg-neon/[0.12]"
            >
              {t("explorer.reset")}
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleScripts.map((script, index) => (
              <Reveal key={script.id} delay={Math.min(index * 55, 275)} className="h-full">
                <ScriptCard script={script} onOpen={onOpenScript} onNotify={onNotify} />
              </Reveal>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-5 py-3 text-[11.5px] font-medium text-white/60 backdrop-blur-xl transition-all duration-300 hover:border-neon/30 hover:bg-neon/[0.05] hover:text-white"
                >
                  {t("explorer.loadMore")}
                  <span className="rounded-md border border-white/[0.08] bg-black/20 px-1.5 py-0.5 font-mono text-[9px] text-white/35">
                    +{filtered.length - visibleCount}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              )}
              {filtered.length > 6 && (
                <button
                  type="button"
                  onClick={() => {
                    autoTriggeredRef.current = false;
                    setAutoLoad((value) => !value);
                  }}
                  aria-pressed={autoLoad}
                  aria-label={t("explorer.autoLoad")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-3 text-[10.5px] font-medium transition-all duration-300",
                    autoLoad
                      ? "border-neon/35 bg-neon/[0.1] text-neon shadow-[0_0_24px_-12px_rgba(0,240,255,0.9)]"
                      : "border-white/[0.09] bg-white/[0.03] text-white/45 hover:border-neon/25 hover:text-white",
                  )}
                >
                  <Zap className="h-3 w-3" />
                  Auto
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] opacity-60">
                    {autoLoad ? t("explorer.autoOn") : t("explorer.autoOff")}
                  </span>
                </button>
              )}
            </div>
            <div ref={loadMoreRef} aria-hidden="true" className="h-px w-full" />
            {filtered.length <= visibleCount && filtered.length > 6 && (
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                {t("explorer.allShown")}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

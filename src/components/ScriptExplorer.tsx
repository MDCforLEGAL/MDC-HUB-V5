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
    <section id="kesfet" className="explorer-section scroll-mt-28">
      <div className="container-page">
        <div className="explorer-head">
          <Reveal>
            <span className="section-kicker">
              {page === "all" ? t("explorer.kicker") : t(pageKey("kicker"))}
            </span>
            <h2 className="section-title">
              {page === "all" ? t("explorer.titleLead") : t(pageKey("title"))}
              <span className="text-accent">
                {page === "all" ? t("explorer.titleHighlight") : t(pageKey("titleHighlight"))}
              </span>
            </h2>
            <p className="section-lead">
              {page === "all" ? t("explorer.description") : t(pageKey("description"))}
            </p>
            {page !== "all" && <SourceTabs className="mt-4" />}
            {page !== "all" && (
              <div className="mt-4 flex max-w-md items-center gap-2 border border-[var(--line)] bg-[var(--surface)] px-3 py-2 focus-within:border-[var(--info)]">
                <Search className="h-3.5 w-3.5 shrink-0 text-[var(--faint)]" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  aria-label={t("hero.searchAria")}
                  className="w-full bg-transparent text-[0.76rem] text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    aria-label={t("hero.clearSearch")}
                    className="text-[var(--faint)] transition-colors hover:text-[var(--accent)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </Reveal>

          <Reveal delay={100} className="shrink-0">
            <div className="explorer-status">
              <strong>
                {libraryState === "live"
                  ? t("explorer.sourceLive", { source: pageSourceLabel })
                  : libraryState === "loading"
                    ? t("explorer.sourceLoading")
                    : t("explorer.sourceCurated")}
              </strong>
              <span>
                {t("hero.statSource")} / {libraryState === "live" ? pageSourceLabel : t("explorer.local")}
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={140}>
          <div className="filter-panel">
            <div className="filter-row">
              <div className="filter-row__group">
                <span className="filter-label">
                  <Layers className="h-3 w-3" />
                  {t("explorer.category")}
                </span>
                <div className="filter-chips">
                  <button
                    type="button"
                    onClick={() => setCategory("all")}
                    aria-pressed={category === "all"}
                    className={cn("filter-chip", category === "all" && "is-active")}
                  >
                    {t("explorer.all")}
                    <span>{scripts.length}</span>
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
                        className={cn("filter-chip", active && "is-active")}
                      >
                        {categoryLabel(item)}
                        <span>{item.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 border-l border-[var(--line)] pl-3 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)] sm:flex">
                <Globe className="h-2.5 w-2.5" />
                {libraryState === "live" ? pageSourceLabel : t("explorer.local")}
              </span>
            </div>

            <div className="filter-row">
              <div className="filter-row__group">
                <span className="filter-label">
                  <Sliders className="h-3 w-3" />
                  {t("explorer.status")}
                </span>
                <div className="status-tabs">
                  {statusTabs.map((tab) => {
                    const active = status === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatus(tab.id)}
                        aria-pressed={active}
                        className={cn(
                          "status-tab",
                          active && "is-active",
                          tab.id === "patched" && "is-danger",
                        )}
                      >
                        {tab.id !== "all" && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "status-tab__dot",
                              tab.id === "patched" && "is-danger",
                            )}
                          />
                        )}
                        {t(tab.labelKey)}
                        <span>{counts[tab.id]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="filter-row__group">
                {gameOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGame(item)}
                    aria-pressed={game === item}
                    className={cn("filter-chip", game === item && "is-active")}
                  >
                    {item === ALL_GAMES ? t("explorer.gameAll") : item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="results-line">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-[var(--accent)]" />
            <span>
              <strong>{filtered.length}</strong>{" "}
              {filtered.length === 1 ? t("explorer.scriptOne") : t("explorer.scriptMany")}
              {activeCategory ? ` / ${activeCategoryLabel}` : ""}
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
                className="inline-flex items-center gap-1 border-b border-[var(--line)] py-0.5 text-[0.65rem] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <X className="h-2.5 w-2.5" />
                {t("explorer.clear")}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button type="button" onClick={onPublish} className="btn btn-secondary btn-sm">
                <Plus className="h-3 w-3" />
                {t("explorer.publish")}
              </button>
            )}
            <div className="hidden items-center gap-2 font-mono text-[0.55rem] uppercase tracking-[0.05em] text-[var(--faint)] sm:flex">
              <span className="h-1.5 w-1.5 bg-[var(--info)]" />
              {libraryState === "live"
                ? t("explorer.syncLive", { time: timeAgo(lastSync, locale) })
                : libraryState === "loading"
                  ? t("explorer.syncLoading")
                  : t("explorer.syncLocal")}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">
              <Search className="h-5 w-5" />
            </span>
            <h3>{t("explorer.emptyTitle")}</h3>
            <p>{t("explorer.emptyDescription")}</p>
            <button type="button" onClick={resetFilters} className="btn btn-secondary mt-5">
              {t("explorer.reset")}
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleScripts.map((script, index) => (
              <Reveal key={script.id} delay={Math.min(index * 40, 200)} className="h-full">
                <ScriptCard script={script} onOpen={onOpenScript} onNotify={onNotify} />
              </Reveal>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasMore && (
                <button type="button" onClick={loadMore} className="btn btn-secondary">
                  {t("explorer.loadMore")}
                  <span className="font-mono text-[0.58rem] text-[var(--faint)]">
                    +{filtered.length - visibleCount}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
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
                  className={cn("btn", autoLoad ? "btn-primary" : "btn-secondary")}
                >
                  <Zap className="h-3 w-3" />
                  Auto
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.04em] opacity-70">
                    {autoLoad ? t("explorer.autoOn") : t("explorer.autoOff")}
                  </span>
                </button>
              )}
            </div>
            <div ref={loadMoreRef} aria-hidden="true" className="h-px w-full" />
            {filtered.length <= visibleCount && filtered.length > 6 && (
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-[var(--faint)]">
                {t("explorer.allShown")}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

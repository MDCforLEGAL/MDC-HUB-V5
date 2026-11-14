import { useEffect, useRef, type FormEvent } from "react";
import type { PresenceState } from "../hooks/usePresence";
import type { LibraryState } from "../hooks/useScriptLibrary";
import { useI18n } from "../i18n";
import type { PresenceStats } from "../lib/api";
import { formatCompact, timeAgo } from "../lib/format";
import { ArrowRight, Search, X } from "./Icons";
import { SourceTabs } from "./SourceTabs";

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  resultCount: number;
  scriptCount: number;
  workingRate: number;
  lastSync: string | null;
  libraryState: LibraryState;
  presence: PresenceStats | null;
  presenceState: PresenceState;
  popularSearches: string[];
}

export function Hero({
  query,
  onQueryChange,
  onSubmitSearch,
  resultCount,
  scriptCount,
  workingRate,
  lastSync,
  libraryState,
  presence,
  presenceState,
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
  const isLive = libraryState === "live";

  const syncValue = isLive
    ? timeAgo(lastSync, locale).replace(locale === "tr" ? " önce" : " ago", "")
    : t("hero.statLocal");

  const badge =
    libraryState === "live"
      ? t("hero.badgeLive")
      : libraryState === "loading"
        ? t("hero.badgeLoading")
        : t("hero.badgeCurated");

  const stats = [
    { value: formatCompact(scriptCount, locale), label: t("hero.statScripts") },
    {
      value: `${workingRate.toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
        maximumFractionDigits: 1,
      })}%`,
      label: t("hero.statWorking"),
    },
  ];

  const presenceValue = (value: number | undefined) =>
    typeof value === "number"
      ? value.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")
      : "—";

  const presenceStats = [
    {
      value: presenceValue(presence?.registeredActive),
      label: t("hero.presenceRegistered"),
    },
    {
      value: presenceValue(presence?.guestActive),
      label: t("hero.presenceGuests"),
    },
    {
      value: presenceValue(presence?.offline),
      label: t("hero.presenceOffline"),
    },
    {
      value: presenceValue(presence?.totalVisitors),
      label: t("hero.presenceTotal"),
    },
  ];

  const presenceLabel =
    presenceState === "live"
      ? t("hero.presenceLive")
      : presenceState === "loading"
        ? t("hero.presenceLoading")
        : t("hero.presenceUnavailable");

  return (
    <section id="top" className="hero-section">
      <div className="container-page hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className={isLive ? "hero-eyebrow__dot is-live" : "hero-eyebrow__dot"} />
            <span>{badge}</span>
            <span aria-hidden="true" className="h-3 w-px bg-[var(--line-strong)]" />
            <strong>
              {formatCompact(scriptCount, locale)}{" "}
              {scriptCount === 1 ? t("explorer.scriptOne") : t("explorer.scriptMany")}
            </strong>
          </div>

          <h1 className="hero-title">
            <span>{t("hero.titleLead")}</span>
            <span className="hero-highlight">{t("hero.titleHighlight")}</span>
          </h1>

          <p className="hero-sub">
            {t("hero.subtitle")}
            <strong>{t("hero.subtitleEmphasis")}</strong>
          </p>

          <form onSubmit={handleSubmit} role="search" className="hero-form">
            <Search className="hero-form__icon" aria-hidden="true" />
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
            />
            {trimmedQuery && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label={t("hero.clearSearch")}
                className="hero-form__clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd>⌘K</kbd>
            <button type="submit" className="btn btn-primary">
              <span>{t("hero.search")}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </form>

          <div className="hero-hint" aria-live="polite">
            {trimmedQuery ? (
              <>
                <span>
                  {resultCount === 1
                    ? t("hero.foundOne")
                    : t("hero.foundMany", { count: resultCount })}
                </span>
                <span aria-hidden="true">/</span>
                <button type="button" onClick={() => onQueryChange("")}>
                  {t("hero.clear")}
                </button>
              </>
            ) : (
              <span>{t("hero.keyboardHint")}</span>
            )}
          </div>

          <div className="mt-5">
            <SourceTabs />
          </div>

          <div className="hero-popular">
            <span className="hero-popular__label">{t("hero.popular")}</span>
            {popularSearches.map((term) => (
              <button key={term} type="button" onClick={() => onQueryChange(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>

        <aside className="hero-index" aria-label={t("hero.statSource")}>
          <div className="hero-index__head">
            <span>{t("hero.statSource")} / INDEX</span>
            <span className={isLive ? "hero-index__status" : "hero-index__status is-local"}>
              {isLive ? "LIVE" : "LOCAL"}
            </span>
          </div>

          <dl className="hero-index__grid">
            {stats.map((stat) => (
              <div key={stat.label} className="hero-stat">
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="hero-index__community">
            <div className="hero-index__community-head">
              <span>{t("hero.presenceTitle")}</span>
              <span className={`hero-index__community-state is-${presenceState}`}>
                {presenceLabel}
              </span>
            </div>
            <dl className="hero-index__grid hero-index__grid--presence">
              {presenceStats.map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero-index__foot">
            <span>{t("hero.statSync")}</span>
            <strong>{syncValue}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

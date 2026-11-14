import type { ScriptEntry } from "../data/scripts";
import { cn } from "../lib/cn";
import { formatCompact, timeAgo } from "../lib/format";
import { useCopy } from "../hooks/useCopy";
import { useI18n } from "../i18n";
import { GameGlyph } from "./GameGlyph";
import { ArrowUpRight, Check, Code2, Copy, Eye, Star } from "./Icons";
import { VerifiedMark } from "./VerifiedMark";

interface ScriptCardProps {
  script: ScriptEntry;
  onOpen: (script: ScriptEntry) => void;
  onNotify: (message: string) => void;
}

export function StatusBadge({ status }: { status: ScriptEntry["status"] }) {
  const { t } = useI18n();
  const working = status === "working";

  return (
    <span className={cn("status-pill", working ? "status-pill--ok" : "status-pill--bad")}>
      {working ? t("card.working") : t("card.patched")}
    </span>
  );
}

export function ScriptCard({ script, onOpen, onNotify }: ScriptCardProps) {
  const { copied, copy } = useCopy(onNotify);
  const { t, locale } = useI18n();
  const working = script.status === "working";
  const updatedLabel = script.updatedAt ? timeAgo(script.updatedAt, locale) : script.updated;
  const categoryLabel =
    script.source && script.source !== "mdc"
      ? script.universal
        ? t("card.universal")
        : t("card.gameScript")
      : script.category;

  return (
    <article className={cn("script-card", working ? "is-working" : "is-patched")}>
      <div className="script-card__top">
        <div className="script-card__identity">
          <span className="script-card__icon">
            <GameGlyph name={script.glyph} className="h-5 w-5" />
            {script.gameImage && (
              <img
                src={script.gameImage}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </span>
          <div className="min-w-0">
            <p className="script-card__game">{script.game}</p>
            <p className="script-card__kicker">
              {categoryLabel}
              {script.source && script.source !== "mdc" ? ` / ${script.sourceLabel}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={script.status} />
      </div>

      <h3 className="script-card__title">{script.title}</h3>

      <div className="script-card__byline">
        <span className="grid h-4 w-4 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-[7px] font-semibold uppercase text-[var(--muted)]">
          {script.author.charAt(0)}
        </span>
        <b>@{script.author}</b>
        <VerifiedMark
          role={script.authorRole}
          verified={script.verified}
          className="h-3.5 w-3.5"
        />
        <i aria-hidden="true" />
        <span>{updatedLabel}</span>
      </div>

      <div className="script-card__tags">
        {script.premium && (
          <span className="script-tag script-tag--premium">{t("card.premium")}</span>
        )}
        {script.tags.map((tag) => (
          <span key={tag} className="script-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="script-card__bottom">
        <div className="script-card__stats">
          <span>
            <Star className="h-3 w-3 text-[var(--info)]" />
            <strong>
              {typeof script.likes === "number"
                ? formatCompact(script.likes, locale)
                : script.rating.toFixed(1)}
            </strong>
          </span>
          <span>
            <Eye className="h-3 w-3" />
            {typeof script.views === "number"
              ? formatCompact(script.views, locale)
              : script.downloads}
          </span>
          <span>
            <Code2 className="h-3 w-3" />
            Lua
          </span>
          <span className="source">{script.sourceLabel ?? "MDC"}</span>
        </div>

        <div className="script-card__actions">
          <button
            type="button"
            onClick={() => void copy(script.code)}
            aria-label={t("card.copyAria", { title: script.title })}
            className={cn("card-action", copied && "is-copied")}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("card.copied") : t("card.copy")}
          </button>
          <button
            type="button"
            onClick={() => onOpen(script)}
            aria-label={t("card.detailsAria", { title: script.title })}
            className="card-action card-action--details"
          >
            {t("card.details")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

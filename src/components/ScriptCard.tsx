import type { ScriptEntry } from "../data/scripts";
import { cn } from "../lib/cn";
import { formatCompact, timeAgo } from "../lib/format";
import { useCopy } from "../hooks/useCopy";
import { useI18n } from "../i18n";
import { GameGlyph } from "./GameGlyph";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Code2,
  Copy,
  Eye,
  Star,
} from "./Icons";

interface ScriptCardProps {
  script: ScriptEntry;
  onOpen: (script: ScriptEntry) => void;
  onNotify: (message: string) => void;
}

export function StatusBadge({ status }: { status: ScriptEntry["status"] }) {
  const { t } = useI18n();
  const working = status === "working";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.13em]",
        working
          ? "border-neon/30 bg-neon/[0.08] text-neon shadow-[0_0_20px_-7px_rgba(0,240,255,0.8)]"
          : "border-blood/55 bg-blood-deep/80 text-[#ff9d9d] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_20px_-8px_rgba(139,0,0,0.9)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          working
            ? "bg-neon shadow-[0_0_8px_2px_rgba(0,240,255,0.55)]"
            : "bg-[#ff5a5a] shadow-[0_0_8px_2px_rgba(255,80,80,0.4)]",
        )}
      />
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
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1",
        working
          ? "border-neon/20 bg-[linear-gradient(158deg,rgba(0,240,255,0.06),rgba(255,255,255,0.022)_46%,rgba(0,102,255,0.035))] shadow-[inset_0_0_40px_-28px_rgba(0,240,255,0.8)] hover:border-neon/45 hover:shadow-[0_26px_70px_-32px_rgba(0,240,255,0.55),inset_0_0_40px_-24px_rgba(0,240,255,0.55)]"
          : "border-blood/35 bg-[linear-gradient(158deg,rgba(74,0,0,0.34),rgba(9,6,9,0.55)_55%,rgba(255,255,255,0.018))] hover:border-blood/65 hover:shadow-[0_26px_70px_-32px_rgba(139,0,0,0.65),inset_0_0_40px_-26px_rgba(139,0,0,0.8)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
          working ? "via-neon/70" : "via-blood/90",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500",
          working ? "bg-neon/[0.09]" : "bg-blood/20",
          "opacity-0 group-hover:opacity-100",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            style={{
              borderColor: `${script.colors[0]}38`,
              backgroundImage: `linear-gradient(145deg, ${script.colors[0]}26, ${script.colors[1]}0f 58%, transparent)`,
            }}
          >
            <GameGlyph
              name={script.glyph}
              className="h-6 w-6"
              style={{ color: script.colors[0] }}
            />
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
            <p className="truncate text-[12px] font-medium text-white/85">{script.game}</p>
            <p className="mt-0.5 truncate font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/35">
              {categoryLabel}
              {script.source && script.source !== "mdc" ? ` · ${script.sourceLabel}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={script.status} />
      </div>

      <h3 className="mt-5 font-display text-[17px] font-medium leading-snug tracking-[-0.012em] text-white/92 transition-colors duration-300 group-hover:text-white">
        <span className="line-clamp-2">{script.title}</span>
      </h3>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10.5px]">
        <span className="grid h-4 w-4 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-white/20 to-white/[0.04] text-[7.5px] font-semibold uppercase text-white/65">
          {script.author.charAt(0)}
        </span>
        <span className="text-white/45">@{script.author}</span>
        {script.verified && (
          <BadgeCheck
            className="h-3.5 w-3.5 text-neon/80"
            aria-label={
              script.source === "mdc"
                ? t("card.verifiedDeveloper")
                : t("card.verifiedSource", { source: script.sourceLabel ?? "" })
            }
          />
        )}
        <span aria-hidden="true" className="text-white/12">/</span>
        <span className="text-white/35">{updatedLabel}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {script.premium && (
          <span className="rounded-md border border-blood/45 bg-blood-deep/70 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#ffa8a8] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {t("card.premium")}
          </span>
        )}
        {script.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-white/[0.07] bg-white/[0.035] px-1.5 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.12em] text-white/45 transition-colors duration-300 group-hover:border-white/[0.1] group-hover:text-white/55"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto">
        <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-3 text-[10px] text-white/45">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-neon/60" />
            <span className="font-medium text-white/65">
              {typeof script.likes === "number"
                ? formatCompact(script.likes, locale)
                : script.rating.toFixed(1)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {typeof script.views === "number"
              ? formatCompact(script.views, locale)
              : script.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Code2 className="h-3 w-3" />
            Lua
          </span>
          <span className="ml-auto max-w-[42%] truncate font-mono text-[8px] uppercase tracking-[0.16em] text-white/18">
            {script.sourceLabel ?? "MDC"}
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void copy(script.code)}
            aria-label={t("card.copyAria", { title: script.title })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11.5px] font-medium transition-all duration-300",
              copied
                ? "border-neon/45 bg-neon/[0.12] text-neon shadow-[0_0_24px_-12px_rgba(0,240,255,0.8)]"
                : "border-white/[0.09] bg-white/[0.03] text-white/65 hover:border-neon/35 hover:bg-neon/[0.06] hover:text-white",
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("card.copied") : t("card.copy")}
          </button>
          <button
            type="button"
            onClick={() => onOpen(script)}
            aria-label={t("card.detailsAria", { title: script.title })}
            className="group/details flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 py-2.5 text-[11.5px] font-medium text-white/55 transition-all duration-300 hover:border-electric/45 hover:bg-electric/[0.08] hover:text-white"
          >
            {t("card.details")}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/details:-translate-y-0.5 group-hover/details:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

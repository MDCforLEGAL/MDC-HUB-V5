import { useEffect, useRef } from "react";
import type { ScriptEntry } from "../data/scripts";
import { useCopy } from "../hooks/useCopy";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";
import { formatCompact, isHttpUrl, timeAgo } from "../lib/format";
import { CodeBlock } from "./CodeBlock";
import { GameGlyph } from "./GameGlyph";
import { StatusBadge } from "./ScriptCard";
import { ScriptSocial } from "./ScriptSocial";
import { VerifiedMark } from "./VerifiedMark";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Download,
  Eye,
  KeyRound,
  Star,
  X,
} from "./Icons";

interface ScriptModalProps {
  script: ScriptEntry;
  onClose: () => void;
  onNotify: (message: string) => void;
}

export function ScriptModal({ script, onClose, onNotify }: ScriptModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useCopy(onNotify);
  const { t, locale } = useI18n();
  const codeName = `${(script.slug ?? script.id).replace(/[^a-z0-9-_]/gi, "-")}.lua`;
  const isExternal = Boolean(script.source && script.source !== "mdc");
  const updatedLabel = script.updatedAt ? timeAgo(script.updatedAt, locale) : script.updated;
  const summary =
    script.summary ||
    t("modal.generatedSummary", {
      author: script.author,
      game: script.game,
      source: script.sourceLabel ?? "MDC",
    });
  const categoryLabel =
    script.source && script.source !== "mdc"
      ? script.universal
        ? t("card.universal")
        : t("card.gameScript")
      : script.category;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay fade-in fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`script-title-${script.id}`}
        tabIndex={-1}
        className="modal-panel modal-in relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden outline-none sm:max-h-[88vh]"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-px",
            script.status === "working" ? "bg-[var(--info)]" : "bg-[var(--accent)]",
          )}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("modal.closeAria")}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="code-scroll flex-1 overflow-y-auto">
          <div className="p-5 pr-14 sm:p-7 sm:pr-16">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "relative grid h-12 w-12 shrink-0 place-items-center border border-[var(--line)] bg-[var(--surface-2)]",
                  script.status === "working" ? "text-[var(--info)]" : "text-[var(--accent)]",
                )}
              >
                <GameGlyph name={script.glyph} className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[12px] font-medium text-white/80">{script.game}</p>
                  <span aria-hidden="true" className="h-3 w-px bg-white/10" />
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/28">
                    {categoryLabel}
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={script.status} />
                  {script.premium && (
                    <span className="border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.05em] text-[var(--accent)]">
                      {t("modal.premium")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h2
              id={`script-title-${script.id}`}
              className="mt-5 font-display text-[24px] font-medium leading-tight tracking-[-0.025em] text-white sm:text-[28px]"
            >
              {script.title}
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <span className="grid h-4 w-4 place-items-center border border-[var(--line)] bg-[var(--surface-2)] text-[0.5rem] font-semibold uppercase text-[var(--muted)]">
                {script.author.charAt(0)}
              </span>
              <span className="text-white/45">@{script.author}</span>
              <VerifiedMark
                role={script.authorRole}
                verified={script.verified}
                className="h-3.5 w-3.5"
              />
              <span aria-hidden="true" className="mx-0.5 text-white/12">/</span>
              <span className="flex items-center gap-1 text-white/30">
                <Clock className="h-3 w-3" />
                {t("modal.updated", { time: updatedLabel })}
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-white/55 sm:text-[13px]">
              {summary}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  icon: Star,
                  label: typeof script.likes === "number" ? t("modal.likes") : t("modal.rating"),
                  value:
                    typeof script.likes === "number"
                      ? formatCompact(script.likes, locale)
                      : script.rating.toFixed(1),
                },
                {
                  icon: Eye,
                  label: t("modal.views"),
                  value:
                    typeof script.views === "number"
                      ? formatCompact(script.views, locale)
                      : script.downloads,
                },
                {
                  icon: Download,
                  label: t("modal.pricing"),
                  value: script.premium ? t("modal.premium") : t("modal.free"),
                },
                {
                  icon: KeyRound,
                  label: t("modal.access"),
                  value:
                    script.keyless || script.tags.includes("Keyless")
                      ? t("modal.keyless")
                      : t("modal.key"),
                },
              ].map((meta) => (
                <div
                  key={meta.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                >
                  <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
                    <meta.icon className="h-2.5 w-2.5" />
                    {meta.label}
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-white/70">{meta.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {script.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/50"
                >
                  {tag}
                </span>
              ))}
              {isHttpUrl(script.sourceUrl) && (
                <a
                  href={script.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/source ml-auto inline-flex items-center gap-1.5 border border-[var(--info)] bg-[var(--info-soft)] px-2 py-1 text-[0.62rem] font-medium text-[var(--info)] transition-colors hover:bg-[var(--info)] hover:text-white"
                >
                  {t("modal.openSource", { source: script.sourceLabel ?? "Source" })}
                  <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover/source:-translate-y-0.5 group-hover/source:translate-x-0.5" />
                </a>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
              <span>{t("modal.license")}</span>
              <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 normal-case tracking-normal text-white/45">
                {isExternal ? t("modal.licenseExternal") : t("modal.licenseSite")}
              </span>
            </div>

            {script.status === "patched" && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-blood/35 bg-blood-deep/25 px-3.5 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8f8f]" />
                <p className="text-[11px] leading-relaxed text-[#ffc4c4]/75">
                  <span className="font-medium text-[#ffb0b0]">{t("card.patched")}.</span>{" "}
                  {isExternal
                    ? t("modal.patchedExternal", { source: script.sourceLabel ?? "Source" })
                    : t("modal.patchedCurated")}
                </p>
              </div>
            )}

            {isExternal && (
              <div className="mt-4 flex items-start gap-2.5 border border-[var(--info)] bg-[var(--info-soft)] px-3.5 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--info)]" />
                <p className="text-[0.7rem] leading-relaxed text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--info)]">{t("modal.thirdPartyTitle")}</span>{" "}
                  {t("modal.thirdPartyBody", { source: script.sourceLabel ?? "Source" })}
                </p>
              </div>
            )}

            <div data-keep-dark className="code-window mt-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                <span className="flex items-center gap-2">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 bg-[#d0263a]" />
                    <span className="h-1.5 w-1.5 bg-[#3b3e45]" />
                    <span className="h-1.5 w-1.5 bg-[#5c8fc8]" />
                  </span>
                  {codeName}
                </span>
                <span>
                  {t("modal.lines", { count: script.code.trim().split("\n").length })}
                </span>
              </div>
              <CodeBlock code={script.code} className="max-h-[300px]" />
            </div>

            <ScriptSocial
              scriptId={script.id}
              fallbackLikes={script.likes}
              onNotify={onNotify}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--line)] bg-[var(--surface-2)] p-4 sm:px-6">
          <button
            type="button"
            onClick={() => void copy(script.code)}
            className={cn(
              "btn flex-1 sm:flex-none",
              copied ? "btn-secondary text-[var(--info)]" : "btn-primary",
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("modal.copied") : t("modal.copy")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            {t("modal.close")}
          </button>
          <span className="ml-auto hidden items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)] sm:flex">
            <span className="h-1 w-1 bg-[var(--info)]" />
            {isExternal
              ? t("modal.sourceBadge", { source: script.sourceLabel ?? "Source" })
              : t("modal.mdcVerified")}
          </span>
        </div>
      </div>
    </div>
  );
}

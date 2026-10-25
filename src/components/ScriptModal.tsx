import { useEffect, useRef } from "react";
import type { ScriptEntry } from "../data/scripts";
import { useCopy } from "../hooks/useCopy";
import { cn } from "../lib/cn";
import { CodeBlock } from "./CodeBlock";
import { GameGlyph } from "./GameGlyph";
import { StatusBadge } from "./ScriptCard";
import {
  AlertTriangle,
  BadgeCheck,
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
      className="fade-in fixed inset-0 z-[70] flex items-end justify-center bg-[#02040a]/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
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
        className="modal-in relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#060b13]/95 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),0_0_80px_-50px_rgba(0,240,255,0.5)] backdrop-blur-2xl outline-none sm:max-h-[88vh] sm:rounded-3xl"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            script.status === "working" ? "via-neon/60" : "via-blood/80",
          )}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Detay penceresini kapat"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="code-scroll flex-1 overflow-y-auto">
          <div className="p-5 pr-14 sm:p-7 sm:pr-16">
            <div className="flex items-center gap-3">
              <span
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
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
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[12px] font-medium text-white/80">{script.game}</p>
                  <span aria-hidden="true" className="h-3 w-px bg-white/10" />
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/28">
                    {script.category}
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={script.status} />
                  {script.premium && (
                    <span className="rounded-full border border-blood/45 bg-blood-deep/70 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#ffa8a8]">
                      Premium
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
              <span className="grid h-4 w-4 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-white/20 to-white/[0.04] text-[7.5px] font-semibold uppercase text-white/65">
                {script.author.charAt(0)}
              </span>
              <span className="text-white/45">@{script.author}</span>
              {script.verified && <BadgeCheck className="h-3.5 w-3.5 text-neon/80" />}
              <span aria-hidden="true" className="mx-0.5 text-white/12">/</span>
              <span className="flex items-center gap-1 text-white/30">
                <Clock className="h-3 w-3" />
                {script.updated} güncellendi
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-white/55 sm:text-[13px]">
              {script.summary}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: Star, label: "Puan", value: script.rating.toFixed(1) },
                { icon: Eye, label: "Görüntülenme", value: script.downloads },
                { icon: Download, label: "Lisans", value: "Ücretsiz" },
                { icon: KeyRound, label: "Erişim", value: script.tags.includes("Keyless") ? "Keyless" : "Key" },
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

            <div className="mt-4 flex flex-wrap gap-1.5">
              {script.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/50"
                >
                  {tag}
                </span>
              ))}
            </div>

            {script.status === "patched" && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-blood/35 bg-blood-deep/25 px-3.5 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8f8f]" />
                <p className="text-[11px] leading-relaxed text-[#ffc4c4]/75">
                  <span className="font-medium text-[#ffb0b0]">Bu script şu anda patched.</span>{" "}
                  Oyun güncellemesi sonrası devre dışı kaldı; geliştirici düzeltme üzerinde
                  çalışıyor.
                </p>
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-[#04080e]/70">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                <span className="flex items-center gap-2">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]/60" />
                  </span>
                  {script.id}.lua
                </span>
                <span>{script.code.trim().split("\n").length} satır</span>
              </div>
              <CodeBlock code={script.code} className="max-h-[300px]" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() =>
              void copy(script.code, `${script.title} panoya kopyalandı`)
            }
            className={cn(
              "group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold transition-all duration-300 sm:flex-none",
              copied
                ? "border border-neon/40 bg-neon/[0.12] text-neon"
                : "bg-gradient-to-r from-neon to-electric text-[#02070a] shadow-[0_10px_30px_-12px_rgba(0,240,255,0.8)] hover:shadow-[0_14px_38px_-10px_rgba(0,240,255,0.9)]",
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopyalandı" : "Tek Tıkla Kopyala"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[12px] font-medium text-white/55 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white sm:flex-none"
          >
            Kapat
          </button>
          <span className="ml-auto hidden items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/20 sm:flex">
            <span className="h-1 w-1 rounded-full bg-neon/60" />
            MDC Verified
          </span>
        </div>
      </div>
    </div>
  );
}

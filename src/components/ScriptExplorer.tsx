import { useEffect, useMemo, useState } from "react";
import { games, scripts, type ScriptEntry } from "../data/scripts";
import { cn } from "../lib/cn";
import { ScriptCard } from "./ScriptCard";
import { Reveal } from "./Reveal";
import { ArrowRight, Search, Sliders, Sparkles, TrendingUp, X } from "./Icons";

type StatusFilter = "all" | "working" | "patched";

interface ScriptExplorerProps {
  query: string;
  onQueryChange: (value: string) => void;
  onOpenScript: (script: ScriptEntry) => void;
  onNotify: (message: string) => void;
}

const statusTabs: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "working", label: "Çalışıyor" },
  { id: "patched", label: "Patched" },
];

export function ScriptExplorer({
  query,
  onQueryChange,
  onOpenScript,
  onNotify,
}: ScriptExplorerProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [game, setGame] = useState("Tümü");
  const [visibleCount, setVisibleCount] = useState(6);

  const counts = useMemo(
    () => ({
      all: scripts.length,
      working: scripts.filter((script) => script.status === "working").length,
      patched: scripts.filter((script) => script.status === "patched").length,
    }),
    [],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return scripts.filter((script) => {
      if (status !== "all" && script.status !== status) return false;
      if (game !== "Tümü" && script.game !== game) return false;
      if (!needle) return true;

      const haystack = [
        script.game,
        script.title,
        script.author,
        script.category,
        ...script.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [query, status, game]);

  const visibleScripts = filtered.slice(0, visibleCount);
  const activeFilters = status !== "all" || game !== "Tümü" || query.trim().length > 0;

  useEffect(() => {
    setVisibleCount(6);
  }, [query, status, game]);

  const resetFilters = () => {
    setStatus("all");
    setGame("Tümü");
    onQueryChange("");
  };

  return (
    <section id="kesfet" className="relative scroll-mt-28 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-neon/70 to-transparent" />
              <span className="section-kicker text-neon/70">Script Keşfi</span>
            </div>
            <h2 className="mt-4 max-w-xl font-display text-[30px] font-medium leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">
              Küratörlü{" "}
              <span className="bg-gradient-to-r from-white via-[#B9F8FF] to-[#5F91FF] bg-clip-text text-transparent">
                script kütüphanesi
              </span>
            </h2>
            <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-white/50 sm:text-[13.5px]">
              Her script, çalışma durumu doğrulanmadan yayına alınmaz. Filtrele, incele ve
              tek tıkla kopyala.
            </p>
          </Reveal>

          <Reveal delay={100} className="shrink-0">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 backdrop-blur-xl">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-neon/40 [animation-duration:2.6s]" />
                <span className="h-2 w-2 rounded-full bg-neon shadow-[0_0_10px_2px_rgba(0,240,255,0.5)]" />
              </span>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/25">
                  Ağ durumu
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/60">
                  Tüm scriptler senkron
                </p>
              </div>
              <span aria-hidden="true" className="ml-1 h-6 w-px bg-white/[0.08]" />
              <TrendingUp className="h-3.5 w-3.5 text-neon/50" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={140}>
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2.5 backdrop-blur-2xl sm:p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <span className="hidden shrink-0 items-center gap-1.5 pl-1 pr-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 sm:flex">
                  <Sliders className="h-3 w-3" />
                  Durum
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
                        {tab.label}
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
                {games.map((item) => (
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
                    {item}
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
              <span className="font-medium text-white/60">{filtered.length}</span> script
              {query.trim() ? (
                <>
                  {" "}
                  · <span className="text-white/45">&ldquo;{query.trim()}&rdquo;</span> araması
                </>
              ) : (
                " · küratör seçkisi"
              )}
            </span>
            {activeFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 text-[9.5px] text-white/40 transition-colors hover:border-neon/25 hover:text-neon"
              >
                <X className="h-2.5 w-2.5" />
                Temizle
              </button>
            )}
          </div>
          <div className="hidden items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/20 sm:flex">
            <span className="h-1 w-1 rounded-full bg-neon/60" />
            Son senkron · az önce
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center backdrop-blur-xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/30">
              <Search className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-[18px] font-medium text-white/85">
              Sonuç bulunamadı
            </h3>              <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-white/45">
              Farklı bir oyun, script adı veya özellik dene. Kütüphane her gün büyüyor.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl border border-neon/25 bg-neon/[0.07] px-4 py-2.5 text-[11.5px] font-medium text-neon transition-colors duration-300 hover:bg-neon/[0.12]"
            >
              Filtreleri sıfırla
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
            {filtered.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 3)}
                className="group inline-flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-5 py-3 text-[11.5px] font-medium text-white/60 backdrop-blur-xl transition-all duration-300 hover:border-neon/30 hover:bg-neon/[0.05] hover:text-white"
              >
                Daha fazla script yükle
                <span className="rounded-md border border-white/[0.08] bg-black/20 px-1.5 py-0.5 font-mono text-[9px] text-white/35">
                  +{filtered.length - visibleCount}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            )}
            {filtered.length <= visibleCount && filtered.length > 3 && (
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                Tüm sonuçlar gösteriliyor
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

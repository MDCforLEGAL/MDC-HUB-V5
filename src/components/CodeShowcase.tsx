import { useState } from "react";
import { useCopy } from "../hooks/useCopy";
import { cn } from "../lib/cn";
import { CodeBlock } from "./CodeBlock";
import { Reveal } from "./Reveal";
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "./Icons";

const loaderCode = `-- MDC HUB · Universal Loader v5
-- discord.gg/mdchub · keyless & güncel

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer

local MDC = {
    version = "5.0.4",
    game = "Blox Fruits",
    status = "verified",
    features = { "Auto Farm", "ESP", "Speed" },
}

local function fetchModule(id)
    local ok, source = pcall(function()
        return game:HttpGet("https://api.mdchub.dev/v5/" .. id)
    end)
    if not ok then
        warn("[MDC] Bağlantı hatası · yeniden deneniyor")
        task.wait(1)
        return fetchModule(id)
    end
    return source
end

local function loadScript(id)
    local source = fetchModule(id)
    local chunk = loadstring(source)
    if not chunk then return warn("[MDC] Modül doğrulanamadı") end
    return chunk()
end

loadScript("blox-fruits/autofarm")
print(("[MDC] Hazır · v%s"):format(MDC.version))`;

const configCode = `-- MDC HUB · config / v5
local CONFIG = {
    theme         = "cyber-luxury",
    autoUpdate    = true,
    notifications = true,
    safeMode      = true,
    keyless       = true,
}

local MODULES = {
    combat = { enabled = true, fov = 120, smoothness = 0.18 },
    farm   = { enabled = true, radius = 250, autoQuest = true },
    visual = { enabled = false, esp = "boxes", teamCheck = true },
}

local function save(preset)
    writefile("mdc/config.lua", string.format(
        "return %s", preset or CONFIG
    ))
    print("[MDC] Ayarlar kaydedildi")
end

save(CONFIG)`;

const samples = [
  { id: "loader", name: "loader.lua", code: loaderCode },
  { id: "config", name: "config.lua", code: configCode },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Doğrulanmış kaynak",
    description: "Her satır yayın öncesi imzalanır.",
  },
  {
    icon: Zap,
    title: "Anında kopyala",
    description: "Tek tıkla panoda, kurulum yok.",
  },
  {
    icon: RefreshCw,
    title: "Otomatik güncelleme",
    description: "Yeni sürümler canlı senkronize.",
  },
  {
    icon: Lock,
    title: "Keyless erişim",
    description: "Gizli anahtar, gereksiz adım yok.",
  },
];

interface CodeShowcaseProps {
  onNotify: (message: string) => void;
}

export function CodeShowcase({ onNotify }: CodeShowcaseProps) {
  const [activeId, setActiveId] = useState("loader");
  const active = samples.find((sample) => sample.id === activeId) ?? samples[0];
  const { copied, copy } = useCopy(onNotify);
  const lineCount = active.code.trim().split("\n").length;

  return (
    <section id="kod" className="relative scroll-mt-28 overflow-hidden py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -z-10 h-[560px] w-[560px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[radial-gradient(circle,rgba(0,102,255,0.1),transparent_66%)] blur-3xl"
      />
      <div aria-hidden="true" className="dot-field pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 opacity-40" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 xl:gap-20">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-neon/70 to-transparent" />
              <span className="section-kicker text-neon/70">Geliştirici Deneyimi</span>
            </div>

            <h2 className="mt-4 max-w-md font-display text-[30px] font-medium leading-[1.06] tracking-[-0.035em] text-white sm:text-[42px]">
              Tek satır.{" "}
              <span className="bg-gradient-to-r from-[#CFFBFF] via-neon to-[#4E86FF] bg-clip-text text-transparent">
                Tüm güç.
              </span>
            </h2>

            <p className="mt-4 max-w-md text-[12.5px] leading-relaxed text-white/50 sm:text-[13.5px]">
              MDC Engine, doğrulanmış modülleri tek bir `loadstring` çağrısıyla yükler.
              Sürümler arka planda güncellenir; sen sadece oyununa odaklanırsın.
            </p>

            <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-neon/70">
                    <feature.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium text-white/75">{feature.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-white/40">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#kesfet"
                className="group inline-flex items-center gap-2 rounded-xl border border-neon/25 bg-neon/[0.07] px-4 py-2.5 text-[11.5px] font-semibold text-neon transition-all duration-300 hover:border-neon/45 hover:bg-neon/[0.12] hover:shadow-[0_0_30px_-12px_rgba(0,240,255,0.7)]"
              >
                Tüm scriptleri keşfet
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/22">
                Ortalama kurulum · 4.2 sn
              </span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_60%_40%,rgba(0,240,255,0.13),transparent_68%)] blur-2xl"
              />

              <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#04080e]/85 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="h-2 w-2 rounded-full bg-[#ff5f57]/75" />
                      <span className="h-2 w-2 rounded-full bg-[#febc2e]/75" />
                      <span className="h-2 w-2 rounded-full bg-[#28c840]/75" />
                    </div>
                    <span aria-hidden="true" className="h-4 w-px bg-white/[0.08]" />
                    <span className="hidden items-center gap-1.5 font-mono text-[9.5px] text-white/30 sm:flex">
                      <span className="text-neon/50">~/mdc</span>
                      <span className="text-white/15">/</span>
                      <span className="text-white/45">{active.name}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30 sm:flex">
                      <Code2 className="h-2.5 w-2.5 text-neon/50" />
                      Lua 5.1
                    </span>
                    <button
                      type="button"
                      onClick={() => void copy(active.code, `${active.name} panoya kopyalandı`)}
                      aria-label="Kodu kopyala"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-300",
                        copied
                          ? "border-neon/40 bg-neon/[0.12] text-neon"
                          : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:border-neon/30 hover:text-white",
                      )}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Kopyalandı" : "Kopyala"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 border-b border-white/[0.05] bg-black/20 px-3 py-2">
                  {samples.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setActiveId(sample.id)}
                      aria-pressed={active.id === sample.id}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 font-mono text-[9.5px] transition-all duration-300",
                        active.id === sample.id
                          ? "bg-white/[0.07] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "text-white/30 hover:bg-white/[0.03] hover:text-white/55",
                      )}
                    >
                      {sample.name}
                    </button>
                  ))}
                  <span className="ml-auto hidden items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-neon/40 sm:flex">
                    <span className="h-1 w-1 rounded-full bg-neon/60" />
                    MDC Engine
                  </span>
                </div>

                <CodeBlock code={active.code} className="max-h-[380px] bg-[#04080e]/60" />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.015] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                  <span>UTF-8 · Lua 5.1 · MDC v5.0.4</span>
                  <div className="flex items-center gap-3">
                    <span>{lineCount} satır</span>
                    <span className="flex items-center gap-1.5 text-neon/55">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

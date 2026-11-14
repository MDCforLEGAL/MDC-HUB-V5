import { useState } from "react";
import { useCopy } from "../hooks/useCopy";
import { useI18n } from "../i18n";
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
-- discord.gg/6ETYaxeSTU · keyless & up to date

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
        warn("[MDC] Connection error · retrying")
        task.wait(1)
        return fetchModule(id)
    end
    return source
end

local function loadScript(id)
    local source = fetchModule(id)
    local chunk = loadstring(source)
    if not chunk then return warn("[MDC] Module could not be verified") end
    return chunk()
end

loadScript("blox-fruits/autofarm")
print(("[MDC] Ready · v%s"):format(MDC.version))`;

const configCode = `-- MDC HUB · config / v5
local CONFIG = {
    theme         = "editorial",
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
    print("[MDC] Settings saved")
end

save(CONFIG)`;

const samples = [
  { id: "loader", name: "loader.lua", code: loaderCode },
  { id: "config", name: "config.lua", code: configCode },
];

const features = [
  {
    icon: ShieldCheck,
    titleKey: "code.featureSourceTitle",
    descriptionKey: "code.featureSourceDesc",
  },
  {
    icon: Zap,
    titleKey: "code.featureCopyTitle",
    descriptionKey: "code.featureCopyDesc",
  },
  {
    icon: RefreshCw,
    titleKey: "code.featureUpdateTitle",
    descriptionKey: "code.featureUpdateDesc",
  },
  {
    icon: Lock,
    titleKey: "code.featureKeylessTitle",
    descriptionKey: "code.featureKeylessDesc",
  },
] as const;

interface CodeShowcaseProps {
  onNotify: (message: string) => void;
}

export function CodeShowcase({ onNotify }: CodeShowcaseProps) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState("loader");
  const active = samples.find((sample) => sample.id === activeId) ?? samples[0];
  const { copied, copy } = useCopy(onNotify);
  const lineCount = active.code.trim().split("\n").length;

  return (
    <section id="kod" className="scroll-mt-28 py-20 sm:py-24">
      <div className="container-page">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 xl:gap-20">
          <Reveal>
            <span className="section-kicker">{t("code.kicker")}</span>

            <h2 className="section-title">
              {t("code.titleLead")}
              <span className="text-accent">{t("code.titleHighlight")}</span>
            </h2>

            <p className="section-lead">{t("code.description")}</p>

            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div key={feature.titleKey} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center border",
                      index % 2 === 0
                        ? "border-[var(--info)] text-[var(--info)]"
                        : "border-[var(--accent)] text-[var(--accent)]",
                    )}
                  >
                    <feature.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[0.76rem] font-semibold text-[var(--ink)]">
                      {t(feature.titleKey)}
                    </p>
                    <p className="mt-0.5 text-[0.66rem] leading-relaxed text-[var(--muted)]">
                      {t(feature.descriptionKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#kesfet" className="btn btn-secondary">
                {t("code.cta")}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
                {t("code.installTime")}
              </span>
            </div>
          </Reveal>

          <Reveal delay={120} className="min-w-0">
            <div data-keep-dark className="code-window min-w-0">
              <div className="code-window__bar">
                <div className="flex items-center gap-3">
                  <div className="code-window__dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span aria-hidden="true" className="h-4 w-px bg-[#292c32]" />
                  <span className="hidden items-center gap-1.5 font-mono text-[0.58rem] text-[#858b94] sm:flex">
                    <span className="text-[#7ea6d8]">~/mdc</span>
                    <span className="text-[#4c5158]">/</span>
                    <span className="text-[#c5cbd4]">{active.name}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1.5 border border-[#292c32] px-2 py-1 font-mono text-[0.52rem] uppercase tracking-[0.05em] text-[#8d949e] sm:flex">
                    <Code2 className="h-2.5 w-2.5" />
                    {t("code.lua")}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copy(active.code)}
                    aria-label={t("code.copyAria")}
                    className={cn(
                      "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.6rem] font-semibold transition-colors",
                      copied
                        ? "border-[#7ea6d8] bg-[#7ea6d8]/10 text-[#a9c5e8]"
                        : "border-[#34383f] text-[#a9b0ba] hover:border-[#565c65] hover:text-white",
                    )}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? t("code.copied") : t("code.copy")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 border-b border-[#24272c] bg-[#0a0c0f] px-3 py-1.5">
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => setActiveId(sample.id)}
                    aria-pressed={active.id === sample.id}
                    className={cn(
                      "px-2.5 py-1.5 font-mono text-[0.58rem] transition-colors",
                      active.id === sample.id
                        ? "bg-[#22252a] text-[#e5e8ec]"
                        : "text-[#7d848e] hover:bg-[#181b1f] hover:text-[#c5cbd4]",
                    )}
                  >
                    {sample.name}
                  </button>
                ))}
                <span className="ml-auto hidden items-center gap-1.5 font-mono text-[0.52rem] uppercase tracking-[0.05em] text-[#7ea6d8] sm:flex">
                  <span className="h-1 w-1 bg-[#7ea6d8]" />
                  {t("code.engine")}
                </span>
              </div>

              <CodeBlock code={active.code} className="max-h-[380px] bg-[#0c0e11]" />

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#24272c] bg-[#0a0c0f] px-4 py-2.5 font-mono text-[0.52rem] uppercase tracking-[0.04em] text-[#7d848e]">
                <span>UTF-8 · Lua 5.1 · MDC v5.0.4</span>
                <div className="flex items-center gap-3">
                  <span>{t("code.lines", { count: lineCount })}</span>
                  <span className="flex items-center gap-1.5 text-[#7ea6d8]">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {t("code.secure")}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

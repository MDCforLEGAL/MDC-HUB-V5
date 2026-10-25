import { useId } from "react";
import { cn } from "../lib/cn";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  const gradientId = `mdc-mark-${useId().replace(/:/g, "")}`;

  return (
    <a
      href="#top"
      className={cn("group flex items-center gap-3", className)}
      aria-label="MDC HUB ana sayfa"
    >
      <span className="relative grid h-10 w-10 shrink-0 place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-neon/20 blur-lg transition-all duration-300 group-hover:bg-neon/40"
        />
        <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-neon/30 bg-[#040a10] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_24px_-8px_rgba(0,240,255,0.7)]">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(145deg,rgba(0,240,255,0.22),rgba(0,102,255,0.08)_55%,transparent)]"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="relative h-[22px] w-[22px]"
          >
            <defs>
              <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22">
                <stop offset="0%" stopColor="#9CFBFF" />
                <stop offset="45%" stopColor="#00F0FF" />
                <stop offset="100%" stopColor="#0066FF" />
              </linearGradient>
            </defs>
            <path
              d="M4.5 18V6.5l5 6.2 3.2-6.2L20 18"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="19.4" cy="5.6" r="1.5" fill="#00F0FF" />
          </svg>
        </span>
      </span>

      <span className="flex flex-col leading-none">
        <span className="flex items-baseline gap-[3px] font-display text-[17px] font-semibold tracking-[0.02em] text-white">
          MDC
          <span className="bg-gradient-to-r from-neon to-electric bg-clip-text text-transparent">
            HUB
          </span>
          <span className="ml-1 hidden rounded-[4px] border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[7px] font-medium tracking-[0.16em] text-white/45 sm:inline">
            V5
          </span>
        </span>
        {!compact && (
          <span className="mt-1 hidden font-mono text-[7.5px] uppercase tracking-[0.34em] text-white/45 sm:block">
            Script Ecosystem
          </span>
        )}
      </span>
    </a>
  );
}

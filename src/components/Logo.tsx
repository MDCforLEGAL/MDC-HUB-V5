import { cn } from "../lib/cn";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <a href="#top" className={cn("brand", className)} aria-label="MDC HUB">
      <span className="brand-mark" aria-hidden="true">
        M
      </span>
      <span className="brand-copy">
        <span className="brand-name">
          MDC <b>HUB</b>
          <small>V5</small>
        </span>
        {!compact && <span className="brand-sub">Script Archive</span>}
      </span>
    </a>
  );
}

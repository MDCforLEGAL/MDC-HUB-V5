import { cn } from "../lib/cn";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <a href="#top" className={cn("brand", className)} aria-label="MDC HUB">
      <span className="brand-mark" aria-hidden="true">
        M
      </span>
      <span className="brand-copy">
        <span className="brand-name">
          MDC <b>HUB</b>
        </span>
        <span className="brand-sub">V5</span>
      </span>
    </a>
  );
}

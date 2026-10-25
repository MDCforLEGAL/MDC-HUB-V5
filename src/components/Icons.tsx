import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const Search = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const ArrowUpRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const ArrowLeft = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </svg>
);

export const Copy = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

export const X = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Menu = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Plus = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Sparkles = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 13.7 9l5.3 1.8-5.3 1.8L12 18l-1.7-5.4L5 10.8 10.3 9 12 3.5Z" />
    <path d="M19 16.5 19.7 19l2.3.7-2.3.8L19 23l-.7-2.5L16 19.7l2.3-.7.7-2.5Z" />
    <path d="M5 2.5 5.5 4.4 7.5 5l-2 .6L5 7.5l-.5-1.9L2.5 5l2-.6L5 2.5Z" />
  </svg>
);

export const ShieldCheck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v5.5c0 4.4 2.9 7.7 7 9.5 4.1-1.8 7-5.1 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Zap = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M13 2 4.5 13.2h6L10.5 22 19 10.8h-6L13 2Z" />
  </svg>
);

export const Star = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" />
  </svg>
);

export const Eye = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const Download = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
  </svg>
);

export const EyeOff = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m3 3 18 18M10.6 10.7a2.8 2.8 0 0 0 3.9 3.9" />
    <path d="M9.9 5.7A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.5M6.3 6.9A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5c1 0 2-.2 2.8-.6" />
  </svg>
);

export const Clock = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const KeyRound = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="4.2" />
    <path d="m11 11 8 8M16 16l2-2M19 19l2-2" />
  </svg>
);

export const Lock = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    <path d="M12 14v2" />
  </svg>
);

export const Code2 = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
  </svg>
);

export const ChevronDown = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const ChevronRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const Terminal = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
    <path d="m7 9 3 3-3 3M12.5 15H17" />
  </svg>
);

export const Layers = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3.5 12.5 8.5 4.7 8.5-4.7M3.5 16.5 12 21l8.5-4.5" />
  </svg>
);

export const RefreshCw = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.6L3 9" />
    <path d="M3 4v5h5M4 13a8 8 0 0 0 14.3 4.6L21 15" />
    <path d="M21 20v-5h-5" />
  </svg>
);

export const Sliders = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </svg>
);

export const Play = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);

export const Users = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 5a3.5 3.5 0 0 1 0 7M18 14.7c2.2.6 3.7 2.4 4 5.3" />
  </svg>
);

export const TrendingUp = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const Mail = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const User = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
  </svg>
);

export const MessageCircle = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20.5 11.5a8 8 0 0 1-8.5 8 9.6 9.6 0 0 1-3.4-.7L3.5 21l1.4-3.6a8 8 0 0 1-1.4-4.6 8 8 0 0 1 8.5-8 8 8 0 0 1 8.5 6.7Z" />
  </svg>
);

export const Github = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.2 3.3 9.6 7.9 11.2.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.3 1.8 1.3 1.1 1.9 2.8 1.4 3.5 1 .1-.8.4-1.4.8-1.7-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17 5.9 18 6.2 18 6.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6a11.8 11.8 0 0 0 7.9-11.2A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export const Globe = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.4 3.8 5.5 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3Z" />
  </svg>
);

export const Send = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m21 3-9.5 18-2.2-7.3L2 11.4 21 3Z" />
    <path d="m9.3 13.7 4.5-4.5" />
  </svg>
);

export const AlertTriangle = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const BadgeCheck = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 1.8 14.6 4l3.4-.2 1 3.2 2.8 1.9-1.3 3.1 1.3 3.1-2.8 1.9-1 3.2-3.4-.2L12 22.2 9.4 20l-3.4.2-1-3.2L2.2 15 3.5 12 2.2 8.9 5 7l1-3.2 3.4.2L12 1.8Z" />
    <path d="m8.5 12 2.4 2.4 4.7-4.9" fill="none" stroke="#05090F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

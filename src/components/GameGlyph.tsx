import type { SVGProps } from "react";

export type GameGlyphName =
  | "fruit"
  | "paw"
  | "crosshair"
  | "door"
  | "car"
  | "tower"
  | "crown"
  | "dice"
  | "ball";

type Props = SVGProps<SVGSVGElement> & { name: GameGlyphName };

export function GameGlyph({ name, ...props }: Props) {
  const common: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };

  switch (name) {
    case "fruit":
      return (
        <svg {...common}>
          <circle cx="12" cy="14.5" r="6.5" />
          <path d="M12 8c0-2.2 1.8-3.8 4-3.8M9.4 13.2c1.2-1.1 3-1.1 4.2 0M8 17c1.5-1 3.5-1 5 0" />
          <path d="M18 2.8c-2.4.2-3.8 1.4-4 3.4 2.2.2 3.7-1 4-3.4Z" />
        </svg>
      );
    case "paw":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="15.5" rx="5.2" ry="4.2" />
          <ellipse cx="6" cy="10" rx="2" ry="2.6" />
          <ellipse cx="10" cy="7.2" rx="2" ry="2.7" />
          <ellipse cx="14.4" cy="7" rx="2" ry="2.7" />
          <ellipse cx="18.2" cy="9.6" rx="2" ry="2.6" />
        </svg>
      );
    case "crosshair":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="M12 2v4.5M12 17.5V22M2 12h4.5M17.5 12H22" />
        </svg>
      );
    case "door":
      return (
        <svg {...common}>
          <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21" />
          <path d="M3 21h18M14.5 12h.01" />
          <path d="M9.5 7.8h5" />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="m4 13 1.8-5A2.5 2.5 0 0 1 8.2 6h7.6a2.5 2.5 0 0 1 2.4 2L20 13" />
          <path d="M3 13h18a2 2 0 0 1 2 2v3h-2.5M1 18v-3a2 2 0 0 1 2-2" />
          <circle cx="6.5" cy="18" r="2" />
          <circle cx="17.5" cy="18" r="2" />
          <path d="M8.5 18h7M7 10h10" />
        </svg>
      );
    case "tower":
      return (
        <svg {...common}>
          <path d="M6 21V9l6-6 6 6v12" />
          <path d="M4 21h16M6 9h12M9.5 21v-5h5v5" />
          <path d="M12 3v6M10 17h4" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="m3 8 4.5 3L12 4l4.5 7L21 8l-2 11H5L3 8Z" />
          <path d="M5.5 15.5h13M12 8v3" />
        </svg>
      );
    case "dice":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />
        </svg>
      );
    case "ball":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m12 7.5 4.2 3-1.6 5h-5.2l-1.6-5 4.2-3ZM7.5 3.4 9.4 8M16.5 3.4 14.6 8M21 10.5l-4.8 0M3 10.5l4.8 0M16.9 19.5l-2.3-4M7.1 19.5l2.3-4" />
        </svg>
      );
    default:
      return null;
  }
}

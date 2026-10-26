import type { Locale } from "../i18n";

const compactFormatters = new Map<Locale, Intl.NumberFormat>();
const relativeFormatters = new Map<Locale, Intl.RelativeTimeFormat>();

function localeTag(locale: Locale): string {
  return locale === "tr" ? "tr-TR" : "en-US";
}

export function formatCompact(
  value: number | null | undefined,
  locale: Locale = "en",
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  let formatter = compactFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(localeTag(locale), {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    compactFormatters.set(locale, formatter);
  }

  return formatter.format(value);
}

export function timeAgo(
  iso: string | null | undefined,
  locale: Locale = "en",
): string {
  if (!iso) return locale === "tr" ? "bilinmiyor" : "unknown";

  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return locale === "tr" ? "bilinmiyor" : "unknown";

  let formatter = relativeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(localeTag(locale), { numeric: "auto" });
    relativeFormatters.set(locale, formatter);
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1_000));
  if (seconds < 60) return formatter.format(-seconds, "second");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return formatter.format(-minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return formatter.format(-hours, "hour");

  const days = Math.floor(hours / 24);
  if (days < 30) return formatter.format(-days, "day");

  const months = Math.floor(days / 30);
  if (months < 12) return formatter.format(-months, "month");

  return formatter.format(-Math.floor(months / 12), "year");
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

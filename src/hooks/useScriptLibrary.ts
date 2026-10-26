import { useEffect, useMemo, useState } from "react";
import {
  fallbackCategories,
  scripts as curatedScripts,
  type LibraryCategory,
  type LibrarySource,
  type LiveScript,
  type ScriptEntry,
} from "../data/scripts";
import { formatCompact, isHttpUrl, timeAgo } from "../lib/format";

export type LibraryState = "loading" | "live" | "fallback";

export interface ScriptLibrary {
  generatedAt: string | null;
  sources: LibrarySource[];
  categories: LibraryCategory[];
  scripts: ScriptEntry[];
  games: string[];
  state: LibraryState;
}

const GLYPHS: ScriptEntry["glyph"][] = [
  "fruit",
  "paw",
  "crosshair",
  "door",
  "car",
  "tower",
  "crown",
  "dice",
  "ball",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLiveScript(value: unknown): value is LiveScript {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.game === "string" &&
    typeof value.code === "string" &&
    value.code.length > 0 &&
    (value.status === "working" || value.status === "patched")
  );
}

function normalizeCategory(value: unknown): LibraryCategory | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.label !== "string") return null;
  return {
    id: value.id,
    label: value.label,
    description: typeof value.description === "string" ? value.description : undefined,
    count: typeof value.count === "number" ? value.count : 0,
  };
}

function normalizeSource(value: unknown): LibrarySource | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.label !== "string" ||
    typeof value.url !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    label: value.label,
    url: value.url,
    count: typeof value.count === "number" ? value.count : undefined,
  };
}

function toEntry(live: LiveScript): ScriptEntry {
  const views = Number.isFinite(live.views) ? live.views : 0;
  const source =
    live.source === "scriptblox" || live.source === "rscripts" ? live.source : "mdc";
  const sourceLabel = live.sourceLabel || (source === "mdc" ? "MDC" : "Topluluk");
  const colors =
    Array.isArray(live.colors) &&
    live.colors.length === 2 &&
    live.colors.every((color) => typeof color === "string")
      ? live.colors
      : live.status === "patched"
        ? (["#B33A3A", "#4A0000"] as [string, string])
        : (["#00F0FF", "#0066FF"] as [string, string]);

  return {
    id: live.id,
    game: live.game || "Roblox",
    category: live.universal ? "Universal" : "Oyun Scripti",
    title: live.title,
    author: live.author || sourceLabel,
    verified: Boolean(live.verified),
    status: live.status,
    premium: Boolean(live.premium),
    tags: Array.isArray(live.tags)
      ? live.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 3)
      : [],
    rating: typeof live.rating === "number" ? live.rating : 0,
    downloads: formatCompact(views),
    updated: timeAgo(live.updatedAt),
    glyph: GLYPHS.includes(live.glyph) ? live.glyph : "dice",
    colors,
    summary:
      typeof live.summary === "string" && live.summary.trim()
        ? live.summary
        : `${live.game} için topluluk tarafından paylaşılan script.`,
    code: live.code,
    source,
    sourceLabel,
    sourceUrl: isHttpUrl(live.sourceUrl) ? live.sourceUrl : undefined,
    gameImage: isHttpUrl(live.gameImage) ? live.gameImage : undefined,
    likes: typeof live.likes === "number" ? live.likes : undefined,
    views,
    keyless: Boolean(live.keyless),
    universal: Boolean(live.universal),
    categoryIds: Array.isArray(live.categoryIds)
      ? live.categoryIds.filter((id): id is string => typeof id === "string")
      : [],
    slug: typeof live.slug === "string" ? live.slug : live.id,
  };
}

function buildFallback(state: LibraryState): ScriptLibrary {
  const scripts: ScriptEntry[] = curatedScripts.map((script) => ({
    ...script,
    source: "mdc",
    sourceLabel: "MDC",
    categoryIds: ["curated"],
    keyless: script.tags.includes("Keyless"),
    universal: script.tags.includes("Universal"),
  }));

  return {
    generatedAt: null,
    sources: [
      { id: "mdc", label: "MDC seçkisi", url: "#", count: scripts.length },
    ],
    categories: fallbackCategories,
    scripts,
    games: Array.from(new Set(scripts.map((script) => script.game))),
    state,
  };
}

export function useScriptLibrary(): ScriptLibrary {
  const [library, setLibrary] = useState<ScriptLibrary>(() => buildFallback("loading"));

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    let mounted = true;

    const load = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL.endsWith("/")
          ? import.meta.env.BASE_URL
          : `${import.meta.env.BASE_URL}/`;
        const response = await fetch(
          `${baseUrl}data/scripts.json`,
          {
            signal: controller.signal,
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Library endpoint did not return JSON");
        }

        const payload: unknown = await response.json();
        if (!isRecord(payload) || !Array.isArray(payload.scripts)) {
          throw new Error("Invalid library payload");
        }

        const liveScripts = payload.scripts.filter(isLiveScript);
        if (liveScripts.length === 0) throw new Error("Empty library payload");

        const scripts = liveScripts.map(toEntry);
        const categoryCounts = new Map<string, number>();
        for (const script of scripts) {
          for (const id of script.categoryIds ?? []) {
            categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
          }
        }

        const categories = (Array.isArray(payload.categories) ? payload.categories : [])
          .map(normalizeCategory)
          .filter((category): category is LibraryCategory => category !== null)
          .map((category) => ({
            ...category,
            count: categoryCounts.get(category.id) ?? 0,
          }))
          .filter((category) => category.count > 0);

        if (categories.length === 0) throw new Error("No categories in library payload");

        const sources = (Array.isArray(payload.sources) ? payload.sources : [])
          .map(normalizeSource)
          .filter((source): source is LibrarySource => source !== null);

        const gameCounts = new Map<string, number>();
        for (const script of scripts) {
          gameCounts.set(script.game, (gameCounts.get(script.game) ?? 0) + 1);
        }
        const games = Array.from(gameCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([game]) => game);

        if (!mounted) return;
        setLibrary({
          generatedAt:
            typeof payload.generatedAt === "string" ? payload.generatedAt : null,
          sources,
          categories,
          scripts,
          games,
          state: "live",
        });
      } catch (error) {
        if (!mounted) return;
        console.warn("[MDC] Canlı kütüphane yüklenemedi; yerel seçki kullanılıyor.", error);
        setLibrary(buildFallback("fallback"));
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void load();

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const games = useMemo(
    () => (library.games.length > 0 ? library.games : Array.from(new Set(library.scripts.map((script) => script.game)))),
    [library],
  );

  return { ...library, games };
}

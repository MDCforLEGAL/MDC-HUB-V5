import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fallbackCategories,
  scripts as curatedScripts,
  type LibraryCategory,
  type LibrarySource,
  type LiveScript,
  type ScriptEntry,
} from "../data/scripts";
import { fetchCommunityScripts, type CommunityScript } from "../lib/api";
import { formatCompact, isHttpUrl, timeAgo } from "../lib/format";

export type LibraryState = "loading" | "live" | "fallback";

export interface ScriptLibrary {
  generatedAt: string | null;
  sources: LibrarySource[];
  categories: LibraryCategory[];
  scripts: ScriptEntry[];
  games: string[];
  state: LibraryState;
  reload: () => void;
}

type Snapshot = Omit<ScriptLibrary, "reload">;

const REFRESH_MS = 5 * 60 * 1000;
const COMMUNITY_ID = "community";

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
  const sourceLabel = live.sourceLabel || (source === "mdc" ? "MDC" : "Community");
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
    downloads: formatCompact(views, "en"),
    updated: timeAgo(live.updatedAt, "en"),
    updatedAt: live.updatedAt,
    glyph: GLYPHS.includes(live.glyph) ? live.glyph : "dice",
    colors,
    summary: typeof live.summary === "string" ? live.summary : "",
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

/** Scripts published from the site get their own category. */
function communityToEntry(script: CommunityScript): ScriptEntry {
  const author =
    script.author?.displayName || script.author?.username || "MDC";
  const summary =
    typeof script.description === "string" && script.description.length > 0
      ? script.description
      : `${script.game} için ${author} tarafından MDC HUB'da paylaşılan script.`;
  const tags = Array.isArray(script.tags) ? script.tags.slice(0, 3) : [];

  return {
    id: script.id,
    game: script.game || "Roblox",
    category: "Topluluk",
    title: script.title || "İsimsiz script",
    author,
    verified: Boolean(script.author?.verified),
    status: "working",
    premium: false,
    tags,
    rating: 0,
    downloads: formatCompact(0, "en"),
    updated: timeAgo(script.createdAt, "en"),
    updatedAt: script.createdAt,
    glyph: "dice",
    colors: ["#00F0FF", "#0066FF"],
    summary,
    code: script.code,
    source: "community",
    sourceLabel: "MDC Community",
    likes: Number.isFinite(script.likes) ? script.likes : 0,
    views: 0,
    keyless: true,
    universal: false,
    categoryIds: [COMMUNITY_ID],
    slug: script.id,
  };
}

function categoriesFrom(
  raw: unknown,
  scripts: ScriptEntry[],
  hasCommunity: boolean,
): LibraryCategory[] {
  const counts = new Map<string, number>();
  for (const script of scripts) {
    for (const id of script.categoryIds ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const base = (Array.isArray(raw) ? raw : [])
    .map(normalizeCategory)
    .filter((category): category is LibraryCategory => category !== null);

  if (hasCommunity && !base.some((category) => category.id === COMMUNITY_ID)) {
    base.unshift({
      id: COMMUNITY_ID,
      label: "Community",
      description: "Scripts published from MDC HUB",
      count: 0,
    });
  }

  return base
    .map((category) => ({ ...category, count: counts.get(category.id) ?? 0 }))
    .filter((category) => category.count > 0);
}

function gamesFrom(scripts: ScriptEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const script of scripts) {
    counts.set(script.game, (counts.get(script.game) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([game]) => game);
}

function buildFallback(state: LibraryState, community: ScriptEntry[]): Snapshot {
  const curated: ScriptEntry[] = curatedScripts.map((script) => ({
    ...script,
    source: "mdc",
    sourceLabel: "MDC",
    categoryIds: ["curated"],
    keyless: script.tags.includes("Keyless"),
    universal: script.tags.includes("Universal"),
  }));

  const scripts = [...community, ...curated];

  return {
    generatedAt: null,
    sources: [{ id: "mdc", label: "MDC seçkisi", url: "#", count: scripts.length }],
    categories: categoriesFrom(fallbackCategories, scripts, community.length > 0),
    scripts,
    games: gamesFrom(scripts),
    state,
  };
}

export function useScriptLibrary(): ScriptLibrary {
  const [library, setLibrary] = useState<Snapshot>(() => buildFallback("loading", []));
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    const timer = window.setInterval(reload, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    let mounted = true;

    const load = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL.endsWith("/")
          ? import.meta.env.BASE_URL
          : `${import.meta.env.BASE_URL}/`;

        const [libraryResult, communityResult] = await Promise.allSettled([
          fetch(`${baseUrl}data/scripts.json`, {
            signal: controller.signal,
            cache: "no-store",
            headers: { Accept: "application/json" },
          }),
          fetchCommunityScripts(controller.signal),
        ]);

        if (!mounted) return;

        const community =
          communityResult.status === "fulfilled"
            ? communityResult.value.map(communityToEntry)
            : [];
        const response = libraryResult.status === "fulfilled" ? libraryResult.value : null;

        if (response && response.ok && response.headers.get("content-type")?.includes("application/json")) {
          const payload: unknown = await response.json();

          if (isRecord(payload) && Array.isArray(payload.scripts)) {
            const liveScripts = payload.scripts.filter(isLiveScript);

            if (liveScripts.length > 0) {
              const scripts = [...community, ...liveScripts.map(toEntry)];
              const categories = categoriesFrom(payload.categories, scripts, community.length > 0);

              if (categories.length > 0) {
                const sources = (Array.isArray(payload.sources) ? payload.sources : [])
                  .map(normalizeSource)
                  .filter((source): source is LibrarySource => source !== null);

                if (!mounted) return;
                setLibrary({
                  generatedAt:
                    typeof payload.generatedAt === "string" ? payload.generatedAt : null,
                  sources,
                  categories,
                  scripts,
                  games: gamesFrom(scripts),
                  state: "live",
                });
                return;
              }
            }
          }
        }

        if (!mounted) return;
        setLibrary(buildFallback("fallback", community));
      } catch (error) {
        if (!mounted) return;
        console.warn("[MDC] Canlı kütüphane yüklenemedi; yerel seçki kullanılıyor.", error);
        setLibrary(buildFallback("fallback", []));
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
  }, [nonce]);

  const games = useMemo(
    () =>
      library.games.length > 0
        ? library.games
        : Array.from(new Set(library.scripts.map((script) => script.game))),
    [library],
  );

  return { ...library, games, reload };
}

import { mkdir, writeFile } from "node:fs/promises";

const SCRIPTBLOX = "https://scriptblox.com";
const RSCRIPTS = "https://api.rscripts.net";
const OUTPUT = "public/data/scripts.json";
const PER_CATEGORY = 10;
const MAX_CODE_LENGTH = 80_000;
const REQUEST_GAP_MS = 160;

const CATEGORIES = [
  {
    id: "trending",
    label: "Trending",
    description: "Son 48 saatte en çok etkileşim alan scriptler",
  },
  {
    id: "new",
    label: "Yeni",
    description: "Kataloğa en son eklenen scriptler",
  },
  {
    id: "popular",
    label: "Popüler",
    description: "En çok görüntülenen scriptler",
  },
  {
    id: "keyless",
    label: "Keyless",
    description: "Key sistemi olmadan çalışan scriptler",
  },
  {
    id: "universal",
    label: "Universal",
    description: "Birden fazla oyunda çalışan scriptler",
  },
  {
    id: "verified",
    label: "Doğrulanmış",
    description: "Kaynak tarafından doğrulanmış scriptler",
  },
  {
    id: "patched",
    label: "Patched",
    description: "Kaynakta patched olarak işaretlenen scriptler",
  },
];

const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
};

const errors = [];
const detailFailures = [];
let skippedLargeCode = 0;
let lastRequestAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function throttle() {
  const wait = REQUEST_GAP_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

async function request(url, options = {}, attempt = 0) {
  await throttle();

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...BROWSER_HEADERS, ...(options.headers ?? {}) },
      signal: AbortSignal.timeout(25_000),
    });
  } catch (error) {
    if (attempt < 2) {
      await sleep(900 * (attempt + 1));
      return request(url, options, attempt + 1);
    }
    throw error;
  }

  if (response.ok) return response;

  if ((response.status === 429 || response.status >= 500) && attempt < 2) {
    await sleep(1_200 * (attempt + 1));
    return request(url, options, attempt + 1);
  }

  const text = await response.text();
  throw new Error(`${response.status} ${response.statusText} · ${text.slice(0, 180)}`);
}

async function requestJson(url, options = {}) {
  const response = await request(url, options);
  return response.json();
}

async function requestText(url, options = {}) {
  const response = await request(url, options);
  return response.text();
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function plainText(value) {
  return stringValue(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimSummary(value) {
  const text = plainText(value);
  if (!text) return "";
  return text.length > 240 ? `${text.slice(0, 237).trimEnd()}…` : text;
}

function absoluteImage(value, base) {
  const image = stringValue(value);
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  return `${base}${image.startsWith("/") ? "" : "/"}${image}`;
}

function computeRating(likes, dislikes) {
  if (likes + dislikes < 3) return undefined;
  return Math.max(1, Math.min(5, Math.round((likes / (likes + dislikes)) * 50) / 10));
}

function glyphFor(game, title, tags) {
  const text = `${game} ${title} ${tags.join(" ")}`.toLowerCase();
  if (/(aim|shoot|combat|pvp|gun|silent)/.test(text)) return "crosshair";
  if (/(pet|hatch|egg|paw)/.test(text)) return "paw";
  if (/(car|race|drift|vehicle|speed)/.test(text)) return "car";
  if (/(tower|defense|tycoon|simulator)/.test(text)) return "tower";
  if (/(door|horror|entity|survive)/.test(text)) return "door";
  if (/(ball|soccer|football|basket|sport|goal)/.test(text)) return "ball";
  if (/(royal|crown|dress|beauty|pageant)/.test(text)) return "crown";
  if (/(fruit|anime|blox)/.test(text)) return "fruit";
  return "dice";
}

function normalizeTags(rawTags, { keyless, universal, premium, fallback }) {
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim())
    : [];

  if (keyless && !tags.some((tag) => /keyless/i.test(tag))) tags.push("Keyless");
  if (universal && !tags.some((tag) => /universal/i.test(tag))) tags.push("Universal");
  if (premium && !tags.some((tag) => /premium|paid/i.test(tag))) tags.push("Premium");
  if (tags.length === 0) tags.push(...fallback);

  return Array.from(new Set(tags)).slice(0, 3);
}

function scriptbloxCategory(id) {
  if (id === "trending") {
    return requestJson(`${SCRIPTBLOX}/api/script/trending`);
  }

  const params = new URLSearchParams({
    page: "1",
    max: String(PER_CATEGORY),
    mode: "free",
  });

  switch (id) {
    case "new":
      params.set("sortBy", "createdAt");
      params.set("order", "desc");
      params.set("patched", "0");
      break;
    case "popular":
      params.set("sortBy", "views");
      params.set("order", "desc");
      params.set("patched", "0");
      break;
    case "keyless":
      params.set("key", "0");
      params.set("sortBy", "views");
      params.set("order", "desc");
      params.set("patched", "0");
      break;
    case "universal":
      params.set("universal", "1");
      params.set("sortBy", "views");
      params.set("order", "desc");
      params.set("patched", "0");
      break;
    case "verified":
      params.set("verified", "1");
      params.set("sortBy", "views");
      params.set("order", "desc");
      params.set("patched", "0");
      break;
    case "patched":
      params.set("patched", "1");
      params.set("sortBy", "updatedAt");
      params.set("order", "desc");
      break;
    default:
      throw new Error(`Unknown ScriptBlox category: ${id}`);
  }

  return requestJson(`${SCRIPTBLOX}/api/script/fetch?${params.toString()}`);
}

const detailCache = new Map();

async function scriptbloxDetail(slug) {
  if (!slug) return null;
  if (detailCache.has(slug)) return detailCache.get(slug);

  try {
    const payload = await requestJson(
      `${SCRIPTBLOX}/api/script/${encodeURIComponent(slug)}`,
    );
    const detail = payload && typeof payload.script === "object" ? payload.script : null;
    detailCache.set(slug, detail);
    return detail;
  } catch (error) {
    detailFailures.push(`${slug}: ${error instanceof Error ? error.message : error}`);
    detailCache.set(slug, null);
    return null;
  }
}

function normalizeScriptblox(item, detail, categoryId) {
  const merged = { ...item, ...(detail ?? {}) };
  const slug = stringValue(merged.slug) || stringValue(item.slug);
  const code = stringValue(merged.script);
  if (!code) return null;
  if (code.length > MAX_CODE_LENGTH) {
    skippedLargeCode += 1;
    return null;
  }

  const game = merged.game && typeof merged.game === "object" ? merged.game : {};
  const gameName = stringValue(game.name) || "Roblox";
  const owner = merged.owner && typeof merged.owner === "object" ? merged.owner : {};
  const author = stringValue(owner.username) || "ScriptBlox";
  const keyless = merged.key === false || merged.keyless === true;
  const universal = Boolean(merged.isUniversal);
  const premium = merged.scriptType === "paid" || Boolean(merged.isPaid);
  const patched = Boolean(merged.isPatched) || categoryId === "patched";
  const likes = numberValue(merged.likeCount ?? merged.likes);
  const dislikes = numberValue(merged.dislikeCount ?? merged.dislikes);
  const tags = normalizeTags(merged.tags, {
    keyless,
    universal,
    premium,
    fallback: premium ? ["Premium"] : ["Script"],
  });
  const summary =
    trimSummary(merged.features) ||
    trimSummary(merged.description) ||
    `${gameName} için ${author} tarafından ScriptBlox'ta paylaşılan script.`;
  const updatedAt =
    stringValue(merged.lastBump) ||
    stringValue(merged.updatedAt) ||
    stringValue(merged.createdAt) ||
    new Date().toISOString();

  if (!slug) return null;

  return {
    id: `scriptblox-${stringValue(merged._id) || slug}`,
    slug,
    source: "scriptblox",
    sourceLabel: "ScriptBlox",
    sourceUrl: `${SCRIPTBLOX}/script/${encodeURIComponent(slug)}`,
    title: stringValue(merged.title) || "İsimsiz script",
    game: gameName,
    gameImage: absoluteImage(game.imageUrl ?? merged.image, SCRIPTBLOX),
    author,
    authorVerified: Boolean(owner.verified),
    verified: Boolean(merged.verified),
    status: patched ? "patched" : "working",
    premium,
    keyless,
    universal,
    tags,
    views: numberValue(merged.views),
    likes,
    dislikes,
    rating: computeRating(likes, dislikes),
    summary,
    code,
    createdAt: stringValue(merged.createdAt) || undefined,
    updatedAt,
    categoryIds: [categoryId],
    glyph: glyphFor(gameName, stringValue(merged.title), tags),
    colors: patched ? ["#B33A3A", "#4A0000"] : ["#00F0FF", "#0066FF"],
  };
}

function rscriptsCategoryParams(id) {
  const params = new URLSearchParams({
    page: "1",
    limit: String(Math.min(PER_CATEGORY, 16)),
    includeScript: "true",
    freeOnly: "true",
  });

  switch (id) {
    case "trending":
      params.set("sort", "trending");
      break;
    case "new":
      params.set("sort", "newest");
      break;
    case "popular":
      params.set("sort", "most-views");
      break;
    case "keyless":
      params.set("sort", "trending");
      params.set("noKeySystem", "true");
      break;
    case "verified":
      params.set("sort", "most-likes");
      params.set("verifiedOnly", "true");
      break;
    default:
      return null;
  }

  return params;
}

function normalizeRscripts(item, categoryId) {
  if (!item || typeof item !== "object") return null;
  const slug = stringValue(item.slug);
  if (!slug) return null;

  const game = item.game && typeof item.game === "object" ? item.game : {};
  const creator = item.creator && typeof item.creator === "object" ? item.creator : {};
  const gameName = stringValue(game.title) || "Roblox";
  const author = stringValue(creator.username) || "Rscripts";
  const keyless = item.isKeySystem !== true;
  const universal = Boolean(item.isUniversal);
  const premium = Boolean(item.isPaid);
  const patched = Boolean(item.isPatched);
  const likes = numberValue(item.likes);
  const dislikes = numberValue(item.dislikes);
  const tags = normalizeTags([], {
    keyless,
    universal,
    premium,
    fallback: item.isMobileReady ? ["Mobile"] : ["Script"],
  });
  const summary =
    trimSummary(item.description) ||
    `${gameName} için ${author} tarafından Rscripts'te paylaşılan script.`;
  const updatedAt =
    stringValue(item.lastUpdatedAt) ||
    stringValue(item.createdAt) ||
    new Date().toISOString();

  return {
    id: `rscripts-${stringValue(item.id) || slug}`,
    slug,
    source: "rscripts",
    sourceLabel: "Rscripts",
    sourceUrl: `https://rscripts.net/script/${encodeURIComponent(slug)}`,
    title: stringValue(item.title) || "İsimsiz script",
    game: gameName,
    gameImage: absoluteImage(game.thumbnailUrl ?? game.logoUrl, "https://rscripts.net"),
    author,
    authorVerified: Boolean(creator.isVerified),
    verified: Boolean(creator.isVerified),
    status: patched ? "patched" : "working",
    premium,
    keyless,
    universal,
    tags,
    views: numberValue(item.views),
    likes,
    dislikes,
    rating: computeRating(likes, dislikes),
    summary,
    code: stringValue(item.script),
    createdAt: stringValue(item.createdAt) || undefined,
    updatedAt,
    categoryIds: [categoryId],
    glyph: glyphFor(gameName, stringValue(item.title), tags),
    colors: patched ? ["#B33A3A", "#4A0000"] : ["#00F0FF", "#0066FF"],
  };
}

async function collectRscripts(key, addScript) {
  const headers = {
    Authorization: `Bearer ${key}`,
    accept: "application/json",
  };

  for (const category of CATEGORIES) {
    const params = rscriptsCategoryParams(category.id);
    if (!params) continue;

    try {
      const payload = await requestJson(
        `${RSCRIPTS}/v1/scripts?${params.toString()}`,
        { headers },
      );
      const items = Array.isArray(payload?.data) ? payload.data : [];

      for (const item of items) {
        let script = normalizeRscripts(item, category.id);
        if (!script) continue;

        if (!script.code && item.rawScript) {
          try {
            script = {
              ...script,
              code: stringValue(await requestText(String(item.rawScript))),
            };
          } catch (error) {
            detailFailures.push(
              `rscripts ${script.slug}: ${error instanceof Error ? error.message : error}`,
            );
          }
        }

        if (!script.code || script.code.length > MAX_CODE_LENGTH) {
          if (script.code.length > MAX_CODE_LENGTH) skippedLargeCode += 1;
          continue;
        }

        addScript(script);
      }
    } catch (error) {
      errors.push(
        `Rscripts ${category.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}

async function main() {
  const scripts = new Map();

  const addScript = (script) => {
    const existing = scripts.get(script.id);
    if (!existing) {
      scripts.set(script.id, script);
      return;
    }

    for (const categoryId of script.categoryIds) {
      if (!existing.categoryIds.includes(categoryId)) {
        existing.categoryIds.push(categoryId);
      }
    }

    if (existing.author === existing.sourceLabel && script.author !== script.sourceLabel) {
      existing.author = script.author;
      existing.authorVerified = script.authorVerified;
    }
  };

  for (const category of CATEGORIES) {
    try {
      const payload = await scriptbloxCategory(category.id);
      const items = Array.isArray(payload?.result?.scripts)
        ? payload.result.scripts
        : [];

      for (const item of items.slice(0, PER_CATEGORY)) {
        const slug = stringValue(item?.slug);
        if (!slug) continue;
        const detail = await scriptbloxDetail(slug);
        const script = normalizeScriptblox(item, detail, category.id);
        if (script) addScript(script);
      }

      console.log(
        `ScriptBlox ${category.id}: ${Math.min(items.length, PER_CATEGORY)} listed`,
      );
    } catch (error) {
      errors.push(
        `ScriptBlox ${category.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const rscriptsKey = (process.env.RSCRIPTS_API_KEY ?? "").trim();
  if (rscriptsKey) {
    await collectRscripts(rscriptsKey, addScript);
  } else {
    console.log("Rscripts skipped: RSCRIPTS_API_KEY is not set");
  }

  if (scripts.size === 0) {
    if (errors.length > 0) {
      console.error(`Source errors:\n- ${errors.join("\n- ")}`);
    }
    throw new Error("No scripts were collected from any source");
  }

  const allScripts = Array.from(scripts.values());
  const categories = CATEGORIES.map((category) => ({
    ...category,
    count: allScripts.filter((script) => script.categoryIds.includes(category.id)).length,
  })).filter((category) => category.count > 0);

  const sourceDefs = [
    { id: "scriptblox", label: "ScriptBlox", url: "https://scriptblox.com" },
    ...(rscriptsKey
      ? [{ id: "rscripts", label: "Rscripts", url: "https://rscripts.net" }]
      : []),
  ];
  const sources = sourceDefs
    .map((source) => ({
      ...source,
      count: allScripts.filter((script) => script.source === source.id).length,
    }))
    .filter((source) => source.count > 0);

  const library = {
    generatedAt: new Date().toISOString(),
    sources,
    categories,
    scripts: allScripts,
  };

  await mkdir("public/data", { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(library, null, 2)}\n`);

  console.log(
    `Wrote ${allScripts.length} scripts (${categories.length} categories) to ${OUTPUT}`,
  );
  if (detailFailures.length > 0) {
    console.warn(`${detailFailures.length} detail request(s) failed; list data used`);
  }
  if (skippedLargeCode > 0) {
    console.warn(`${skippedLargeCode} script(s) skipped because the code was too large`);
  }
  if (errors.length > 0) {
    console.warn(`Source warnings:\n- ${errors.join("\n- ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { readFile, writeFile } from "node:fs/promises";

const SITE_URL = "https://mdcforlegal.github.io/MDC-HUB-V5/";

function validDate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
}

async function lastModified() {
  try {
    const data = JSON.parse(await readFile("data/scripts.json", "utf8"));
    return validDate(data.generatedAt) ?? new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Writes the public sitemap into the Vite output with a fresh lastmod. */
export async function writeSitemap() {
  const lastmod = await lastModified();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  await writeFile("dist/sitemap.xml", xml);
  console.log(`Updated dist/sitemap.xml (lastmod ${lastmod})`);
}

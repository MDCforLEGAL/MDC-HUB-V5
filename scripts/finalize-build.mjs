import { copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { writeSitemap } from "./write-sitemap.mjs";

if (!existsSync("dist/dev.html")) {
  throw new Error("Vite did not emit dist/dev.html. Check the build input in vite.config.ts.");
}

await copyFile("dist/dev.html", "dist/index.html");
await rm("dist/dev.html");
await writeSitemap();
console.log("Prepared dist/index.html");

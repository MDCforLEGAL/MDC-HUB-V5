import { writeFile } from "node:fs/promises";

const headers = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
};

const sources = {
  scriptbloxFetch: "https://scriptblox.com/api/script/fetch?page=1&max=2",
  scriptbloxTrending: "https://scriptblox.com/api/script/trending",
  rscriptsHealth: "https://api.rscripts.net/health",
  rscriptsScripts: "https://api.rscripts.net/v1/scripts?limit=2",
};

const result = {};

for (const [name, url] of Object.entries(sources)) {
  try {
    const response = await fetch(url, { headers, redirect: "follow" });
    const body = await response.text();
    result[name] = {
      status: response.status,
      contentType: response.headers.get("content-type"),
      allowOrigin: response.headers.get("access-control-allow-origin"),
      body: body.slice(0, 1200),
    };
  } catch (error) {
    result[name] = { error: String(error) };
  }
}

await writeFile("probe-result.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

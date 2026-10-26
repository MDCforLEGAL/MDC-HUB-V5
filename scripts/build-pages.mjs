process.env.VITE_BASE_PATH = "/MDC-HUB-V5";

const { build } = await import("vite");
await build();

await import("./finalize-build.mjs");
await import("./publish-root.mjs");

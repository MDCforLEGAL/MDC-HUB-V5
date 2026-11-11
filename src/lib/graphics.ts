export type GraphicsMode = "auto" | "low";

const GRAPHICS_KEY = "mdc-hub.graphics";

export function readGraphicsMode(): GraphicsMode {
  try {
    return window.localStorage.getItem(GRAPHICS_KEY) === "low" ? "low" : "auto";
  } catch {
    return document.documentElement.dataset.graphics === "low" ? "low" : "auto";
  }
}

export function applyGraphicsMode(mode: GraphicsMode): void {
  document.documentElement.dataset.graphics = mode;
  try {
    window.localStorage.setItem(GRAPHICS_KEY, mode);
  } catch {
    // The class still applies for this visit when storage is unavailable.
  }
}

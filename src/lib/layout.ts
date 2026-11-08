export type LayoutMode = "mobile" | "desktop";

const MOBILE_VIEWPORT = "width=device-width, initial-scale=1.0";
const DESKTOP_VIEWPORT = "width=1280";

/**
 * Applies the layout the visitor picked on entry.
 *
 * On phones the desktop choice widens the layout viewport so the normal
 * desktop breakpoints render (the same idea as "request desktop site").
 * Desktop browsers ignore the viewport meta, so their layout is unchanged.
 */
export function applyLayoutMode(mode: LayoutMode): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  meta?.setAttribute("content", mode === "desktop" ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT);
  document.documentElement.dataset.layout = mode;
}

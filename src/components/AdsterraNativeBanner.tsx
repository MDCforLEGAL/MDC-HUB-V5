import { useEffect, useRef, useState } from "react";
import { adsterraNativeBanner } from "../data/ads";
import { useI18n } from "../i18n";
import { X } from "./Icons";

const DISMISS_KEY = "mdc-hub.adsterra-native.dismissed";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;
const LOAD_MARGIN = "320px";
const EMPTY_TIMEOUT_MS = 10000;

function readDismissed(): boolean {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

function safeScriptUrl(value: string): string | null {
  try {
    const url = new URL(value, window.location.href);
    const local =
      url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function AdsterraNativeBanner() {
  const { t } = useI18n();
  const { enabled, scriptSrc, containerId } = adsterraNativeBanner;
  const [dismissed, setDismissed] = useState(readDismissed);
  const [nearViewport, setNearViewport] = useState(false);
  const [failed, setFailed] = useState(false);
  const slotRef = useRef<HTMLElement>(null);

  const safeContainerId = containerId.trim();
  const source =
    enabled && safeContainerId && scriptSrc.trim() ? safeScriptUrl(scriptSrc.trim()) : null;
  const active = Boolean(source && !dismissed && !failed);

  useEffect(() => {
    if (!active || nearViewport) return;
    const node = slotRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: LOAD_MARGIN },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [active, nearViewport]);

  useEffect(() => {
    if (!active || !nearViewport || !source) return;
    const container = document.getElementById(safeContainerId);
    if (!container || container.dataset.adsterraLoaded === "true") return;

    let adFilled = false;
    const fillObserver = new MutationObserver(() => {
      if (Array.from(container.children).some((child) => child.tagName !== "SCRIPT")) {
        adFilled = true;
        fillObserver.disconnect();
      }
    });
    fillObserver.observe(container, { childList: true });

    const emptyTimer = window.setTimeout(() => {
      if (!adFilled) setFailed(true);
    }, EMPTY_TIMEOUT_MS);

    const script = document.createElement("script");
    script.async = true;
    script.dataset.cfasync = "false";
    script.src = source;
    script.addEventListener("error", () => setFailed(true));

    container.dataset.adsterraLoaded = "true";
    container.appendChild(script);

    return () => {
      window.clearTimeout(emptyTimer);
      fillObserver.disconnect();
      script.remove();
      container.replaceChildren();
      delete container.dataset.adsterraLoaded;
    };
  }, [active, nearViewport, safeContainerId, source]);

  if (!active) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage may be unavailable; dismissing still works for this visit.
    }
  };

  return (
    <section ref={slotRef} className="ad-slot container-page" aria-label={t("ad.label")}>
      <div className="ad-slot__head">
        <span>{t("ad.label")}</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("ad.hide")}
          title={t("ad.hide")}
          className="ad-slot__hide"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div id={safeContainerId} className="ad-slot__frame" />
    </section>
  );
}

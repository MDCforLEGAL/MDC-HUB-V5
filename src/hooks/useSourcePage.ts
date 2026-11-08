import { useEffect, useState } from "react";

export const SOURCE_PAGES = ["all", "scriptblox", "mdc", "rscripts", "community"] as const;

export type SourcePageId = (typeof SOURCE_PAGES)[number];

export const SOURCE_PAGE_HREFS: Record<SourcePageId, string> = {
  all: "#/",
  scriptblox: "#/scriptblox",
  mdc: "#/mdc",
  rscripts: "#/rscripts",
  community: "#/community",
};

const HASH_TO_PAGE: Record<string, SourcePageId> = {
  "": "all",
  scriptblox: "scriptblox",
  mdc: "mdc",
  rscripts: "rscripts",
  community: "community",
};

export function readSourcePage(): SourcePageId {
  if (typeof window === "undefined") return "all";
  const slug = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  return HASH_TO_PAGE[slug] ?? "all";
}

export function useSourcePage(): SourcePageId {
  const [page, setPage] = useState<SourcePageId>(() => readSourcePage());

  useEffect(() => {
    const onHashChange = () => setPage(readSourcePage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return page;
}

function readAccountPage(): boolean {
  if (typeof window === "undefined") return false;
  const slug = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  return slug === "account" || slug === "hesap";
}

/** `#/account` opens the account center with level, badges and blue check progress. */
export function useAccountPage(): boolean {
  const [active, setActive] = useState(() => readAccountPage());

  useEffect(() => {
    const onHashChange = () => setActive(readAccountPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return active;
}

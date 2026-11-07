import { useI18n, type MessageKey } from "../i18n";
import { cn } from "../lib/cn";
import { useSourcePage, type SourcePageId } from "../hooks/useSourcePage";

const TABS: Array<{ id: SourcePageId; href: string; labelKey: MessageKey }> = [
  { id: "all", href: "#/", labelKey: "nav.discover" },
  { id: "scriptblox", href: "#/scriptblox", labelKey: "nav.scriptblox" },
  { id: "mdc", href: "#/mdc", labelKey: "nav.mdc" },
  { id: "rscripts", href: "#/rscripts", labelKey: "nav.rscripts" },
  { id: "community", href: "#/community", labelKey: "nav.community" },
];

/** Catalog switcher shown right under the search bar and on every source page. */
export function SourceTabs({ className }: { className?: string }) {
  const { t } = useI18n();
  const page = useSourcePage();

  return (
    <nav
      aria-label={t("nav.catalogs")}
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      {TABS.map((tab) => {
        const active = page === tab.id;
        return (
          <a
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-all duration-300",
              active
                ? "border-neon/40 bg-neon/[0.12] text-neon shadow-[0_0_24px_-10px_rgba(0,240,255,0.9)]"
                : "border-white/[0.08] bg-white/[0.025] text-white/50 hover:border-neon/25 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            {t(tab.labelKey)}
          </a>
        );
      })}
    </nav>
  );
}

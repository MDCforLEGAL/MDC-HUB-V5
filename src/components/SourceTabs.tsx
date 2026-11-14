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

/** Catalog switcher shown under the search bar and on every source page. */
export function SourceTabs({
  className,
  ids,
}: {
  className?: string;
  ids?: readonly SourcePageId[];
}) {
  const { t } = useI18n();
  const page = useSourcePage();
  const tabs = ids ? TABS.filter((tab) => ids.includes(tab.id)) : TABS;

  return (
    <nav aria-label={t("nav.catalogs")} className={cn("source-tabs", className)}>
      {tabs.map((tab) => {
        const active = page === tab.id;
        return (
          <a
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn("source-tab", active && "is-active")}
          >
            {t(tab.labelKey)}
          </a>
        );
      })}
    </nav>
  );
}

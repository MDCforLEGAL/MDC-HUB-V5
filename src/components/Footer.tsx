import type { MouseEvent } from "react";
import { useI18n, type MessageKey } from "../i18n";
import {
  DISCORD_INVITE_URL,
  GITHUB_BRAND_LICENSE_URL,
  GITHUB_ISSUES_URL,
  GITHUB_LEGAL_URL,
  GITHUB_LICENSE_URL,
  GITHUB_REPO_URL,
} from "../lib/links";
import { Logo } from "./Logo";
import {
  ArrowRight,
  ArrowUpRight,
  Discord,
  Github,
  ShieldCheck,
} from "./Icons";

interface FooterLink {
  labelKey: MessageKey;
  href: string;
  external?: boolean;
}

const footerColumns: Array<{ titleKey: MessageKey; links: FooterLink[] }> = [
  {
    titleKey: "footer.platform",
    links: [
      { labelKey: "footer.platformDiscover", href: "#kesfet" },
      { labelKey: "footer.platformCode", href: "#kod" },
      { labelKey: "footer.platformLive", href: "#kesfet" },
    ],
  },
  {
    titleKey: "footer.community",
    links: [
      { labelKey: "footer.communityDiscord", href: DISCORD_INVITE_URL, external: true },
      { labelKey: "footer.communityGuide", href: `${GITHUB_REPO_URL}#readme`, external: true },
      { labelKey: "footer.communityContribute", href: GITHUB_ISSUES_URL, external: true },
    ],
  },
  {
    titleKey: "footer.legal",
    links: [
      { labelKey: "footer.privacy", href: `${GITHUB_LEGAL_URL}#privacy`, external: true },
      { labelKey: "footer.terms", href: `${GITHUB_LEGAL_URL}#terms-of-use`, external: true },
      { labelKey: "footer.disclaimer", href: `${GITHUB_LEGAL_URL}#disclaimer`, external: true },
    ],
  },
];

interface FooterProps {
  onOpenAuth: () => void;
}

function scrollToSection(section: string): void {
  if (section === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const target = document.getElementById(section);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // Code Preview only exists on the main page; return there and continue.
  window.location.hash = "#/";
  window.setTimeout(() => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

export function Footer({ onOpenAuth }: FooterProps) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const onAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    scrollToSection(href.slice(1));
  };

  return (
    <footer id="topluluk" className="site-footer scroll-mt-24">
      <div className="container-page">
        <div className="cta-panel p-7 sm:p-10">
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <span className="section-kicker">{t("footer.kicker")}</span>
              <h2 className="mt-4 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.045em] text-[var(--ink)] sm:text-[2.6rem]">
                {t("footer.titleLead")}
                <span className="text-accent">{t("footer.titleHighlight")}</span>
              </h2>
              <p className="mt-3 max-w-lg text-[0.82rem] leading-relaxed text-[var(--muted)] sm:text-[0.9rem]">
                {t("footer.description")}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-1" aria-hidden="true">
                  {["S", "M", "D", "C"].map((initial, index) => (
                    <span
                      key={initial}
                      className="grid h-6 w-6 place-items-center rounded-full border border-[var(--surface)] bg-[var(--surface-3)] text-[8px] font-semibold text-[var(--muted)]"
                      style={{ zIndex: 4 - index }}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <p className="text-[0.65rem] text-[var(--faint)]">
                  {t("footer.sources", { sources: "ScriptBlox + MDC" })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <button type="button" onClick={onOpenAuth} className="btn btn-primary">
                {t("footer.account")}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <a
                href="#kod"
                onClick={(event) => onAnchorClick(event, "#kod")}
                className="btn btn-secondary"
              >
                {t("footer.inspectCode")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-[var(--line)] pt-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,0.7fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[0.72rem] leading-relaxed text-[var(--muted)]">
              {t("footer.brandDescription")}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1">
              <span className="h-1.5 w-1.5 bg-[var(--info)]" />
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--info)]">
                {t("footer.status")}
              </span>
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.titleKey} aria-label={t(column.titleKey)}>
              <h3 className="footer-heading">{t(column.titleKey)}</h3>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <a
                      href={link.href}
                      onClick={link.external ? undefined : (event) => onAnchorClick(event, link.href)}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="footer-link"
                    >
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer-bottom mt-10 flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem]">
            <span>{t("footer.copyright", { year })}</span>
            <span aria-hidden="true" className="hidden h-2.5 w-px bg-[var(--line)] sm:block" />
            <span>{t("footer.roblox")}</span>
            <span aria-hidden="true" className="hidden h-2.5 w-px bg-[var(--line)] sm:block" />
            <span>{t("footer.thirdParty")}</span>
            <a
              href={GITHUB_LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--accent)]"
            >
              {t("footer.license")}
            </a>
            <a
              href={GITHUB_BRAND_LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--accent)]"
            >
              {t("footer.brandLicense")}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)] sm:flex">
              <ShieldCheck className="h-3 w-3 text-[var(--info)]" />
              {t("footer.sourceTagged")}
            </span>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.discordAria")}
              className="icon-btn h-8 w-8"
            >
              <Discord className="h-3.5 w-3.5" />
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.githubAria")}
              className="icon-btn h-8 w-8"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <a
              href="#top"
              onClick={(event) => onAnchorClick(event, "#top")}
              aria-label={t("footer.topAria")}
              className="icon-btn h-8 w-8"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

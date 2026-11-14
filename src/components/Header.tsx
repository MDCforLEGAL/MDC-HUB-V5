import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";
import { SOURCE_PAGE_HREFS, useSourcePage, type SourcePageId } from "../hooks/useSourcePage";
import { useTheme } from "../hooks/useTheme";
import { SourceTabs } from "./SourceTabs";
import { VerifiedMark } from "./VerifiedMark";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";
import {
  ArrowUpRight,
  ChevronDown,
  Download,
  Globe,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  User,
  X,
} from "./Icons";

const navItems = [
  { labelKey: "nav.discover", href: SOURCE_PAGE_HREFS.all, page: "all" },
  { labelKey: "nav.scriptblox", href: SOURCE_PAGE_HREFS.scriptblox, page: "scriptblox" },
  { labelKey: "nav.mdc", href: SOURCE_PAGE_HREFS.mdc, page: "mdc" },
  { labelKey: "nav.rscripts", href: SOURCE_PAGE_HREFS.rscripts, page: "rscripts" },
  { labelKey: "nav.community", href: SOURCE_PAGE_HREFS.community, page: "community" },
] as const;

const mobileCatalogIds: readonly SourcePageId[] = ["all", "mdc", "community"];

interface HeaderProps {
  onAuth: (mode: "login" | "signup") => void;
  onPublish: () => void;
}

function AccountMenu() {
  const { t } = useI18n();
  const { user, signOut, busy } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.account")}
        className="account-trigger"
      >
        <UserAvatar user={user} className="h-6 w-6" />
        <span className="hidden max-w-[7rem] truncate text-[0.7rem] sm:block">
          {user.displayName}
        </span>
        <VerifiedMark role={user.role} verified={user.verified} className="h-3.5 w-3.5" />
        <ChevronDown
          className={cn("h-3 w-3 text-[var(--faint)] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div role="menu" aria-label={t("nav.account")} className="menu-panel modal-in">
          <div className="menu-panel__head">
            <UserAvatar user={user} className="h-8 w-8" />
            <div className="min-w-0">
              <p className="truncate text-[0.76rem] font-semibold text-[var(--ink)]">
                {user.displayName}
              </p>
              <p className="truncate font-mono text-[0.58rem] text-[var(--faint)]">
                @{user.username}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="mono-label">{t("auth.accountBadge")}</span>
            <span className={cn("role-badge", user.role === "admin" && "role-badge--admin")}>
              {user.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
            </span>
          </div>

          <a role="menuitem" href="#/account" onClick={() => setOpen(false)} className="menu-item">
            <User className="h-3.5 w-3.5" />
            {t("nav.accountPage")}
          </a>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            disabled={busy}
            className="menu-item menu-item--danger disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({ onAuth, onPublish }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const { user, signedIn, signOut, busy } = useAuth();
  const page = useSourcePage();
  const { canPrompt, installed, install } = useInstallPrompt();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [installHint, setInstallHint] = useState(false);
  const [installBusy, setInstallBusy] = useState(false);

  const toggleLocale = () => setLocale(locale === "tr" ? "en" : "tr");

  const requestInstall = async () => {
    if (installBusy) return;
    setInstallBusy(true);
    try {
      const outcome = await install();
      if (outcome === "unavailable") {
        setInstallHint(true);
      } else if (outcome === "accepted" || outcome === "installed") {
        setInstallHint(false);
        setMobileOpen(false);
      }
    } finally {
      setInstallBusy(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const openAuth = (mode: "login" | "signup") => {
    setMobileOpen(false);
    onAuth(mode);
  };

  return (
    <header className={cn("site-header", scrolled && "is-scrolled")}>
      <div className="container-page header-inner">
        <Logo />

        <nav aria-label={t("nav.mainMenu")} className="main-nav">
          {navItems.map((item) => {
            const active = page === item.page;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("nav-link", active && "is-active")}
              >
                {t(item.labelKey)}
              </a>
            );
          })}
        </nav>

        <div className="header-actions">
          {!installed && (
            <div className="header-install relative">
              <button
                type="button"
                onClick={() => void requestInstall()}
                disabled={installBusy}
                aria-expanded={installHint}
                aria-label={t("nav.installApp")}
                title={t("nav.installApp")}
                className="icon-btn"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {installHint && (
                <p
                  role="status"
                  className="menu-panel absolute right-0 top-full z-30 mt-2 w-64 p-3 text-[0.66rem] leading-relaxed text-[var(--muted)]"
                >
                  {t("nav.installSteps")}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("nav.switchToLight") : t("nav.switchToDark")}
            title={theme === "dark" ? t("nav.switchToLight") : t("nav.switchToDark")}
            className="icon-btn header-theme"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "tr" ? t("nav.switchToEnglish") : t("nav.switchToTurkish")}
            title={t("nav.switchLanguage")}
            className="icon-btn header-locale"
          >
            <Globe className="h-3.5 w-3.5" />
          </button>

          {signedIn && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onPublish();
              }}
              aria-label={t("nav.share")}
              title={t("nav.share")}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">{t("nav.share")}</span>
            </button>
          )}

          {signedIn ? (
            <AccountMenu />
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="btn btn-ghost header-login"
              >
                {t("nav.login")}
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="btn btn-secondary header-signup"
              >
                {t("nav.signup")}
                <ArrowUpRight className="h-3 w-3 opacity-50" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            className="icon-btn menu-toggle"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="mobile-menu">
          <div className="container-page space-y-2">
            <SourceTabs ids={mobileCatalogIds} className="mb-3" />

            <button type="button" onClick={toggleTheme} className="mobile-row">
              <span className="flex items-center gap-2">
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {t("nav.theme")}
              </span>
              <span>{theme === "dark" ? t("nav.themeNight") : t("nav.themeLight")}</span>
            </button>

            {signedIn && (
              <a
                href="#/account"
                onClick={() => setMobileOpen(false)}
                className="mobile-row"
              >
                <span className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  {t("nav.accountPage")}
                </span>
                <span>→</span>
              </a>
            )}

            {!installed && (
              <>
                <button
                  type="button"
                  onClick={() => void requestInstall()}
                  disabled={installBusy}
                  className="mobile-row"
                >
                  <span className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5" />
                    {t("nav.installApp")}
                  </span>
                  <span>{canPrompt ? t("nav.installReady") : t("nav.installHintShort")}</span>
                </button>
                {installHint && <p className="mobile-install-hint">{t("nav.installSteps")}</p>}
              </>
            )}

            {signedIn && user ? (
              <div className="mobile-user">
                <a
                  href="#/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <UserAvatar user={user} className="h-8 w-8" />
                  <div className="min-w-0">
                    <p className="truncate text-[0.72rem] font-medium text-[var(--ink)]">
                      {user.displayName}
                    </p>
                    <p className="truncate font-mono text-[0.56rem] text-[var(--faint)]">
                      @{user.username}
                    </p>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut();
                  }}
                  disabled={busy}
                  aria-label={t("auth.signOut")}
                  className="icon-btn disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-3">
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="btn btn-secondary"
                >
                  {t("nav.login")}
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="btn btn-primary"
                >
                  {t("nav.freeSignup")}
                </button>
              </div>
            )}

            <button type="button" onClick={toggleLocale} className="mobile-row">
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                {t("nav.language")}
              </span>
              <span>{locale === "tr" ? t("nav.languageEnglish") : t("nav.languageTurkish")}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

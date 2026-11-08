import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";
import { SOURCE_PAGE_HREFS, useSourcePage } from "../hooks/useSourcePage";
import { SourceTabs } from "./SourceTabs";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  Download,
  Globe,
  LogOut,
  Menu,
  Plus,
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
        className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] py-1.5 pl-1.5 pr-2.5 text-[12px] font-medium text-white/75 transition-all duration-300 hover:border-neon/30 hover:bg-white/[0.06] hover:text-white"
      >
        <UserAvatar user={user} className="h-6 w-6" />
        <span className="hidden max-w-[104px] truncate sm:block">{user.displayName}</span>
        {user.verified && (
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-neon/80" aria-label={t("card.verifiedCommunity")} />
        )}
        <ChevronDown
          className={cn("h-3 w-3 opacity-50 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("nav.account")}
          className="modal-in fixed inset-x-3 top-[4.75rem] z-30 max-h-[calc(100dvh_-_5.75rem)] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#060b13]/97 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95),0_0_60px_-40px_rgba(0,240,255,0.6)] backdrop-blur-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-64 sm:overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] p-3.5">
            <UserAvatar user={user} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-white">{user.displayName}</p>
              <p className="truncate font-mono text-[9.5px] text-white/35">@{user.username}</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/30">
              {t("auth.accountBadge")}
            </span>
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]",
                user.role === "admin"
                  ? "border-[#8B0000]/50 bg-[#4A0000]/45 text-[#ffb3b3]"
                  : "border-white/[0.1] bg-white/[0.04] text-white/45",
              )}
            >
              {user.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
            </span>
          </div>

          <a
            role="menuitem"
            href="#/account"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3.5 py-3 text-[12px] font-medium text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
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
            className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3.5 py-3 text-left text-[12px] font-medium text-white/55 transition-colors hover:bg-[#4A0000]/25 hover:text-[#ffb3b3] disabled:opacity-50"
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
    const onScroll = () => setScrolled(window.scrollY > 16);
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
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div
        className={cn(
          "relative mx-auto flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-500 sm:gap-4 sm:px-5",
          scrolled
            ? "border-white/[0.1] bg-[#060a11]/90 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.95),0_0_0_1px_rgba(0,240,255,0.045)] backdrop-blur-2xl"
            : "border-white/[0.07] bg-[#060a11]/55 backdrop-blur-xl",
        )}
      >
        <Logo />

        <nav
          aria-label={t("nav.mainMenu")}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
        >
          {navItems.map((item) => {
            const active = page === item.page;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors duration-300 hover:text-white",
                  active ? "text-white" : "text-white/55",
                )}
              >
                {t(item.labelKey)}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-px origin-center bg-gradient-to-r from-transparent via-neon/80 to-transparent transition-transform duration-300 group-hover:scale-x-100",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!installed && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => void requestInstall()}
                disabled={installBusy}
                aria-expanded={installHint}
                aria-label={t("nav.installApp")}
                title={t("nav.installApp")}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-2.5 text-white/55 transition-all duration-300 hover:border-neon/25 hover:bg-neon/[0.06] hover:text-neon disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden font-mono text-[9px] font-medium uppercase tracking-[0.08em] xl:inline">
                  {t("nav.installShort")}
                </span>
              </button>
              {installHint && (
                <p
                  role="status"
                  className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-white/[0.1] bg-[#060b13]/97 p-3 text-[11px] leading-relaxed text-white/60 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
                >
                  {t("nav.installSteps")}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "tr" ? t("nav.switchToEnglish") : t("nav.switchToTurkish")}
            title={t("nav.switchLanguage")}
            className="hidden h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-2.5 text-white/55 transition-all duration-300 hover:border-neon/25 hover:bg-neon/[0.06] hover:text-neon sm:inline-flex"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="font-mono text-[9px] font-medium tracking-[0.08em]">
              {locale === "tr" ? "EN" : "TR"}
            </span>
          </button>

          {signedIn ? (
            <AccountMenu />
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="hidden rounded-xl px-3 py-2 text-[12.5px] font-medium text-white/60 transition-colors duration-300 hover:bg-white/[0.05] hover:text-white md:block"
              >
                {t("nav.login")}
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="hidden items-center gap-1 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-[12.5px] font-medium text-white/75 transition-all duration-300 hover:border-neon/30 hover:bg-white/[0.06] hover:text-white md:inline-flex"
              >
                {t("nav.signup")}
                <ArrowUpRight className="h-3 w-3 opacity-50" />
              </button>
            </>
          )}

          {user?.role === "admin" && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onPublish();
              }}
              aria-label={t("nav.share")}
              title={t("nav.share")}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-neon via-[#22D9FF] to-electric px-3 py-2.5 text-[12px] font-semibold text-[#02070c] shadow-[0_8px_28px_-12px_rgba(0,240,255,0.75)] transition-all duration-300 hover:shadow-[0_12px_36px_-10px_rgba(0,240,255,0.9)] sm:px-4 sm:text-[12.5px]"
            >
              <span aria-hidden="true" className="sheen absolute inset-0" />
              <Plus className="relative h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="relative hidden whitespace-nowrap sm:inline">{t("nav.share")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors duration-300 hover:border-neon/30 hover:text-white lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="fade-in mx-auto mt-2 max-w-7xl rounded-2xl border border-white/[0.09] bg-[#060a11]/95 p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:hidden"
        >
          <SourceTabs className="justify-start px-0.5" />

          {signedIn && (
            <a
              href="#/account"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-[12px] text-white/60 transition-colors hover:border-neon/25 hover:text-neon"
            >
              <span className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                {t("nav.accountPage")}
              </span>
              <span aria-hidden="true" className="font-mono text-[9px] text-white/25">
                →
              </span>
            </a>
          )}

          {!installed && (
            <>
              <button
                type="button"
                onClick={() => void requestInstall()}
                disabled={installBusy}
                className="mt-2 flex w-full items-center justify-between rounded-xl border border-neon/20 bg-neon/[0.05] px-3 py-3 text-[13px] text-neon/90 transition-colors hover:bg-neon/[0.1] disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-3.5 w-3.5" />
                  {t("nav.installApp")}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-neon/50">
                  {canPrompt ? t("nav.installReady") : t("nav.installHintShort")}
                </span>
              </button>
              {installHint && (
                <p className="mt-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-white/55">
                  {t("nav.installSteps")}
                </p>
              )}
            </>
          )}

          {signedIn && user ? (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5">
              <a
                href="#/account"
                onClick={() => setMobileOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                <UserAvatar user={user} className="h-8 w-8" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-white/85">{user.displayName}</p>
                  <p className="truncate font-mono text-[9px] text-white/35">@{user.username}</p>
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
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-white/45 transition-colors hover:border-[#8B0000]/45 hover:text-[#ffb3b3] disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-2.5">
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-[12.5px] font-medium text-white/75 transition-colors hover:border-neon/30 hover:text-white"
              >
                {t("nav.login")}
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="rounded-xl border border-neon/25 bg-neon/[0.08] px-3 py-2.5 text-[12.5px] font-semibold text-neon transition-colors hover:bg-neon/[0.14]"
              >
                {t("nav.freeSignup")}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "tr" ? t("nav.switchToEnglish") : t("nav.switchToTurkish")}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[12px] text-white/60 transition-colors hover:border-neon/25 hover:text-neon"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              {t("nav.language")}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em]">
              {locale === "tr" ? t("nav.languageEnglish") : t("nav.languageTurkish")}
            </span>
          </button>
        </div>
      )}
    </header>
  );
}

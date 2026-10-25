import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { Logo } from "./Logo";
import { ArrowUpRight, Menu, Plus, X } from "./Icons";

const navItems = [
  { label: "Keşfet", href: "#kesfet" },
  { label: "Kod Önizleme", href: "#kod" },
  { label: "Topluluk", href: "#topluluk" },
];

interface HeaderProps {
  onAuth: (mode: "login" | "signup") => void;
}

export function Header({ onAuth }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          aria-label="Ana menü"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative rounded-lg px-3 py-2 text-[12.5px] font-medium text-white/55 transition-colors duration-300 hover:text-white"
            >
              {item.label}
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-px h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-neon/80 to-transparent transition-transform duration-300 group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="hidden rounded-xl px-3 py-2 text-[12.5px] font-medium text-white/60 transition-colors duration-300 hover:bg-white/[0.05] hover:text-white md:block"
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="hidden items-center gap-1 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-[12.5px] font-medium text-white/75 transition-all duration-300 hover:border-neon/30 hover:bg-white/[0.06] hover:text-white md:inline-flex"
          >
            Üye Ol
            <ArrowUpRight className="h-3 w-3 opacity-50" />
          </button>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-neon via-[#22D9FF] to-electric px-3 py-2.5 text-[12px] font-semibold text-[#02070c] shadow-[0_8px_28px_-12px_rgba(0,240,255,0.75)] transition-all duration-300 hover:shadow-[0_12px_36px_-10px_rgba(0,240,255,0.9)] sm:px-4 sm:text-[12.5px]"
          >
            <span aria-hidden="true" className="sheen absolute inset-0" />
            <Plus className="relative h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="relative whitespace-nowrap">
              <span className="hidden min-[380px]:inline">Script&nbsp;</span>Paylaş
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
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
          <nav aria-label="Mobil menü" className="flex flex-col">
            {navItems.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-[13px] text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <span>{item.label}</span>
                <span className="font-mono text-[9px] tracking-[0.2em] text-white/20">
                  0{index + 1}
                </span>
              </a>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-2.5">
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-[12.5px] font-medium text-white/75 transition-colors hover:border-neon/30 hover:text-white"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="rounded-xl border border-neon/25 bg-neon/[0.08] px-3 py-2.5 text-[12.5px] font-semibold text-neon transition-colors hover:bg-neon/[0.14]"
            >
              Ücretsiz Üye Ol
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

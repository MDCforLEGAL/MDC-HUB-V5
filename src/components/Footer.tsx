import { Logo } from "./Logo";
import { ArrowRight, ArrowUpRight, Github, MessageCircle, ShieldCheck, Sparkles } from "./Icons";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Script Keşfi", href: "#kesfet" },
      { label: "Kod Önizleme", href: "#kod" },
      { label: "Canlı Kütüphane", href: "#kesfet" },
    ],
  },
  {
    title: "Topluluk",
    links: [
      { label: "Discord Sunucusu", href: "#topluluk" },
      { label: "Geliştirici Rehberi", href: "#kod" },
      { label: "Katkıda Bulun", href: "#topluluk" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Gizlilik", href: "#topluluk" },
      { label: "Kullanım Koşulları", href: "#topluluk" },
      { label: "Sorumluluk Reddi", href: "#topluluk" },
    ],
  },
];

interface FooterProps {
  onOpenAuth: () => void;
}

export function Footer({ onOpenAuth }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer id="topluluk" className="relative scroll-mt-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[linear-gradient(135deg,rgba(0,240,255,0.08),rgba(255,255,255,0.02)_42%,rgba(0,102,255,0.06))] p-7 shadow-[0_30px_90px_-50px_rgba(0,240,255,0.5)] backdrop-blur-2xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.18),transparent_66%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(139,0,0,0.22),transparent_70%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_80%_at_70%_40%,#000,transparent_75%)]"
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-neon/70 to-transparent" />
                <span className="section-kicker text-neon/70">Topluluk</span>
              </div>
              <h2 className="mt-4 font-display text-[28px] font-medium leading-[1.08] tracking-[-0.035em] text-white sm:text-[38px]">
                Kendi scriptini{" "}
                <span className="bg-gradient-to-r from-[#DFFBFF] via-neon to-[#4E86FF] bg-clip-text text-transparent">
                  yayınla.
                </span>
              </h2>
              <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-white/40 sm:text-[13.5px]">
                Küratör ekibi incelemesinden geç, binlerce geliştiriciye ulaş. Yayınlamak
                ücretsiz, erişim her zaman keyless.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2" aria-hidden="true">
                  {["K", "N", "V", "O"].map((initial, index) => (
                    <span
                      key={initial}
                      className="grid h-6 w-6 place-items-center rounded-full border border-[#0a1017] bg-gradient-to-br from-white/20 to-white/[0.04] text-[8px] font-semibold text-white/60"
                      style={{ zIndex: 4 - index }}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <p className="text-[10.5px] text-white/35">
                  <span className="font-medium text-white/60">12.400+</span> geliştirici
                  aramızda
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row lg:shrink-0">
              <button
                type="button"
                onClick={onOpenAuth}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon to-electric px-5 py-3 text-[12px] font-semibold text-[#02070a] shadow-[0_12px_34px_-12px_rgba(0,240,255,0.85)] transition-all duration-300 hover:shadow-[0_16px_42px_-10px_rgba(0,240,255,0.95)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ücretsiz hesap oluştur
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              <a
                href="#kod"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[12px] font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                Kodu incele
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-white/[0.06] pt-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,0.7fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[11.5px] leading-relaxed text-white/40">
              Roblox geliştiricileri için küratörlü, güncel ve güvenli script ekosistemi.
              Cyber-luxury bir deneyim, sıfır gereksiz adım.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/[0.05] px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-neon/50 [animation-duration:2.8s]" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-neon" />
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-neon/70">
                Tüm sistemler çalışıyor
              </span>
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-white/35">
                {column.title}
              </h3>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[11.5px] text-white/50 transition-colors duration-300 hover:text-neon/90"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.06] py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-white/25">
            <span>© {year} MDC HUB. Tüm hakları saklıdır.</span>
            <span aria-hidden="true" className="hidden h-2.5 w-px bg-white/10 sm:block" />
            <span>Roblox Corporation ile bağlantılı değildir.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/20 sm:flex">
              <ShieldCheck className="h-3 w-3 text-neon/40" />
              MDC Verified
            </span>
            <a
              href="#topluluk"
              aria-label="Discord topluluğu"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/30 transition-all duration-300 hover:border-neon/30 hover:text-neon"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
            <a
              href="#topluluk"
              aria-label="GitHub deposu"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/30 transition-all duration-300 hover:border-white/20 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <a
              href="#top"
              aria-label="Sayfa başına dön"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/30 transition-all duration-300 hover:border-neon/30 hover:text-neon"
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

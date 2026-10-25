import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "../lib/cn";
import { Logo } from "./Logo";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, User, X } from "./Icons";

export type AuthMode = "login" | "signup";

interface AuthModalProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}

export function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    const focusTimer = setTimeout(() => emailRef.current?.focus(), 120);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(focusTimer);
    };
  }, [onClose]);

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setError("");
    setSubmitted(false);
    onModeChange(nextMode);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (mode === "signup" && username.trim().length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    if (password.length < (mode === "signup" ? 8 : 6)) {
      setError(
        mode === "signup"
          ? "Şifre en az 8 karakter olmalı."
          : "Şifre en az 6 karakter olmalı.",
      );
      return;
    }

    setError("");
    setSubmitted(true);
  };

  const isSignup = mode === "signup";

  return (
    <div
      className="fade-in fixed inset-0 z-[80] flex items-end justify-center bg-[#02040a]/85 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        tabIndex={-1}
        className="modal-in relative max-h-[94svh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/[0.1] bg-[#060b13]/95 p-6 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),0_0_90px_-50px_rgba(0,240,255,0.55)] backdrop-blur-2xl outline-none sm:rounded-3xl sm:p-7 code-scroll"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Giriş penceresini kapat"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <Logo compact className="w-fit" />

        {submitted ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-neon/30 bg-neon/[0.09] text-neon shadow-[0_0_40px_-14px_rgba(0,240,255,0.8)]">
              <Check className="h-6 w-6" />
            </span>
            <h2 id="auth-title" className="mt-5 font-display text-[23px] font-medium tracking-[-0.02em] text-white">
              Form doğrulandı
            </h2>
            <p className="mx-auto mt-2.5 max-w-xs text-[12px] leading-relaxed text-white/40">
              Bu, MDC HUB&apos;ın ön izleme arayüzüdür. Kimlik doğrulama servisi
              bağlandığında bu akış canlıya alınacak.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-gradient-to-r from-neon to-electric px-4 py-3 text-[12px] font-semibold text-[#02070a] shadow-[0_10px_30px_-12px_rgba(0,240,255,0.8)] transition-all duration-300 hover:shadow-[0_14px_38px_-10px_rgba(0,240,255,0.9)]"
              >
                Anladım
              </button>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[12px] font-medium text-white/55 transition-all duration-300 hover:border-white/20 hover:text-white"
              >
                Düzenle
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2
              id="auth-title"
              className="mt-6 font-display text-[25px] font-medium leading-tight tracking-[-0.025em] text-white"
            >
              {isSignup ? "Ekosisteme katıl." : "Tekrar hoş geldin."}
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">
              {isSignup
                ? "Ücretsiz hesap oluştur, favori scriptlerini senkronize et."
                : "Kütüphanene, favorilerine ve kayıtlı ayarlarına eriş."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1">
              {(["login", "signup"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchMode(item)}
                  aria-pressed={mode === item}
                  className={cn(
                    "rounded-lg py-2 text-[11.5px] font-medium transition-all duration-300",
                    mode === item
                      ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                      : "text-white/35 hover:text-white/65",
                  )}
                >
                  {item === "login" ? "Giriş Yap" : "Üye Ol"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5" noValidate>
              {isSignup && (
                <div>
                  <label
                    htmlFor="auth-username"
                    className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/30"
                  >
                    Kullanıcı adı
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      placeholder="kaizen"
                      className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.03] pl-10 pr-3 text-[12.5px] text-white placeholder:text-white/20 transition-all duration-300 focus:border-neon/45 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-neon/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/30"
                >
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                  <input
                    ref={emailRef}
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="developer@mdchub.dev"
                    className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.03] pl-10 pr-3 text-[12.5px] text-white placeholder:text-white/20 transition-all duration-300 focus:border-neon/45 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-neon/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/30"
                  >
                    Şifre
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => setError("Şifre sıfırlama bu ön izlemede devre dışı.")}
                      className="text-[9.5px] text-neon/60 transition-colors hover:text-neon"
                    >
                      Şifremi unuttum
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? "En az 8 karakter" : "••••••••"}
                    className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.03] pl-10 pr-11 text-[12.5px] text-white placeholder:text-white/20 transition-all duration-300 focus:border-neon/45 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-neon/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/70"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-blood/35 bg-blood-deep/30 px-3 py-2 text-[10.5px] leading-relaxed text-[#ffb3b3]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="group mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon to-electric text-[12px] font-semibold text-[#02070a] shadow-[0_10px_30px_-12px_rgba(0,240,255,0.8)] transition-all duration-300 hover:shadow-[0_14px_38px_-10px_rgba(0,240,255,0.95)]"
              >
                {isSignup ? "Ücretsiz Hesap Oluştur" : "Giriş Yap"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[9px] leading-relaxed text-white/22">
              <ShieldCheck className="h-3 w-3 text-neon/40" />
              Devam ederek Kullanım Koşulları&apos;nı kabul etmiş olursun.
            </p>

            <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/20">
                MDC HUB · Cyber-Luxury Script Ecosystem
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";
import { AlertTriangle, ArrowRight, Check, Discord, Loader, LogOut, ShieldCheck, X } from "./Icons";

export type AuthMode = "login" | "signup";

interface AuthModalProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}

interface NoticeProps {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
}

function Notice({ icon, title, body, children }: NoticeProps) {
  return (
    <div className="py-5">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#8B0000]/40 bg-[#4A0000]/35 text-[#ff9d9d] shadow-[0_0_40px_-18px_rgba(139,0,0,0.9)]">
        {icon}
      </span>
      <h2
        id="auth-title"
        className="mt-4 text-center font-display text-[20px] font-medium leading-tight tracking-[-0.02em] text-white"
      >
        {title}
      </h2>
      <p className="mt-2 text-center text-[11.5px] leading-relaxed text-white/45">{body}</p>
      {children}
    </div>
  );
}

export function AuthModal({ mode, onClose }: AuthModalProps) {
  const { t } = useI18n();
  const { status, user, health, error, errorDetail, busy, signIn, signOut } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const isSignup = mode === "signup";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const callbackMessage =
    errorDetail === "cancelled"
      ? t("auth.errorCancelled")
      : errorDetail === "state"
        ? t("auth.errorState")
        : errorDetail === "server" || errorDetail === "config"
          ? t("auth.errorServer")
          : errorDetail === "invalid_code"
            ? t("auth.errorExpired")
            : t("auth.callbackFailed");

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
        className="modal-in code-scroll relative max-h-[94svh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/[0.1] bg-[#060b13]/95 p-6 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),0_0_90px_-50px_rgba(0,240,255,0.55)] backdrop-blur-2xl outline-none sm:rounded-3xl sm:p-7"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("auth.closeAria")}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <Logo compact className="w-fit" />

        {status === "loading" && (
          <div className="py-12 text-center" aria-live="polite">
            <Loader className="mx-auto h-6 w-6 animate-spin text-neon/70" />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              {t("auth.loading")}
            </p>
          </div>
        )}

        {status !== "loading" && user && (
          <div className="pt-6">
            <p className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-neon/60">
              {t("auth.signedInTitle")}
            </p>
            <div className="mt-3.5 flex items-center gap-3.5">
              <UserAvatar user={user} className="h-14 w-14 text-[18px]" />
              <div className="min-w-0">
                <h2
                  id="auth-title"
                  className="truncate font-display text-[21px] font-medium leading-tight tracking-[-0.02em] text-white"
                >
                  {user.displayName}
                </h2>
                <p className="truncate font-mono text-[10.5px] text-white/35">@{user.username}</p>
              </div>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-white/45">{t("auth.signedInBody")}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/20 bg-neon/[0.06] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-neon/75">
                <Discord className="h-2.5 w-2.5" />
                {t("auth.accountBadge")}
              </span>
              <span
                className={
                  user.role === "admin"
                    ? "rounded-full border border-[#8B0000]/50 bg-[#4A0000]/45 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#ffb3b3]"
                    : "rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/45"
                }
              >
                {user.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
              </span>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[12px] font-medium text-white/70 transition-all duration-300 hover:border-[#8B0000]/45 hover:bg-[#4A0000]/25 hover:text-[#ffb3b3] disabled:opacity-50"
              >
                {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                {t("auth.signOut")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-neon to-electric px-5 py-3 text-[12px] font-semibold text-[#02070a] shadow-[0_10px_30px_-12px_rgba(0,240,255,0.8)] transition-all duration-300 hover:shadow-[0_14px_38px_-10px_rgba(0,240,255,0.95)]"
              >
                {t("auth.close")}
              </button>
            </div>
          </div>
        )}

        {status === "unconfigured" && (
          <Notice icon={<AlertTriangle className="h-5 w-5" />} title={t("auth.notConfiguredTitle")} body={t("auth.notConfiguredBody")}>
            <code className="mt-4 block rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-[9.5px] leading-relaxed text-neon/70">
              public/config.json → {'{ "apiBaseUrl": "https://…workers.dev" }'}
            </code>
          </Notice>
        )}

        {status === "unavailable" && (
          <Notice icon={<AlertTriangle className="h-5 w-5" />} title={t("auth.offlineTitle")} body={t("auth.offlineBody")}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mx-auto mt-5 block rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[11.5px] font-medium text-white/70 transition-all duration-300 hover:border-neon/30 hover:text-white"
            >
              {t("auth.retry")}
            </button>
          </Notice>
        )}

        {status === "signed-out" && !health?.discord && (
          <Notice
            icon={<Discord className="h-5 w-5" />}
            title={t("auth.discordMissingTitle")}
            body={t("auth.discordMissingBody")}
          >
            <code className="mt-4 block rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-[9.5px] leading-relaxed text-neon/70">
              DISCORD_CLIENT_ID · DISCORD_CLIENT_SECRET
            </code>
          </Notice>
        )}

        {status === "signed-out" && health?.discord && (
          <div className="pt-5">
            <h2
              id="auth-title"
              className="mt-1 font-display text-[25px] font-medium leading-tight tracking-[-0.025em] text-white"
            >
              {isSignup ? t("auth.signupTitle") : t("auth.loginTitle")}
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">
              {isSignup ? t("auth.signupSubtitle") : t("auth.loginSubtitle")}
            </p>

            {error === "callback" && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-blood/35 bg-blood-deep/30 px-3 py-2 text-[10.5px] leading-relaxed text-[#ffb3b3]"
              >
                {callbackMessage}
              </p>
            )}

            <button
              type="button"
              onClick={signIn}
              disabled={busy}
              className="group mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-neon via-[#22D9FF] to-electric px-4 text-[12.5px] font-semibold text-[#02070a] shadow-[0_12px_34px_-12px_rgba(0,240,255,0.85)] transition-all duration-300 hover:shadow-[0_16px_42px_-10px_rgba(0,240,255,0.95)] disabled:opacity-70"
            >
              {busy ? (
                <Loader className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : (
                <Discord className="h-4 w-4" />
              )}
              {busy
                ? t("auth.redirecting")
                : isSignup
                  ? t("auth.discordCtaSignup")
                  : t("auth.discordCta")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>

            <p className="mt-2.5 text-center text-[10px] leading-relaxed text-white/30">
              {t("auth.discordHint")}
            </p>

            <ul className="mt-5 space-y-2.5">
              {[t("auth.perkNoEmail"), t("auth.perkInstant"), t("auth.perkProfile")].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-white/50">
                  <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full border border-neon/25 bg-neon/[0.08] text-neon">
                    <Check className="h-2.5 w-2.5" strokeWidth={2.8} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-black/25 p-3">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-neon/45" />
              <p className="text-[10px] leading-relaxed text-white/35">{t("auth.privacy")}</p>
            </div>

            <p className="mt-4 text-center text-[9px] leading-relaxed text-white/25">{t("auth.terms")}</p>

            <div className="mt-4 border-t border-white/[0.06] pt-3.5 text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/20">
                {t("auth.secureNote")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

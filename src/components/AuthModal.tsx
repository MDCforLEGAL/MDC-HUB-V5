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
      <span className="mx-auto grid h-11 w-11 place-items-center border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <h2
        id="auth-title"
        className="mt-4 text-center font-display text-[1.3rem] font-bold leading-tight tracking-[-0.035em] text-[var(--ink)]"
      >
        {title}
      </h2>
      <p className="mt-2 text-center text-[0.74rem] leading-relaxed text-[var(--muted)]">{body}</p>
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
      className="modal-overlay fade-in fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
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
        className="modal-panel modal-in code-scroll relative max-h-[94svh] w-full max-w-md overflow-y-auto p-6 outline-none sm:p-7"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-[var(--accent)]"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("auth.closeAria")}
          className="icon-btn absolute right-4 top-4"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <Logo className="w-fit" />

        {status === "loading" && (
          <div className="py-12 text-center" aria-live="polite">
            <Loader className="mx-auto h-6 w-6 animate-spin text-[var(--info)]" />
            <p className="mt-4 font-mono text-[0.58rem] uppercase tracking-[0.07em] text-[var(--muted)]">
              {t("auth.loading")}
            </p>
          </div>
        )}

        {status !== "loading" && user && (
          <div className="pt-6">
            <p className="section-kicker">
              {t("auth.signedInTitle")}
            </p>
            <div className="mt-3.5 flex items-center gap-3.5">
              <UserAvatar user={user} className="h-14 w-14 text-[18px]" />
              <div className="min-w-0">
                <h2
                  id="auth-title"
                  className="truncate font-display text-[1.35rem] font-bold leading-tight tracking-[-0.03em] text-[var(--ink)]"
                >
                  {user.displayName}
                </h2>
                <p className="truncate font-mono text-[0.62rem] text-[var(--muted)]">@{user.username}</p>
              </div>
            </div>

            <p className="mt-4 text-[0.76rem] leading-relaxed text-[var(--muted)]">{t("auth.signedInBody")}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 border border-[var(--info)] bg-[var(--info-soft)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--info)]">
                <Discord className="h-2.5 w-2.5" />
                {t("auth.accountBadge")}
              </span>
              <span
                className={
                  user.role === "admin"
                    ? "border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--accent)]"
                    : "border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--muted)]"
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
                className="btn btn-secondary flex-1 disabled:opacity-50"
              >
                {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                {t("auth.signOut")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
              >
                {t("auth.close")}
              </button>
            </div>
          </div>
        )}

        {status === "unconfigured" && (
          <Notice icon={<AlertTriangle className="h-5 w-5" />} title={t("auth.notConfiguredTitle")} body={t("auth.notConfiguredBody")}>
            <code data-keep-dark className="code-note mt-4 block">
              public/config.json → {'{ "apiBaseUrl": "https://…workers.dev" }'}
            </code>
          </Notice>
        )}

        {status === "unavailable" && (
          <Notice icon={<AlertTriangle className="h-5 w-5" />} title={t("auth.offlineTitle")} body={t("auth.offlineBody")}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-secondary mx-auto mt-5"
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
            <code data-keep-dark className="code-note mt-4 block">
              DISCORD_CLIENT_ID · DISCORD_CLIENT_SECRET
            </code>
          </Notice>
        )}

        {status === "signed-out" && health?.discord && (
          <div className="pt-5">
            <h2
              id="auth-title"
              className="mt-1 font-display text-[1.6rem] font-bold leading-tight tracking-[-0.04em] text-[var(--ink)]"
            >
              {isSignup ? t("auth.signupTitle") : t("auth.loginTitle")}
            </h2>
            <p className="mt-1.5 text-[0.76rem] leading-relaxed text-[var(--muted)]">
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
              className="btn btn-primary group mt-5 h-12 w-full disabled:opacity-70"
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

            <p className="mt-2.5 text-center text-[0.66rem] leading-relaxed text-[var(--faint)]">
              {t("auth.discordHint")}
            </p>

            <ul className="mt-5 space-y-2.5">
              {[t("auth.perkNoEmail"), t("auth.perkInstant"), t("auth.perkProfile")].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.74rem] leading-relaxed text-[var(--ink-soft)]">
                  <span className="mt-px grid h-4 w-4 shrink-0 place-items-center border border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)]">
                    <Check className="h-2.5 w-2.5" strokeWidth={2.8} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-2.5 border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--info)]" />
              <p className="text-[0.66rem] leading-relaxed text-[var(--muted)]">{t("auth.privacy")}</p>
            </div>

            <p className="mt-4 text-center text-[0.6rem] leading-relaxed text-[var(--faint)]">{t("auth.terms")}</p>

            <div className="mt-4 border-t border-[var(--line)] pt-3.5 text-center">
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
                {t("auth.secureNote")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

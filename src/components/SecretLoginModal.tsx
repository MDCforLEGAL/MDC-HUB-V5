import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import { ApiError } from "../lib/api";
import { KeyRound, Loader, X } from "./Icons";

interface SecretLoginModalProps {
  onClose: () => void;
  onNotify: (message: string) => void;
}

export function SecretLoginModal({ onClose, onNotify }: SecretLoginModalProps) {
  const { t } = useI18n();
  const { secretSignIn } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = code.trim();
    if (!value || busy) return;

    setBusy(true);
    setError(null);
    try {
      await secretSignIn(value);
      onNotify(t("secret.success"));
      onClose();
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 429) {
        setError(t("secret.rateLimited"));
      } else if (reason instanceof ApiError && reason.status === 503) {
        setError(t("secret.notConfigured"));
      } else {
        setError(t("secret.invalid"));
      }
    } finally {
      setBusy(false);
    }
  };

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
        aria-labelledby="secret-login-title"
        tabIndex={-1}
        className="modal-panel modal-in relative w-full max-w-sm p-6 outline-none sm:p-7"
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[var(--info)]" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("secret.close")}
          className="icon-btn absolute right-4 top-4"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <span className="grid h-10 w-10 place-items-center border border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)]">
          <KeyRound className="h-4 w-4" />
        </span>
        <p className="mt-4 section-kicker">{t("secret.kicker")}</p>
        <h2
          id="secret-login-title"
          className="mt-2 font-display text-[1.35rem] font-bold leading-tight tracking-[-0.03em] text-[var(--ink)]"
        >
          {t("secret.title")}
        </h2>
        <p className="mt-2 text-[0.72rem] leading-relaxed text-[var(--muted)]">
          {t("secret.description")}
        </p>

        <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-3">
          <div>
            <label className="field-label" htmlFor="secret-login-code">
              {t("secret.codeLabel")}
            </label>
            <input
              ref={inputRef}
              id="secret-login-code"
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value.slice(0, 256))}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={256}
              placeholder={t("secret.placeholder")}
              className="field mt-1.5 font-mono"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-[0.68rem] text-[var(--accent)]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            {busy ? t("secret.submitting") : t("secret.submit")}
          </button>
        </form>

        <p className="mt-4 font-mono text-[0.52rem] uppercase leading-relaxed tracking-[0.05em] text-[var(--faint)]">
          {t("secret.hint")}
        </p>
      </div>
    </div>
  );
}

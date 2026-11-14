import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import {
  ApiError,
  getStoredToken,
  publishCommunityScript,
  type ScriptSection,
} from "../lib/api";
import { cn } from "../lib/cn";
import { Loader, X } from "./Icons";

interface PublishScriptModalProps {
  onClose: () => void;
  onPublished: () => void;
  onNotify: (message: string) => void;
}

const inputClass = "field";

export function PublishScriptModal({ onClose, onPublished, onNotify }: PublishScriptModalProps) {
  const { t } = useI18n();
  const { signedIn, signIn, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [section, setSection] = useState<ScriptSection>(isAdmin ? "mdc" : "community");
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!signedIn) {
      signIn();
      return;
    }

    const token = getStoredToken();
    if (!token) {
      signIn();
      return;
    }

    if (title.trim().length < 3 || game.trim().length < 2 || code.trim().length < 10) {
      setError(t("publish.required"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await publishCommunityScript(token, {
        section,
        title: title.trim(),
        game: game.trim(),
        description: description.trim(),
        code,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 5),
      });
      onPublished();
    } catch (caught) {
      const message =
        caught instanceof ApiError && caught.message ? caught.message : t("publish.failed");
      setError(message);
      onNotify(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-overlay fade-in fixed inset-0 z-[75] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-title"
        tabIndex={-1}
        onSubmit={submit}
        className="modal-panel modal-in relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden outline-none sm:max-h-[88vh]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-[var(--accent)]"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("publish.cancel")}
          className="icon-btn absolute right-4 top-4 z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="code-scroll flex-1 overflow-y-auto p-5 pr-14 sm:p-7 sm:pr-16">
          <p className="section-kicker">
            {t("publish.kicker")}
          </p>
          <h2
            id="publish-title"
            className="mt-2 font-display text-[1.45rem] font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-[1.7rem]"
          >
            {t("publish.title")}
          </h2>
          <p className="mt-2 text-[0.74rem] leading-relaxed text-[var(--muted)]">{t("publish.subtitle")}</p>

          {isAdmin ? (
            <div className="mt-4">
              <span className="field-label mb-1.5">
                {t("publish.sectionLabel")}
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSection("mdc")}
                  aria-pressed={section === "mdc"}
                  className={cn(
                    "border px-3 py-2.5 text-left transition-colors",
                    section === "mdc"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[11.5px] font-medium",
                      section === "mdc" ? "text-[var(--accent)]" : "text-[var(--ink-soft)]",
                    )}
                  >
                    {t("publish.sectionMdc")}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-white/35">
                    {t("publish.sectionMdcDesc")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSection("community")}
                  aria-pressed={section === "community"}
                  className={cn(
                    "border px-3 py-2.5 text-left transition-colors",
                    section === "community"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[11.5px] font-medium",
                      section === "community" ? "text-[var(--accent)]" : "text-[var(--ink-soft)]",
                    )}
                  >
                    {t("publish.sectionCommunity")}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-white/35">
                    {t("publish.sectionCommunityDesc")}
                  </span>
                </button>
              </div>
              <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">
                {t("publish.sectionHint")}
              </p>
            </div>
          ) : (
            <div className="mt-4 border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2.5">
              <p className="text-[0.74rem] font-semibold text-[var(--accent)]">
                {t("publish.sectionCommunity")}
              </p>
              <p className="mt-0.5 text-[0.66rem] leading-relaxed text-[var(--muted)]">
                {t("publish.memberNote")}
              </p>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label mb-1.5">
                {t("publish.game")}
              </span>
              <input
                value={game}
                onChange={(event) => setGame(event.target.value)}
                placeholder={t("publish.gamePlaceholder")}
                maxLength={80}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="field-label mb-1.5">
                {t("publish.name")}
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("publish.namePlaceholder")}
                maxLength={140}
                className={inputClass}
              />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="field-label mb-1.5">
              {t("publish.description")}
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={600}
              className={inputClass}
            />
          </label>

          <label className="mt-3 block">
            <span className="field-label mb-1.5">
              {t("publish.tagsField")}
            </span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Auto Farm, ESP, Keyless"
              className={inputClass}
            />
          </label>

          <label className="mt-3 block">
            <span className="field-label mb-1.5">
              {t("publish.codeField")}
            </span>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={'-- loadstring(game:HttpGet("..."))()'}
              className="field resize-y font-mono"
            />
          </label>

          <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
            {t("publish.hint")}
          </p>
          <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--accent)]">
            {t("publish.verifiedHint", { count: 5 })}
          </p>

          {error && (
            <p className="mt-3 rounded-lg border border-blood/35 bg-blood-deep/30 px-3 py-2 text-[11px] text-[#ffb3b3]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--line)] bg-[var(--surface-2)] p-4 sm:px-6">
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary flex-1 disabled:opacity-50 sm:flex-none"
          >
            {busy && <Loader className="h-4 w-4 animate-spin" />}
            {busy ? t("publish.submitting") : t("publish.submit")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            {t("publish.cancel")}
          </button>
          {!signedIn && (
            <span className="ml-auto hidden text-[10px] text-white/30 sm:block">
              {t("social.signInToVote")}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

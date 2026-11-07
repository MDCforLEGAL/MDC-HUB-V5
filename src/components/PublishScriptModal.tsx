import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import { ApiError, getStoredToken, publishCommunityScript } from "../lib/api";
import { Loader, X } from "./Icons";

interface PublishScriptModalProps {
  onClose: () => void;
  onPublished: () => void;
  onNotify: (message: string) => void;
}

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-[12px] text-white/85 placeholder:text-white/25 focus:border-neon/35 focus:outline-none";

export function PublishScriptModal({ onClose, onPublished, onNotify }: PublishScriptModalProps) {
  const { t } = useI18n();
  const { signedIn, signIn } = useAuth();
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
      className="fade-in fixed inset-0 z-[75] flex items-end justify-center bg-[#02040a]/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
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
        className="modal-in relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#060b13]/95 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),0_0_80px_-50px_rgba(0,240,255,0.5)] backdrop-blur-2xl outline-none sm:max-h-[88vh] sm:rounded-3xl"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("publish.cancel")}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="code-scroll flex-1 overflow-y-auto p-5 pr-14 sm:p-7 sm:pr-16">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-neon/70">
            {t("publish.kicker")}
          </p>
          <h2
            id="publish-title"
            className="mt-2 font-display text-[22px] font-medium tracking-[-0.02em] text-white sm:text-[26px]"
          >
            {t("publish.title")}
          </h2>
          <p className="mt-2 text-[11.5px] leading-relaxed text-white/45">{t("publish.subtitle")}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/30">
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
              <span className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/30">
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
            <span className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/30">
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
            <span className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/30">
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
            <span className="mb-1.5 block font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/30">
              {t("publish.codeField")}
            </span>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={'-- loadstring(game:HttpGet("..."))()'}
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-[#04080e]/80 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-white/80 placeholder:text-white/20 focus:border-neon/35 focus:outline-none"
            />
          </label>

          <p className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/20">
            {t("publish.hint")}
          </p>
          <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-neon/45">
            {t("publish.verifiedHint", { count: 5 })}
          </p>

          {error && (
            <p className="mt-3 rounded-lg border border-blood/35 bg-blood-deep/30 px-3 py-2 text-[11px] text-[#ffb3b3]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-xl sm:px-6">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon to-electric px-4 py-3 text-[12px] font-semibold text-[#02070a] shadow-[0_10px_30px_-12px_rgba(0,240,255,0.8)] transition-opacity duration-300 disabled:opacity-50 sm:flex-none"
          >
            {busy && <Loader className="h-4 w-4 animate-spin" />}
            {busy ? t("publish.submitting") : t("publish.submit")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[12px] font-medium text-white/55 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white sm:flex-none"
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

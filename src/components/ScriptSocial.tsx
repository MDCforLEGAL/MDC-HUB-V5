import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import { cn } from "../lib/cn";
import { formatCompact, timeAgo } from "../lib/format";
import {
  ApiError,
  deleteComment,
  fetchComments,
  fetchSocial,
  getStoredToken,
  moderateComment,
  postComment,
  reactToScript,
  type ScriptComment,
  type ScriptSocialState,
} from "../lib/api";
import { Eye, EyeOff, Loader, MessageCircle, Send } from "./Icons";
import { VerifiedMark } from "./VerifiedMark";

function ThumbsUp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 10v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Z" />
      <path d="M7 10l4.2-6.2a1.6 1.6 0 0 1 2.9.9V9h4.1a2 2 0 0 1 2 2.4l-1.3 6.5A2 2 0 0 1 16.9 20H7" />
    </svg>
  );
}

function ThumbsDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 14V4h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3Z" />
      <path d="M17 14l-4.2 6.2a1.6 1.6 0 0 1-2.9-.9V15H5.8a2 2 0 0 1-2-2.4l1.3-6.5A2 2 0 0 1 7.1 4H17" />
    </svg>
  );
}

interface ScriptSocialProps {
  scriptId: string;
  fallbackLikes?: number;
  onNotify: (message: string) => void;
}

const COMMENT_MAX = 600;

export function ScriptSocial({ scriptId, fallbackLikes, onNotify }: ScriptSocialProps) {
  const { t, locale } = useI18n();
  const { signedIn, signIn, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [social, setSocial] = useState<ScriptSocialState>({
    likes: fallbackLikes ?? 0,
    dislikes: 0,
    comments: 0,
    mine: 0,
  });
  const [comments, setComments] = useState<ScriptComment[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [moderating, setModerating] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const [snapshot, list] = await Promise.all([
          fetchSocial([scriptId], getStoredToken(), controller.signal),
          fetchComments(scriptId, getStoredToken(), controller.signal),
        ]);
        if (!active) return;
        const entry = snapshot[scriptId];
        if (entry) setSocial(entry);
        setComments(list);
      } catch {
        // Offline or API not configured: keep the static numbers.
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [scriptId, user?.id]);

  const react = useCallback(
    async (value: 1 | -1) => {
      if (!signedIn) {
        onNotify(t("social.signInToVote"));
        signIn();
        return;
      }

      const token = getStoredToken();
      if (!token || pending) return;

      setPending(true);
      try {
        const next = await reactToScript(token, scriptId, social.mine === value ? 0 : value);
        setSocial(next);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          onNotify(t("social.signInToVote"));
          signIn();
        } else {
          onNotify(t("social.error"));
        }
      } finally {
        setPending(false);
      }
    },
    [onNotify, pending, scriptId, signedIn, signIn, social.mine, t],
  );

  const submit = useCallback(async () => {
    const body = draft.trim();
    if (body.length === 0) return;

    if (!signedIn) {
      onNotify(t("social.signInToVote"));
      signIn();
      return;
    }
    if (body.length > COMMENT_MAX) {
      onNotify(t("social.commentTooLong"));
      return;
    }

    const token = getStoredToken();
    if (!token || sending) return;

    setSending(true);
    try {
      const comment = await postComment(token, scriptId, body);
      setComments((previous) => [comment, ...previous]);
      setSocial((previous) => ({ ...previous, comments: previous.comments + 1 }));
      setDraft("");
    } catch {
      onNotify(t("social.commentError"));
    } finally {
      setSending(false);
    }
  }, [draft, onNotify, scriptId, sending, signedIn, signIn, t]);

  const remove = useCallback(
    async (id: string) => {
      const token = getStoredToken();
      if (!token) return;

      const target = comments.find((comment) => comment.id === id);

      try {
        await deleteComment(token, id);
        setComments((previous) => previous.filter((comment) => comment.id !== id));
        setSocial((previous) => ({
          ...previous,
          comments: Math.max(0, previous.comments - (target?.hidden ? 0 : 1)),
        }));
      } catch {
        onNotify(t("social.commentError"));
      }
    },
    [comments, onNotify, t],
  );

  const toggleVisibility = useCallback(
    async (comment: ScriptComment) => {
      const token = getStoredToken();
      if (!token || moderating) return;

      const nextHidden = !comment.hidden;
      setModerating(comment.id);
      try {
        await moderateComment(token, comment.id, nextHidden);
        setComments((previous) =>
          previous.map((item) =>
            item.id === comment.id ? { ...item, hidden: nextHidden } : item,
          ),
        );
        setSocial((previous) => ({
          ...previous,
          comments: Math.max(0, previous.comments + (nextHidden ? -1 : 1)),
        }));
        onNotify(t(nextHidden ? "social.commentHidden" : "social.commentVisible"));
      } catch {
        onNotify(t("social.moderationError"));
      } finally {
        setModerating(null);
      }
    },
    [moderating, onNotify, t],
  );

  return (
    <div className="mt-6 border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => void react(1)}
          aria-pressed={social.mine === 1}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.68rem] font-semibold transition-colors disabled:opacity-60",
            social.mine === 1
              ? "border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)]"
              : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {t("social.like")}
          <span className="font-mono text-[9.5px] opacity-70">
            {formatCompact(social.likes, locale)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void react(-1)}
          aria-pressed={social.mine === -1}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.68rem] font-semibold transition-colors disabled:opacity-60",
            social.mine === -1
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          {t("social.dislike")}
          <span className="font-mono text-[9.5px] opacity-70">
            {formatCompact(social.dislikes, locale)}
          </span>
        </button>

        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
          <MessageCircle className="h-3 w-3" />
          {t("social.comments")}
          <span className="text-white/45">{social.comments}</span>
        </span>
      </div>

      <div className="px-3.5 py-3">
        <div className="flex items-start gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, COMMENT_MAX))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={2}
            maxLength={COMMENT_MAX}
            placeholder={t("social.commentPlaceholder")}
            className="field min-h-[42px] flex-1 resize-y"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={sending || draft.trim().length === 0}
            className="btn btn-primary btn-sm h-[42px] shrink-0 disabled:opacity-40"
          >
            {sending ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {t("social.commentSend")}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {comments.length === 0 ? (
            <p className="py-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/20">
              {t("social.noComments")}
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "flex items-start gap-2 border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-2",
                  comment.hidden && "border-[var(--accent)] opacity-75",
                )}
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-[var(--line)] bg-[var(--surface-3)] text-[0.58rem] font-semibold uppercase text-[var(--ink-soft)]">
                  {comment.author.displayName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                    <span className="font-semibold text-[var(--ink)]">{comment.author.displayName}</span>
                    <VerifiedMark
                      role={comment.author.role}
                      verified={comment.author.verified}
                      className="h-3 w-3"
                    />
                    <span className="font-mono text-[0.52rem] uppercase tracking-[0.05em] text-[var(--faint)]">
                      {timeAgo(comment.createdAt, locale)}
                    </span>
                    {comment.hidden && (
                      <span className="border border-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.05em] text-[var(--accent)]">
                        {t("social.hidden")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[0.72rem] leading-relaxed text-[var(--ink-soft)]">
                    {comment.body}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void toggleVisibility(comment)}
                      disabled={moderating === comment.id}
                      className="inline-flex items-center gap-1 px-1.5 py-1 text-[0.58rem] text-[var(--faint)] transition-colors hover:text-[var(--accent)] disabled:opacity-40"
                    >
                      {comment.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {comment.hidden ? t("social.unhide") : t("social.hide")}
                    </button>
                  )}
                  {comment.mine && (
                    <button
                      type="button"
                      onClick={() => void remove(comment.id)}
                      className="px-1.5 py-1 text-[0.58rem] text-[var(--faint)] transition-colors hover:text-[var(--accent)]"
                    >
                      {t("social.delete")}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

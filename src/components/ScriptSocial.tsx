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
import { BadgeCheck, Eye, EyeOff, Loader, MessageCircle, Send } from "./Icons";

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
    <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#04080e]/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => void react(1)}
          aria-pressed={social.mine === 1}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-300 disabled:opacity-60",
            social.mine === 1
              ? "border-neon/40 bg-neon/[0.12] text-neon"
              : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-neon/30 hover:text-white",
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
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-300 disabled:opacity-60",
            social.mine === -1
              ? "border-blood/55 bg-blood-deep/60 text-[#ffb3b3]"
              : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-blood/40 hover:text-white",
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          {t("social.dislike")}
          <span className="font-mono text-[9.5px] opacity-70">
            {formatCompact(social.dislikes, locale)}
          </span>
        </button>

        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/25">
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
            className="min-h-[42px] flex-1 resize-y rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-[11.5px] text-white/80 placeholder:text-white/25 focus:border-neon/35 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={sending || draft.trim().length === 0}
            className="inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-neon to-electric px-3 text-[11px] font-semibold text-[#02070a] transition-opacity duration-300 disabled:opacity-40"
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
                  "flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2",
                  comment.hidden && "border-blood/25 bg-blood-deep/10 opacity-75",
                )}
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-white/20 to-white/[0.04] text-[9px] font-semibold uppercase text-white/65">
                  {comment.author.displayName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                    <span className="font-medium text-white/70">{comment.author.displayName}</span>
                    {comment.author.verified && (
                      <BadgeCheck
                        className="h-3 w-3 text-neon/80"
                        aria-label={t("card.verifiedCommunity")}
                      />
                    )}
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">
                      {timeAgo(comment.createdAt, locale)}
                    </span>
                    {comment.hidden && (
                      <span className="rounded border border-blood/30 bg-blood-deep/25 px-1.5 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.14em] text-[#ffb3b3]">
                        {t("social.hidden")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11.5px] leading-relaxed text-white/60">
                    {comment.body}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void toggleVisibility(comment)}
                      disabled={moderating === comment.id}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[9.5px] text-white/35 transition-colors hover:text-neon disabled:opacity-40"
                    >
                      {comment.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {comment.hidden ? t("social.unhide") : t("social.hide")}
                    </button>
                  )}
                  {comment.mine && (
                    <button
                      type="button"
                      onClick={() => void remove(comment.id)}
                      className="rounded-md px-1.5 py-1 text-[9.5px] text-white/30 transition-colors hover:text-[#ff9d9d]"
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

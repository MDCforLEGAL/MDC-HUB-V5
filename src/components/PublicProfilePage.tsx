import { useCallback, useEffect, useState } from "react";
import { fetchPublicProfile, type Profile } from "../lib/api";
import { cn } from "../lib/cn";
import { timeAgo } from "../lib/format";
import { useI18n, type MessageKey } from "../i18n";
import { ACHIEVEMENT_ICONS, levelTitle } from "./AccountPage";
import { ArrowLeft, Link2, Loader, Share2 } from "./Icons";
import { UserAvatar } from "./UserAvatar";
import { VerifiedMark } from "./VerifiedMark";

interface PublicProfilePageProps {
  username: string;
  onNotify: (message: string) => void;
}

export function PublicProfilePage({ username, onNotify }: PublicProfilePageProps) {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    setProfile(null);

    fetchPublicProfile(username, controller.signal)
      .then((next) => setProfile(next))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [username]);

  const share = useCallback(async () => {
    if (!profile) return;

    const url = new URL(window.location.href);
    url.hash = `#/u/${encodeURIComponent(profile.user.username)}`;
    const shareText = t("profile.shareText", { name: profile.user.displayName });

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: profile.user.displayName,
          text: shareText,
          url: url.toString(),
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      onNotify(t("profile.linkCopied"));
    } catch {
      onNotify(t("profile.shareFailed"));
    }
  }, [onNotify, profile, t]);

  const links = profile?.user.links ?? [];
  const stats: Array<{ label: MessageKey; value: number }> = profile
    ? [
        { label: "account.statScripts", value: profile.stats.scripts },
        { label: "account.statComments", value: profile.stats.comments },
        { label: "account.statLikesReceived", value: profile.stats.likesReceived },
        { label: "account.statLikes", value: profile.stats.likesGiven },
      ]
    : [];

  return (
    <section className="relative px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-4xl">
        <a
          href="#/"
          className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.06em] text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("profile.back")}
        </a>

        {loading && !profile && (
          <div className="panel mt-10 flex items-center gap-3 px-5 py-6 text-[0.76rem] text-[var(--muted)]">
            <Loader className="h-4 w-4 animate-spin text-[var(--info)]" />
            {t("profile.loading")}
          </div>
        )}

        {failed && !profile && (
          <div className="mt-10 border border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-6">
            <p className="text-[0.76rem] text-[var(--accent)]">{t("profile.notFound")}</p>
            <a href="#/" className="btn btn-secondary btn-sm mt-3">
              {t("profile.back")}
            </a>
          </div>
        )}

        {profile && (
          <>
            <div className="profile-panel mt-6">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <UserAvatar user={profile.user} className="h-16 w-16 text-[20px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate font-display text-[1.55rem] font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-[1.85rem]">
                      {profile.user.displayName}
                    </h1>
                    <VerifiedMark
                      role={profile.user.role}
                      verified={profile.verification.met}
                      className="h-5 w-5"
                    />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.62rem] text-[var(--muted)]">
                    @{profile.user.username} ·{" "}
                    {t("account.joined", { time: timeAgo(profile.user.createdAt, locale) })}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "border px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em]",
                        profile.user.role === "admin"
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]",
                      )}
                    >
                      {profile.user.role === "admin"
                        ? t("auth.roleAdmin")
                        : t("auth.roleMember")}
                    </span>
                    <span className="border border-[var(--info)] bg-[var(--info-soft)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--info)]">
                      {t("account.level", { level: profile.level })}
                    </span>
                    <span className="border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--muted)]">
                      {t("account.xp", { xp: profile.xp })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void share()}
                  className="btn btn-secondary text-[var(--accent)]"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("profile.share")}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-px border-t border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="bg-[var(--surface)] px-4 py-4">
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
                      {t(item.label)}
                    </p>
                    <p className="mt-1 font-display text-[1.35rem] font-bold text-[var(--ink)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.07] px-5 py-4 sm:px-7">
                <p className="field-label text-[var(--accent)]">
                  {t("profile.about")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[0.78rem] leading-relaxed text-[var(--ink-soft)]">
                  {profile.user.bio?.trim() || t("profile.bioEmpty")}
                </p>
                {links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {links.map((link) => (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[0.62rem] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        <Link2 className="h-3 w-3" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="panel mt-4 p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[1.15rem] font-bold text-[var(--ink)]">
                    {t("account.achievementsTitle")}
                  </h2>
                  <p className="mt-1 text-[0.7rem] text-[var(--muted)]">
                    {t("profile.achievementsDescription")}
                  </p>
                </div>
                <span className="border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--muted)]">
                  {t(levelTitle(profile.level))}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {profile.achievements.map((achievement) => {
                  const Icon = ACHIEVEMENT_ICONS[achievement.id];
                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        "rounded-xl border p-3",
                        achievement.unlocked
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--line)] bg-[var(--surface-2)]",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
                            achievement.unlocked
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-[var(--line)] bg-[var(--surface)] text-[var(--faint)]",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-[11.5px] font-medium",
                              achievement.unlocked ? "text-[var(--ink)]" : "text-[var(--muted)]",
                            )}
                          >
                            {t(`achievement.${achievement.id}.title` as MessageKey)}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/30">
                            {t(`achievement.${achievement.id}.desc` as MessageKey)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

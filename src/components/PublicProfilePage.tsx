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
          className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-neon"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("profile.back")}
        </a>

        {loading && !profile && (
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-6 text-[12px] text-white/45">
            <Loader className="h-4 w-4 animate-spin text-neon/70" />
            {t("profile.loading")}
          </div>
        )}

        {failed && !profile && (
          <div className="mt-10 rounded-2xl border border-blood/35 bg-blood-deep/25 px-5 py-6">
            <p className="text-[12px] text-[#ffb3b3]">{t("profile.notFound")}</p>
            <a
              href="#/"
              className="mt-3 inline-flex rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70 transition-colors hover:border-neon/30 hover:text-white"
            >
              {t("profile.back")}
            </a>
          </div>
        )}

        {profile && (
          <>
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.09] bg-[linear-gradient(135deg,rgba(0,240,255,0.07),rgba(255,255,255,0.02)_45%,rgba(0,102,255,0.06))] backdrop-blur-2xl">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <UserAvatar user={profile.user} className="h-16 w-16 text-[20px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate font-display text-[24px] font-medium tracking-[-0.025em] text-white sm:text-[28px]">
                      {profile.user.displayName}
                    </h1>
                    <VerifiedMark
                      role={profile.user.role}
                      verified={profile.verification.met}
                      className="h-5 w-5"
                    />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-white/35">
                    @{profile.user.username} ·{" "}
                    {t("account.joined", { time: timeAgo(profile.user.createdAt, locale) })}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em]",
                        profile.user.role === "admin"
                          ? "border-[#8B0000]/50 bg-[#4A0000]/45 text-[#ffb3b3]"
                          : "border-white/[0.1] bg-white/[0.04] text-white/45",
                      )}
                    >
                      {profile.user.role === "admin"
                        ? t("auth.roleAdmin")
                        : t("auth.roleMember")}
                    </span>
                    <span className="rounded-full border border-neon/25 bg-neon/[0.07] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-neon/80">
                      {t("account.level", { level: profile.level })}
                    </span>
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/45">
                      {t("account.xp", { xp: profile.xp })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void share()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-neon/25 bg-neon/[0.07] px-4 py-2.5 text-[11.5px] font-medium text-neon transition-colors hover:border-neon/45 hover:bg-neon/[0.12]"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("profile.share")}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="bg-[#050a11]/85 px-4 py-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
                      {t(item.label)}
                    </p>
                    <p className="mt-1 font-display text-[20px] font-medium text-white/85">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.07] px-5 py-4 sm:px-7">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-neon/55">
                  {t("profile.about")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-white/55">
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-white/55 transition-colors hover:border-neon/30 hover:text-neon"
                      >
                        <Link2 className="h-3 w-3" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[18px] font-medium text-white/90">
                    {t("account.achievementsTitle")}
                  </h2>
                  <p className="mt-1 text-[11.5px] text-white/40">
                    {t("profile.achievementsDescription")}
                  </p>
                </div>
                <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/40">
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
                          ? "border-neon/20 bg-neon/[0.05]"
                          : "border-white/[0.06] bg-black/20",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
                            achievement.unlocked
                              ? "border-neon/30 bg-neon/[0.1] text-neon"
                              : "border-white/[0.08] bg-white/[0.02] text-white/25",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-[11.5px] font-medium",
                              achievement.unlocked ? "text-white/85" : "text-white/45",
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

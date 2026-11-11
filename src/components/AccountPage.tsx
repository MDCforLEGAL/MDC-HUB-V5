import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n, type MessageKey } from "../i18n";
import { cn } from "../lib/cn";
import { timeAgo } from "../lib/format";
import {
  fetchAdminUsers,
  fetchProfile,
  getStoredToken,
  updateProfile,
  updateUserRole,
  type AchievementId,
  type AchievementState,
  type AdminUserSummary,
  type AuthRole,
  type Profile,
  type ProfileLink,
} from "../lib/api";
import {
  BadgeCheck,
  Check,
  Link2,
  Loader,
  Lock,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "./Icons";
import { UserAvatar } from "./UserAvatar";
import { VerifiedMark } from "./VerifiedMark";

const LEVEL_TITLES: MessageKey[] = [
  "level.1",
  "level.2",
  "level.3",
  "level.4",
  "level.5",
  "level.6",
  "level.7",
  "level.8",
  "level.9",
  "level.10",
];

export const ACHIEVEMENT_ICONS: Record<AchievementId, typeof Star> = {
  first_script: Star,
  scripts_20: Sparkles,
  comments_5: MessageCircle,
  comments_25: MessageCircle,
  likes_10: Check,
  likes_100: Zap,
  critic_10: ShieldCheck,
  popular_25: Users,
  level_5: Zap,
  verified: BadgeCheck,
};

export function levelTitle(level: number): MessageKey {
  const index = Math.min(Math.max(level, 1), LEVEL_TITLES.length) - 1;
  return LEVEL_TITLES[index];
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-neon to-electric shadow-[0_0_12px_rgba(0,240,255,0.55)] transition-[width] duration-500"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  );
}

interface AccountPageProps {
  onAuth: () => void;
  onNotify: (message: string) => void;
}

export function AccountPage({ onAuth, onNotify }: AccountPageProps) {
  const { t, locale } = useI18n();
  const { user, signedIn, status, signIn } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [draftLinks, setDraftLinks] = useState<ProfileLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [unlockQueue, setUnlockQueue] = useState<AchievementState[]>([]);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    setLoading(true);
    setFailed(false);
    try {
      setProfile(await fetchProfile(token));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setProfile(null);
      setEditing(false);
      return;
    }
    void load();
  }, [signedIn, load]);

  useEffect(() => {
    if (!profile) return;

    const storageKey = `mdc-hub.achievements.${profile.user.id}`;
    const unlocked = profile.achievements.filter((item) => item.unlocked).map((item) => item.id);
    let seen: string[] | null = null;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          seen = parsed.filter((id): id is string => typeof id === "string");
        }
      }
    } catch {
      // Storage can be unavailable; only the in-page badge animation remains.
    }

    if (seen === null) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(unlocked));
      } catch {
        // Nothing else to do.
      }
      return;
    }

    const fresh = new Set(unlocked.filter((id) => !seen?.includes(id)));
    if (fresh.size > 0) {
      setUnlockQueue((previous) => [
        ...previous,
        ...profile.achievements.filter(
          (item) => fresh.has(item.id) && !previous.some((queued) => queued.id === item.id),
        ),
      ]);
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(unlocked));
    } catch {
      // Nothing else to do.
    }
  }, [profile]);

  useEffect(() => {
    if (unlockQueue.length === 0) return;
    const timer = window.setTimeout(() => setUnlockQueue((queue) => queue.slice(1)), 5200);
    return () => window.clearTimeout(timer);
  }, [unlockQueue]);

  const admin = user?.role === "admin";
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [adminQuery, setAdminQuery] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    const token = getStoredToken();
    if (!token) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setAdminLoading(true);
      fetchAdminUsers(token, adminQuery, controller.signal)
        .then((rows) => setAdminUsers(rows))
        .catch(() => {
          // Keep the previous list when the API is offline.
        })
        .finally(() => setAdminLoading(false));
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [admin, adminQuery]);

  const toggleRole = useCallback(
    async (target: AdminUserSummary) => {
      const token = getStoredToken();
      if (!token || roleBusy) return;

      const next: AuthRole = target.role === "admin" ? "member" : "admin";
      setRoleBusy(target.id);
      try {
        await updateUserRole(token, target.id, next);
        setAdminUsers((previous) =>
          previous.map((row) => (row.id === target.id ? { ...row, role: next } : row)),
        );
        onNotify(t("account.roleUpdated", { name: target.displayName }));
      } catch {
        onNotify(t("account.roleFailed"));
      } finally {
        setRoleBusy(null);
      }
    },
    [onNotify, roleBusy, t],
  );

  const startEditing = useCallback(() => {
    if (!profile) return;
    setDraftBio(profile.user.bio ?? "");
    setDraftLinks(
      profile.user.links?.length
        ? profile.user.links.map((link) => ({ ...link }))
        : [{ label: "", url: "" }],
    );
    setEditing(true);
  }, [profile]);

  const shareProfile = useCallback(async () => {
    if (!profile) return;

    const url = new URL(window.location.href);
    url.hash = `#/u/${encodeURIComponent(profile.user.username)}`;
    const text = t("profile.shareText", { name: profile.user.displayName });

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: profile.user.displayName, text, url: url.toString() });
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

  const updateDraftLink = (index: number, key: "label" | "url", value: string) => {
    setDraftLinks((previous) =>
      previous.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [key]: value } : link,
      ),
    );
  };

  const saveProfile = useCallback(async () => {
    if (!profile || saving) return;
    const token = getStoredToken();
    if (!token) return;

    const links = draftLinks
      .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
      .filter((link) => link.url.length > 0);

    for (const link of links) {
      try {
        const url = new URL(link.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          onNotify(t("profile.invalidLink"));
          return;
        }
      } catch {
        onNotify(t("profile.invalidLink"));
        return;
      }
    }

    setSaving(true);
    try {
      const next = await updateProfile(token, { bio: draftBio.trim(), links });
      setProfile(next);
      setEditing(false);
      onNotify(t("profile.saved"));
    } catch {
      onNotify(t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [draftBio, draftLinks, onNotify, profile, saving, t]);

  const stats = profile?.stats;
  const profileLinks = profile?.user.links ?? [];
  const unlockToast = unlockQueue[0] ?? null;
  const UnlockIcon = unlockToast ? ACHIEVEMENT_ICONS[unlockToast.id] : Star;
  const verificationRows = useMemo(() => {
    if (!profile) return [];
    const requirements = profile.verification.requirements;
    return [
      { key: "account.verifyScripts" as MessageKey, data: requirements.scripts },
      { key: "account.verifyComments" as MessageKey, data: requirements.comments },
      { key: "account.verifyLikes" as MessageKey, data: requirements.likesGiven },
    ];
  }, [profile]);

  if (!signedIn) {
    return (
      <section className="relative px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/[0.09] bg-white/[0.025] p-7 text-center backdrop-blur-2xl sm:p-10">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-neon/25 bg-neon/[0.07] text-neon">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <p className="mt-5 font-mono text-[8.5px] uppercase tracking-[0.22em] text-neon/60">
            {t("account.kicker")}
          </p>
          <h1 className="mt-2 font-display text-[26px] font-medium leading-tight tracking-[-0.03em] text-white sm:text-[32px]">
            {t("account.signedOutTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[12.5px] leading-relaxed text-white/45">
            {t("account.signedOutBody")}
          </p>
          <button
            type="button"
            onClick={status === "loading" ? undefined : onAuth}
            disabled={status === "loading"}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon to-electric px-5 py-3 text-[12px] font-semibold text-[#02070a] shadow-[0_12px_34px_-12px_rgba(0,240,255,0.85)] transition-opacity disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t("account.signIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (status !== "loading") signIn();
            }}
            className="mt-2 block w-full text-[10.5px] text-white/30 transition-colors hover:text-neon/70"
          >
            {t("auth.discordCta")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-neon/70 to-transparent" />
          <span className="section-kicker text-neon/70">{t("account.kicker")}</span>
        </div>
        <h1 className="mt-4 max-w-2xl font-display text-[30px] font-medium leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">
          {t("account.titleLead")}
          <span className="bg-gradient-to-r from-white via-[#B9F8FF] to-[#5F91FF] bg-clip-text text-transparent">
            {t("account.titleHighlight")}
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-[12.5px] leading-relaxed text-white/50 sm:text-[13.5px]">
          {t("account.description")}
        </p>

        {loading && !profile && (
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-6 text-[12px] text-white/45">
            <Loader className="h-4 w-4 animate-spin text-neon/70" />
            {t("account.loading")}
          </div>
        )}

        {failed && !profile && (
          <div className="mt-10 rounded-2xl border border-blood/35 bg-blood-deep/25 px-5 py-6">
            <p className="text-[12px] text-[#ffb3b3]">{t("account.loadFailed")}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70 transition-colors hover:border-neon/30 hover:text-white"
            >
              {t("auth.retry")}
            </button>
          </div>
        )}

        {profile && (
          <>
            <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.09] bg-[linear-gradient(135deg,rgba(0,240,255,0.07),rgba(255,255,255,0.02)_45%,rgba(0,102,255,0.06))] backdrop-blur-2xl">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <UserAvatar user={profile.user} className="h-16 w-16 text-[20px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-[22px] font-medium tracking-[-0.02em] text-white sm:text-[26px]">
                      {profile.user.displayName}
                    </h2>
                    <VerifiedMark
                      role={profile.user.role}
                      verified={profile.verification.met}
                      className="h-5 w-5"
                    />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-white/35">
                    @{profile.user.username} · {t("account.joined", {
                      time: timeAgo(profile.user.createdAt, locale),
                    })}
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
                      {profile.user.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
                    </span>
                    <span className="rounded-full border border-neon/25 bg-neon/[0.07] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-neon/80">
                      {t("account.level", { level: profile.level })}
                    </span>
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/45">
                      {t("account.xp", { xp: profile.xp })}
                    </span>
                  </div>
                  {!editing && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void shareProfile()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neon/25 bg-neon/[0.07] px-2.5 py-1.5 text-[10.5px] font-medium text-neon/85 transition-colors hover:border-neon/45 hover:text-neon"
                      >
                        <Share2 className="h-3 w-3" />
                        {t("profile.share")}
                      </button>
                      <button
                        type="button"
                        onClick={startEditing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] font-medium text-white/55 transition-colors hover:border-neon/30 hover:text-white"
                      >
                        <Pencil className="h-3 w-3" />
                        {t("profile.edit")}
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-56">
                  <div className="flex items-center justify-between font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/35">
                    <span>{t(levelTitle(profile.level))}</span>
                    <span className="text-neon/70">
                      {t("account.level", { level: profile.level })}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Bar value={profile.levelProgress} />
                  </div>
                  <p className="mt-2 font-mono text-[9px] text-white/30">
                    {profile.nextLevelXp === null
                      ? t("account.maxLevel")
                      : t("account.nextLevel", {
                          xp: Math.max(0, profile.nextLevelXp - profile.xp),
                          level: profile.level + 1,
                        })}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/[0.07] px-5 py-4 sm:px-7">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-[0.18em] text-neon/55">
                        {t("profile.bioLabel")}
                      </label>
                      <textarea
                        value={draftBio}
                        onChange={(event) => setDraftBio(event.target.value.slice(0, 180))}
                        rows={3}
                        maxLength={180}
                        placeholder={t("profile.bioPlaceholder")}
                        className="mt-1.5 w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-[12px] leading-relaxed text-white/80 placeholder:text-white/25 focus:border-neon/35 focus:outline-none"
                      />
                      <p className="mt-1 text-right font-mono text-[8px] text-white/20">
                        {draftBio.length}/180
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-neon/55">
                          {t("profile.linksTitle")}
                        </p>
                        {draftLinks.length < 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftLinks((previous) => [...previous, { label: "", url: "" }])
                            }
                            className="inline-flex items-center gap-1 text-[10px] text-neon/70 transition-colors hover:text-neon"
                          >
                            <Plus className="h-3 w-3" />
                            {t("profile.addLink")}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 space-y-2">
                        {draftLinks.map((link, index) => (
                          <div
                            key={index}
                            className="grid gap-2 sm:grid-cols-[0.8fr_1.4fr_auto]"
                          >
                            <input
                              value={link.label}
                              onChange={(event) =>
                                updateDraftLink(index, "label", event.target.value.slice(0, 28))
                              }
                              placeholder={t("profile.linkLabel")}
                              aria-label={t("profile.linkLabel")}
                              className="rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-2 text-[11px] text-white/80 placeholder:text-white/25 focus:border-neon/35 focus:outline-none"
                            />
                            <input
                              value={link.url}
                              onChange={(event) =>
                                updateDraftLink(index, "url", event.target.value.slice(0, 240))
                              }
                              placeholder="https://"
                              aria-label={t("profile.linkUrl")}
                              inputMode="url"
                              className="rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-2 text-[11px] text-white/80 placeholder:text-white/25 focus:border-neon/35 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftLinks((previous) =>
                                  previous.filter((_, linkIndex) => linkIndex !== index),
                                )
                              }
                              aria-label={t("profile.removeLink")}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/30 transition-colors hover:border-blood/40 hover:text-[#ff9d9d]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveProfile()}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-neon to-electric px-3 py-2 text-[10.5px] font-semibold text-[#02070a] transition-opacity disabled:opacity-50"
                      >
                        {saving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        {saving ? t("profile.saving") : t("profile.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[10.5px] font-medium text-white/55 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
                      >
                        {t("profile.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-neon/55">
                      {t("profile.about")}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-white/55">
                      {profile.user.bio?.trim() || t("profile.bioEmpty")}
                    </p>
                    {profileLinks.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {profileLinks.map((link) => (
                          <a
                            key={`${link.label}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-white/55 transition-colors hover:border-neon/30 hover:text-neon"
                          >
                            <Link2 className="h-3 w-3" />
                            {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.06] sm:grid-cols-5">
                {[
                  { label: "account.statScripts", value: stats?.scripts ?? 0 },
                  { label: "account.statComments", value: stats?.comments ?? 0 },
                  { label: "account.statLikes", value: stats?.likesGiven ?? 0 },
                  { label: "account.statDislikes", value: stats?.dislikesGiven ?? 0 },
                  { label: "account.statLikesReceived", value: stats?.likesReceived ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="bg-[#050a11]/85 px-4 py-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
                      {t(item.label as MessageKey)}
                    </p>
                    <p className="mt-1 font-display text-[20px] font-medium text-white/85">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-neon/60">
                      {t("card.verifiedCommunity")}
                    </p>
                    <h3 className="mt-2 font-display text-[18px] font-medium text-white/90">
                      {t("account.verifyTitle")}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em]",
                      profile.verification.met
                        ? "border-neon/35 bg-neon/[0.1] text-neon"
                        : "border-white/[0.1] bg-white/[0.04] text-white/40",
                    )}
                  >
                    {profile.verification.met
                      ? t("account.verifyMet")
                      : t("account.verifyPending")}
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">
                  {t("account.verifyDescription")}
                </p>

                <div className="mt-4 space-y-3.5">
                  {verificationRows.map((row) => {
                    const ratio = row.data.current / row.data.required;
                    const done = row.data.current >= row.data.required;
                    return (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-white/60">
                            {done ? (
                              <Check className="h-3 w-3 text-neon" strokeWidth={2.6} />
                            ) : (
                              <Lock className="h-3 w-3 text-white/25" />
                            )}
                            {t(row.key)}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[9.5px]",
                              done ? "text-neon/80" : "text-white/35",
                            )}
                          >
                            {t("account.progress", {
                              current: Math.min(row.data.current, row.data.required),
                              target: row.data.required,
                            })}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <Bar value={ratio} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
                <h3 className="font-display text-[18px] font-medium text-white/90">
                  {t("account.achievementsTitle")}
                </h3>
                <p className="mt-1.5 text-[11.5px] text-white/40">
                  {t("account.achievementsDescription")}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {profile.achievements.map((achievement, index) => {
                    const Icon = ACHIEVEMENT_ICONS[achievement.id] ?? Star;
                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "rounded-xl border p-3 transition-colors",
                          achievement.unlocked
                            ? "achievement-card--unlocked border-neon/20 bg-neon/[0.05]"
                            : "border-white/[0.06] bg-black/20",
                        )}
                        style={
                          achievement.unlocked
                            ? { animationDelay: `${Math.min(index * 45, 360)}ms` }
                            : undefined
                        }
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
                        <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em]">
                          <span className={achievement.unlocked ? "text-neon/70" : "text-white/20"}>
                            {achievement.unlocked ? t("account.unlocked") : t("account.locked")}
                          </span>
                          <span className="text-white/25">
                            {Math.min(achievement.progress, achievement.target)}/
                            {achievement.target}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {admin && (
              <div className="mt-4 rounded-2xl border border-[#8B0000]/25 bg-[#2a0606]/20 p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-[18px] font-medium text-white/90">
                      {t("account.adminTitle")}
                    </h3>
                    <p className="mt-1 text-[11.5px] text-white/40">
                      {t("account.adminDescription")}
                    </p>
                  </div>
                  {adminLoading && <Loader className="h-4 w-4 animate-spin text-white/30" />}
                </div>

                <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <input
                    value={adminQuery}
                    onChange={(event) => setAdminQuery(event.target.value.slice(0, 60))}
                    placeholder={t("account.searchPlaceholder")}
                    className="w-full bg-transparent text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none"
                  />
                </div>

                <ul className="mt-3 space-y-2">
                  {adminUsers.length === 0 ? (
                    <li className="py-3 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                      {t("account.noUsers")}
                    </li>
                  ) : (
                    adminUsers.map((row) => {
                      const self = row.id === profile.user.id;
                      const busyRow = roleBusy === row.id;
                      return (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                        >
                          <UserAvatar user={row} className="h-8 w-8" />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-[11.5px] font-medium text-white/80">
                              {row.displayName}
                              <VerifiedMark
                                role={row.role}
                                verified={row.verified}
                                className="h-3 w-3"
                              />
                            </p>
                            <p className="truncate font-mono text-[8.5px] text-white/30">
                              @{row.username} · {t("account.level", { level: row.level })}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.12em]",
                              row.role === "admin"
                                ? "border-[#8B0000]/50 bg-[#4A0000]/45 text-[#ffb3b3]"
                                : "border-white/[0.1] bg-white/[0.04] text-white/40",
                            )}
                          >
                            {row.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
                          </span>
                          <button
                            type="button"
                            onClick={() => void toggleRole(row)}
                            disabled={self || busyRow}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-40",
                              row.role === "admin"
                                ? "border-white/[0.1] bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
                                : "border-neon/25 bg-neon/[0.07] text-neon/85 hover:border-neon/45 hover:text-neon",
                            )}
                          >
                            {busyRow
                              ? "..."
                              : self
                                ? t("account.roleSelf")
                                : row.role === "admin"
                                  ? t("account.makeMember")
                                  : t("account.makeAdmin")}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {unlockToast && (
        <div
          role="status"
          aria-live="polite"
          className="achievement-toast fixed left-1/2 top-24 z-[95] w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-2xl border border-neon/30 bg-[#060b13]/97 p-3.5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.95),0_0_60px_-28px_rgba(0,240,255,0.8)] backdrop-blur-2xl"
        >
          <div className="flex items-start gap-3">
            <span className="achievement-toast__icon grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neon/35 bg-neon/[0.12] text-neon">
              <UnlockIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-neon/65">
                {t("account.achievementUnlocked")}
              </p>
              <p className="mt-1 truncate text-[12.5px] font-medium text-white/90">
                {t(`achievement.${unlockToast.id}.title` as MessageKey)}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/40">
                {t(`achievement.${unlockToast.id}.desc` as MessageKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUnlockQueue((queue) => queue.slice(1))}
              aria-label={t("toast.dismiss")}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/75"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <span aria-hidden="true" className="achievement-toast__bar mt-3 block h-px w-full bg-gradient-to-r from-transparent via-neon/70 to-transparent" />
        </div>
      )}
    </section>
  );
}

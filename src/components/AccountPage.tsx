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
  ArrowRight,
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
    <div className="h-1.5 w-full overflow-hidden bg-[var(--line)]">
      <div
        className="h-full bg-[var(--info)] transition-[width] duration-500"
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
        <div className="panel mx-auto max-w-xl p-7 text-center sm:p-10">
          <span className="mx-auto grid h-11 w-11 place-items-center border border-[var(--accent)] text-[var(--accent)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <p className="mt-5 section-kicker">{t("account.kicker")}</p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-tight tracking-[-0.04em] text-[var(--ink)] sm:text-[2.1rem]">
            {t("account.signedOutTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[0.78rem] leading-relaxed text-[var(--muted)]">
            {t("account.signedOutBody")}
          </p>
          <button
            type="button"
            onClick={status === "loading" ? undefined : onAuth}
            disabled={status === "loading"}
            className="btn btn-primary mt-6 disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {t("account.signIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (status !== "loading") signIn();
            }}
            className="mt-2 block w-full text-[0.66rem] text-[var(--faint)] transition-colors hover:text-[var(--accent)]"
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
        <span className="section-kicker">{t("account.kicker")}</span>
        <h1 className="section-title">
          {t("account.titleLead")}
          <span className="text-accent">{t("account.titleHighlight")}</span>
        </h1>
        <p className="section-lead">{t("account.description")}</p>

        {loading && !profile && (
          <div className="panel mt-10 flex items-center gap-3 px-5 py-6 text-[0.76rem] text-[var(--muted)]">
            <Loader className="h-4 w-4 animate-spin text-[var(--info)]" />
            {t("account.loading")}
          </div>
        )}

        {failed && !profile && (
          <div className="mt-10 border border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-6">
            <p className="text-[0.76rem] text-[var(--accent)]">{t("account.loadFailed")}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="btn btn-secondary btn-sm mt-3"
            >
              {t("auth.retry")}
            </button>
          </div>
        )}

        {profile && (
          <>
            <div className="profile-panel mt-8">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <UserAvatar user={profile.user} className="h-16 w-16 text-[20px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-[1.45rem] font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-[1.7rem]">
                      {profile.user.displayName}
                    </h2>
                    <VerifiedMark
                      role={profile.user.role}
                      verified={profile.verification.met}
                      className="h-5 w-5"
                    />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.62rem] text-[var(--muted)]">
                    @{profile.user.username} · {t("account.joined", {
                      time: timeAgo(profile.user.createdAt, locale),
                    })}
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
                      {profile.user.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
                    </span>
                    <span className="border border-[var(--info)] bg-[var(--info-soft)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--info)]">
                      {t("account.level", { level: profile.level })}
                    </span>
                    <span className="border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--muted)]">
                      {t("account.xp", { xp: profile.xp })}
                    </span>
                  </div>
                  {!editing && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void shareProfile()}
                        className="btn btn-secondary btn-sm text-[var(--accent)]"
                      >
                        <Share2 className="h-3 w-3" />
                        {t("profile.share")}
                      </button>
                      <button
                        type="button"
                        onClick={startEditing}
                        className="btn btn-secondary btn-sm"
                      >
                        <Pencil className="h-3 w-3" />
                        {t("profile.edit")}
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-56">
                  <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
                    <span>{t(levelTitle(profile.level))}</span>
                    <span className="text-[var(--accent)]">
                      {t("account.level", { level: profile.level })}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Bar value={profile.levelProgress} />
                  </div>
                  <p className="mt-2 font-mono text-[0.58rem] text-[var(--faint)]">
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
                      <label className="field-label">
                        {t("profile.bioLabel")}
                      </label>
                      <textarea
                        value={draftBio}
                        onChange={(event) => setDraftBio(event.target.value.slice(0, 180))}
                        rows={3}
                        maxLength={180}
                        placeholder={t("profile.bioPlaceholder")}
                        className="field mt-1.5 min-h-[86px] resize-y"
                      />
                      <p className="mt-1 text-right font-mono text-[0.55rem] text-[var(--faint)]">
                        {draftBio.length}/180
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="field-label">
                          {t("profile.linksTitle")}
                        </p>
                        {draftLinks.length < 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftLinks((previous) => [...previous, { label: "", url: "" }])
                            }
                            className="inline-flex items-center gap-1 text-[0.62rem] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
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
                              className="field"
                            />
                            <input
                              value={link.url}
                              onChange={(event) =>
                                updateDraftLink(index, "url", event.target.value.slice(0, 240))
                              }
                              placeholder="https://"
                              aria-label={t("profile.linkUrl")}
                              inputMode="url"
                              className="field"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftLinks((previous) =>
                                  previous.filter((_, linkIndex) => linkIndex !== index),
                                )
                              }
                              aria-label={t("profile.removeLink")}
                              className="icon-btn h-9 w-9 hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                        className="btn btn-primary btn-sm disabled:opacity-50"
                      >
                        {saving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        {saving ? t("profile.saving") : t("profile.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="btn btn-secondary btn-sm disabled:opacity-50"
                      >
                        {t("profile.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="field-label text-[var(--accent)]">
                      {t("profile.about")}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[0.78rem] leading-relaxed text-[var(--ink-soft)]">
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
                            className="inline-flex items-center gap-1.5 border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[0.62rem] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
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

              <div className="grid grid-cols-2 gap-px border-t border-[var(--line)] bg-[var(--line)] sm:grid-cols-5">
                {[
                  { label: "account.statScripts", value: stats?.scripts ?? 0 },
                  { label: "account.statComments", value: stats?.comments ?? 0 },
                  { label: "account.statLikes", value: stats?.likesGiven ?? 0 },
                  { label: "account.statDislikes", value: stats?.dislikesGiven ?? 0 },
                  { label: "account.statLikesReceived", value: stats?.likesReceived ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--surface)] px-4 py-4">
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-[var(--faint)]">
                      {t(item.label as MessageKey)}
                    </p>
                    <p className="mt-1 font-display text-[1.35rem] font-bold text-[var(--ink)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="field-label text-[var(--accent)]">
                      {t("card.verifiedCommunity")}
                    </p>
                    <h3 className="mt-2 font-display text-[1.15rem] font-bold text-[var(--ink)]">
                      {t("account.verifyTitle")}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 border px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.05em]",
                      profile.verification.met
                        ? "border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)]"
                        : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--faint)]",
                    )}
                  >
                    {profile.verification.met
                      ? t("account.verifyMet")
                      : t("account.verifyPending")}
                  </span>
                </div>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-[var(--muted)]">
                  {t("account.verifyDescription")}
                </p>

                <div className="mt-4 space-y-3.5">
                  {verificationRows.map((row) => {
                    const ratio = row.data.current / row.data.required;
                    const done = row.data.current >= row.data.required;
                    return (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-[0.7rem]">
                          <span className="flex items-center gap-1.5 text-[var(--ink-soft)]">
                            {done ? (
                              <Check className="h-3 w-3 text-[var(--info)]" strokeWidth={2.6} />
                            ) : (
                              <Lock className="h-3 w-3 text-[var(--faint)]" />
                            )}
                            {t(row.key)}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[0.58rem]",
                              done ? "text-[var(--info)]" : "text-[var(--faint)]",
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

              <div className="panel p-5">
                <h3 className="font-display text-[1.15rem] font-bold text-[var(--ink)]">
                  {t("account.achievementsTitle")}
                </h3>
                <p className="mt-1.5 text-[0.7rem] text-[var(--muted)]">
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
                            ? "achievement-card--unlocked border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-[var(--surface-2)]",
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
                        <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em]">
                          <span className={achievement.unlocked ? "text-[var(--accent)]" : "text-[var(--faint)]"}>
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
              <div className="mt-4 border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-[1.15rem] font-bold text-[var(--ink)]">
                      {t("account.adminTitle")}
                    </h3>
                    <p className="mt-1 text-[0.7rem] text-[var(--muted)]">
                      {t("account.adminDescription")}
                    </p>
                  </div>
                  {adminLoading && <Loader className="h-4 w-4 animate-spin text-white/30" />}
                </div>

                <div className="mt-3.5 flex items-center gap-2 border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-[var(--faint)]" />
                  <input
                    value={adminQuery}
                    onChange={(event) => setAdminQuery(event.target.value.slice(0, 60))}
                    placeholder={t("account.searchPlaceholder")}
                    className="w-full bg-transparent text-[0.76rem] text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none"
                  />
                </div>

                <ul className="mt-3 space-y-2">
                  {adminUsers.length === 0 ? (
                    <li className="py-3 text-center font-mono text-[0.58rem] uppercase tracking-[0.06em] text-[var(--faint)]">
                      {t("account.noUsers")}
                    </li>
                  ) : (
                    adminUsers.map((row) => {
                      const self = row.id === profile.user.id;
                      const busyRow = roleBusy === row.id;
                      return (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center gap-2.5 border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5"
                        >
                          <UserAvatar user={row} className="h-8 w-8" />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-[0.72rem] font-semibold text-[var(--ink)]">
                              {row.displayName}
                              <VerifiedMark
                                role={row.role}
                                verified={row.verified}
                                className="h-3 w-3"
                              />
                            </p>
                            <p className="truncate font-mono text-[0.55rem] text-[var(--faint)]">
                              @{row.username} · {t("account.level", { level: row.level })}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "border px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-[0.05em]",
                              row.role === "admin"
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
                            )}
                          >
                            {row.role === "admin" ? t("auth.roleAdmin") : t("auth.roleMember")}
                          </span>
                          <button
                            type="button"
                            onClick={() => void toggleRole(row)}
                            disabled={self || busyRow}
                            className={cn(
                              "border px-2.5 py-1.5 text-[0.62rem] font-semibold transition-colors disabled:opacity-40",
                              row.role === "admin"
                                ? "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                                : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white",
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
          className="achievement-toast toast-card fixed left-1/2 top-24 z-[95] w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 border-l-[var(--accent)] p-3.5"
        >
          <div className="flex items-start gap-3">
            <span className="achievement-toast__icon grid h-10 w-10 shrink-0 place-items-center border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <UnlockIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="field-label text-[var(--accent)]">
                {t("account.achievementUnlocked")}
              </p>
              <p className="mt-1 truncate text-[0.8rem] font-semibold text-[var(--ink)]">
                {t(`achievement.${unlockToast.id}.title` as MessageKey)}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[0.66rem] leading-snug text-[var(--muted)]">
                {t(`achievement.${unlockToast.id}.desc` as MessageKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUnlockQueue((queue) => queue.slice(1))}
              aria-label={t("toast.dismiss")}
              className="grid h-6 w-6 shrink-0 place-items-center text-[var(--faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <span aria-hidden="true" className="achievement-toast__bar mt-3 block h-px w-full bg-[var(--accent)]" />
        </div>
      )}
    </section>
  );
}

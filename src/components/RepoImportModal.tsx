import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n";
import {
  ApiError,
  fetchGithubRepoCandidates,
  fetchMyGithubRepos,
  getStoredToken,
  importGithubRepo,
  removeGithubRepo,
  setGithubRepoPublic,
  type GithubRepo,
  type GithubRepoCandidate,
} from "../lib/api";
import { Github, Loader, Star, X } from "./Icons";

interface RepoImportModalProps {
  onClose: () => void;
  onNotify: (message: string) => void;
  onChanged: () => void;
}

type RepoError = "load" | "github" | "config" | "action" | null;

export function RepoImportModal({ onClose, onNotify, onChanged }: RepoImportModalProps) {
  const { t } = useI18n();
  const { user, signedIn, health, signIn } = useAuth();
  const [mine, setMine] = useState<GithubRepo[]>([]);
  const [candidates, setCandidates] = useState<GithubRepoCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<RepoError>(null);

  const githubUser = user?.provider === "github";

  const load = useCallback(async () => {
    const token = await getStoredToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const [myRepos, githubRepos] = await Promise.all([
        fetchMyGithubRepos(token),
        githubUser ? fetchGithubRepoCandidates(token) : Promise.resolve([]),
      ]);
      setMine(myRepos);
      setCandidates(githubRepos);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError("github");
      } else if (caught instanceof ApiError && caught.status === 502) {
        setError("load");
      } else {
        setError("action");
      }
    } finally {
      setLoading(false);
    }
  }, [githubUser]);

  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, load]);

  const importRepo = async (candidate: GithubRepoCandidate) => {
    const token = await getStoredToken();
    if (!token || busy) return;
    setBusy(candidate.fullName);
    setError(null);
    try {
      const repo = await importGithubRepo(token, candidate.fullName);
      setMine((previous) => [repo, ...previous.filter((item) => item.id !== repo.id)]);
      onNotify(t("repos.importSuccess"));
      onChanged();
    } catch {
      setError("action");
    } finally {
      setBusy(null);
    }
  };

  const togglePublic = async (repo: GithubRepo) => {
    const token = await getStoredToken();
    if (!token || busy) return;
    setBusy(repo.id);
    setError(null);
    try {
      const updated = await setGithubRepoPublic(token, repo.id, !repo.isPublic);
      setMine((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      onNotify(t(updated.isPublic ? "repos.publishSuccess" : "repos.unpublishSuccess"));
      onChanged();
    } catch {
      setError("action");
    } finally {
      setBusy(null);
    }
  };

  const removeRepo = async (repo: GithubRepo) => {
    const token = await getStoredToken();
    if (!token || busy) return;
    setBusy(repo.id);
    setError(null);
    try {
      await removeGithubRepo(token, repo.id);
      setMine((previous) => previous.filter((item) => item.id !== repo.id));
      onNotify(t("repos.removeSuccess"));
      onChanged();
    } catch {
      setError("action");
    } finally {
      setBusy(null);
    }
  };

  const importedIds = new Map(mine.map((repo) => [repo.fullName.toLowerCase(), repo]));

  return (
    <div
      className="modal-overlay fade-in fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-import-title"
        className="modal-panel modal-in code-scroll relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-y-auto p-5 outline-none sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("repos.close")}
          className="icon-btn absolute right-4 top-4"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <span className="section-kicker">{t("repos.kicker")}</span>
        <h2
          id="repo-import-title"
          className="mt-2 pr-8 font-display text-[1.5rem] font-bold leading-tight tracking-[-0.035em] text-[var(--ink)]"
        >
          {t("repos.modalTitle")}
        </h2>
        <p className="mt-2 max-w-xl text-[0.76rem] leading-relaxed text-[var(--muted)]">
          {t("repos.modalBody")}
        </p>

        {!signedIn && (
          <div className="mt-6 border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-[0.8rem] text-[var(--ink)]">{t("repos.signInBody")}</p>
            <button
              type="button"
              onClick={() => signIn("github")}
              disabled={health?.github === false}
              className="btn btn-primary mt-3 disabled:opacity-50"
            >
              <Github className="h-3.5 w-3.5" />
              {t("repos.signInCta")}
            </button>
          </div>
        )}

        {signedIn && !githubUser && (
          <div className="mt-6 border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-[0.8rem] text-[var(--ink)]">{t("repos.githubRequired")}</p>
            <button
              type="button"
              onClick={() => signIn("github")}
              disabled={health?.github === false}
              className="btn btn-primary mt-3 disabled:opacity-50"
            >
              <Github className="h-3.5 w-3.5" />
              {t("repos.signInCta")}
            </button>
          </div>
        )}

        {signedIn && githubUser && health?.github === false && (
          <div className="mt-6 border border-[var(--line)] bg-[var(--surface-2)] p-4 text-[0.76rem] leading-relaxed text-[var(--muted)]">
            {t("repos.githubConfig")}
          </div>
        )}

        {signedIn && githubUser && health?.github !== false && (
          <>
            {loading && (
              <div className="mt-6 flex items-center gap-2 text-[0.72rem] text-[var(--muted)]">
                <Loader className="h-4 w-4 animate-spin text-[var(--info)]" />
                {t("repos.loading")}
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 border border-blood/35 bg-blood-deep/30 px-3 py-2 text-[0.68rem] leading-relaxed text-[#ffb3b3]"
              >
                {error === "github"
                  ? t("repos.githubRequired")
                  : error === "load"
                    ? t("repos.loadError")
                    : t("repos.actionError")}
              </p>
            )}

            {!loading && (
              <div className="mt-6">
                <h3 className="footer-heading">{t("repos.importedTitle")}</h3>
                {mine.length === 0 ? (
                  <p className="mt-2 text-[0.72rem] text-[var(--muted)]">{t("repos.noImported")}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {mine.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-semibold text-[var(--ink)]">
                            {repo.fullName}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-[0.05em] text-[var(--faint)]">
                            <Star className="h-3 w-3" />
                            {repo.stars}
                            <span className={repo.isPublic ? "text-[var(--info)]" : ""}>
                              {repo.isPublic ? t("repos.publicBadge") : t("repos.privateBadge")}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void togglePublic(repo)}
                            disabled={busy === repo.id}
                            className="btn btn-secondary !h-8 !px-2.5 !text-[0.62rem] disabled:opacity-50"
                          >
                            {repo.isPublic ? t("repos.unpublish") : t("repos.publish")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeRepo(repo)}
                            disabled={busy === repo.id}
                            className="btn btn-secondary !h-8 !px-2.5 !text-[0.62rem] text-[#ffb3b3] disabled:opacity-50"
                          >
                            {t("repos.remove")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!loading && candidates.length > 0 && (
              <div className="mt-6">
                <h3 className="footer-heading">{t("repos.availableTitle")}</h3>
                <div className="mt-3 space-y-2">
                  {candidates.map((candidate) => {
                    const imported = importedIds.get(candidate.fullName.toLowerCase());
                    return (
                      <div
                        key={candidate.fullName}
                        className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-semibold text-[var(--ink)]">
                            {candidate.fullName}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[0.65rem] text-[var(--muted)]">
                            {candidate.description || t("repos.noDescription")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void importRepo(candidate)}
                          disabled={Boolean(imported) || busy === candidate.fullName}
                          className="btn btn-secondary !h-8 !px-2.5 !text-[0.62rem] disabled:opacity-50"
                        >
                          {imported ? t("repos.imported") : t("repos.import")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && candidates.length === 0 && mine.length === 0 && (
              <p className="mt-6 text-[0.72rem] text-[var(--muted)]">{t("repos.noPublicRepos")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

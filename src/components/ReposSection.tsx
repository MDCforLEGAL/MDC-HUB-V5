import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { fetchPublicGithubRepos, type GithubRepo } from "../lib/api";
import { formatCompact } from "../lib/format";
import { ArrowUpRight, Github, Star } from "./Icons";

interface ReposSectionProps {
  refreshKey: number;
  onImport: () => void;
}

export function ReposSection({ refreshKey, onImport }: ReposSectionProps) {
  const { t, locale } = useI18n();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);

    fetchPublicGithubRepos(controller.signal)
      .then((next) => setRepos(next))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  return (
    <section id="repolar" className="scroll-mt-24 border-t border-[var(--line)] py-12 sm:py-16">
      <div className="container-page">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-kicker">{t("repos.kicker")}</span>
            <h2 className="mt-3 font-display text-[1.8rem] font-bold leading-tight tracking-[-0.04em] text-[var(--ink)] sm:text-[2.25rem]">
              {t("repos.titleLead")}
              <span className="text-accent">{t("repos.titleHighlight")}</span>
            </h2>
            <p className="mt-2 max-w-2xl text-[0.8rem] leading-relaxed text-[var(--muted)]">
              {t("repos.description")}
            </p>
          </div>
          <button type="button" onClick={onImport} className="btn btn-secondary w-fit">
            <Github className="h-3.5 w-3.5" />
            {t("repos.importCta")}
          </button>
        </div>

        {loading && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse border border-[var(--line)] bg-[var(--surface)]"
              />
            ))}
          </div>
        )}

        {!loading && repos.length > 0 && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-36 flex-col border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--info)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]">
                      <Github className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[0.58rem] text-[var(--faint)]">
                        {repo.owner}
                      </p>
                      <h3 className="truncate text-[0.84rem] font-semibold text-[var(--ink)]">
                        {repo.name}
                      </h3>
                    </div>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--faint)] transition-colors group-hover:text-[var(--info)]" />
                </div>

                <p className="mt-3 line-clamp-2 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                  {repo.description || t("repos.noDescription")}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 font-mono text-[0.55rem] uppercase tracking-[0.05em] text-[var(--faint)]">
                  {repo.language && <span>{repo.language}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {formatCompact(repo.stars, locale)}
                  </span>
                  <span className="ml-auto border border-[var(--info)] bg-[var(--info-soft)] px-1.5 py-0.5 text-[var(--info)]">
                    {t("repos.publicBadge")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && repos.length === 0 && (
          <div className="mt-7 border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-7 text-center">
            <Github className="mx-auto h-5 w-5 text-[var(--faint)]" />
            <p className="mt-3 text-[0.9rem] font-semibold text-[var(--ink)]">
              {failed ? t("repos.errorTitle") : t("repos.emptyTitle")}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-[0.74rem] leading-relaxed text-[var(--muted)]">
              {failed ? t("repos.errorBody") : t("repos.emptyBody")}
            </p>
            {!failed && (
              <button type="button" onClick={onImport} className="btn btn-primary mt-4">
                <Github className="h-3.5 w-3.5" />
                {t("repos.importCta")}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

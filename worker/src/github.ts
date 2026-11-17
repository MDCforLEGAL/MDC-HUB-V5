import type { Env } from "./env";
import type { OAuthIdentity } from "./db";

const API_BASE = "https://api.github.com";
const USER_AGENT = "mdc-hub-github-oauth";

export interface GithubRepoSummary {
  fullName: string;
  owner: string;
  name: string;
  description: string;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  private: boolean;
  updatedAt: string;
}

export function githubConfigured(env: Env): boolean {
  return Boolean(env.GITHUB_CLIENT_ID?.trim() && env.GITHUB_CLIENT_SECRET?.trim());
}

function headers(token?: string): Headers {
  const result = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
  });
  if (token) result.set("Authorization", `Bearer ${token}`);
  return result;
}

export function buildGithubAuthorizeUrl(
  env: Env,
  state: string,
  redirectUri: string,
): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  // Public repo metadata is read through the unauthenticated GitHub API.
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  return url.toString();
}

export async function exchangeGithubCode(
  env: Env,
  code: string,
  redirectUri: string,
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID ?? "",
      client_secret: env.GITHUB_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`github_token_${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!payload.access_token) {
    throw new Error(payload.error || "github_token_missing");
  }
  return payload.access_token;
}

export async function fetchGithubProfile(accessToken: string): Promise<OAuthIdentity> {
  const response = await fetch(`${API_BASE}/user`, {
    headers: headers(accessToken),
  });

  if (!response.ok) {
    throw new Error(`github_user_${response.status}`);
  }

  const profile = (await response.json()) as {
    id?: number;
    login?: string;
    name?: string | null;
    avatar_url?: string | null;
  };

  if (!profile.id || !profile.login) throw new Error("github_user_incomplete");

  return {
    id: String(profile.id),
    username: profile.login,
    displayName: (profile.name || profile.login).trim(),
    avatarUrl: profile.avatar_url || null,
  };
}

function toSummary(value: unknown): GithubRepoSummary | null {
  if (!value || typeof value !== "object") return null;
  const repo = value as Record<string, unknown>;
  if (
    typeof repo.full_name !== "string" ||
    typeof repo.name !== "string" ||
    typeof repo.html_url !== "string"
  ) {
    return null;
  }

  const owner =
    repo.owner && typeof repo.owner === "object"
      ? (repo.owner as { login?: unknown }).login
      : "";
  if (typeof owner !== "string" || !owner) return null;

  const topics = Array.isArray(repo.topics)
    ? repo.topics.filter((topic): topic is string => typeof topic === "string").slice(0, 8)
    : [];

  return {
    fullName: repo.full_name,
    owner,
    name: repo.name,
    description: typeof repo.description === "string" ? repo.description.slice(0, 240) : "",
    htmlUrl: repo.html_url,
    homepage: typeof repo.homepage === "string" && repo.homepage ? repo.homepage : null,
    language: typeof repo.language === "string" ? repo.language : null,
    stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
    forks: typeof repo.forks_count === "number" ? repo.forks_count : 0,
    topics,
    private: Boolean(repo.private),
    updatedAt:
      typeof repo.updated_at === "string" ? repo.updated_at : new Date(0).toISOString(),
  };
}

export async function listGithubRepos(login: string): Promise<GithubRepoSummary[]> {
  const response = await fetch(
    `${API_BASE}/users/${encodeURIComponent(login)}/repos?type=owner&sort=updated&per_page=100`,
    { headers: headers() },
  );

  if (!response.ok) {
    throw new Error(`github_repos_${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) return [];

  return payload
    .map(toSummary)
    .filter((repo): repo is GithubRepoSummary => repo !== null && !repo.private);
}

export async function fetchGithubRepo(fullName: string): Promise<GithubRepoSummary> {
  const response = await fetch(`${API_BASE}/repos/${fullName}`, {
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error(`github_repo_${response.status}`);
  }

  const repo = toSummary(await response.json());
  if (!repo) throw new Error("github_repo_incomplete");
  return repo;
}

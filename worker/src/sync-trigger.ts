import type { Env } from "./env";

const REPO = "MDCforLEGAL/MDC-HUB-V5";
const WORKFLOW = "deploy-pages.yml";
const REF = "main";
const WORKFLOW_API = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}`;
const MIN_GAP_MS = 9 * 60 * 1000;

interface WorkflowRun {
  status?: string;
  created_at?: string;
}

/**
 * GitHub's own `schedule` event is best-effort and can go hours without
 * firing. Cloudflare Cron calls this instead and dispatches the Pages
 * workflow, so the library keeps syncing on a predictable cadence.
 */
export async function triggerLibrarySync(env: Env): Promise<void> {
  const token = (env.SYNC_TRIGGER_TOKEN ?? "").trim();
  if (!token) {
    console.warn("[sync] SYNC_TRIGGER_TOKEN is not configured; skipping dispatch");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "mdc-hub-sync-cron",
  };

  try {
    const latestResponse = await fetch(`${WORKFLOW_API}/runs?branch=${REF}&per_page=1`, {
      headers,
    });

    if (latestResponse.ok) {
      const payload = (await latestResponse.json()) as { workflow_runs?: WorkflowRun[] };
      const latest = payload.workflow_runs?.[0];
      const createdAt = latest?.created_at ? Date.parse(latest.created_at) : NaN;

      if (
        latest &&
        (latest.status === "queued" ||
          latest.status === "in_progress" ||
          latest.status === "waiting" ||
          latest.status === "requested" ||
          latest.status === "pending")
      ) {
        console.log(`[sync] latest run is ${latest.status}; skipping`);
        return;
      }

      if (Number.isFinite(createdAt) && Date.now() - createdAt < MIN_GAP_MS) {
        console.log("[sync] a run started recently; skipping duplicate dispatch");
        return;
      }
    } else {
      console.warn(`[sync] latest-run lookup returned ${latestResponse.status}`);
    }

    const response = await fetch(`${WORKFLOW_API}/dispatches`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: REF }),
    });

    if (!response.ok) {
      const body = (await response.text()).slice(0, 240);
      console.error(`[sync] dispatch failed: ${response.status} ${body}`);
      return;
    }

    console.log("[sync] workflow dispatch requested");
  } catch (error) {
    console.error("[sync] trigger failed", error);
  }
}

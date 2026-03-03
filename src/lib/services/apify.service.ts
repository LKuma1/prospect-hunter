import { env } from '@/lib/env';

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~instagram-search-scraper';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export interface ApifyProfile {
  username: string;
  fullName: string | null;
  biography: string | null;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  profilePicUrl: string | null;
  url: string;
}

async function apifyFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${APIFY_BASE}${path}${path.includes('?') ? '&' : '?'}token=${env.APIFY_TOKEN}`;
  return fetch(url, options);
}

async function runActor(input: Record<string, unknown>): Promise<string> {
  const res = await apifyFetch(`/acts/${ACTOR_ID}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Apify actor run failed: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return data.data.id as string;
}

async function pollRunStatus(runId: string): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await apifyFetch(`/actor-runs/${runId}`);
    if (!res.ok) throw new Error(`Falha ao verificar status do run ${runId}`);

    const data = await res.json();
    const { status, defaultDatasetId } = data.data;

    if (status === 'SUCCEEDED') return defaultDatasetId as string;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${runId} terminou com status: ${status}`);
    }
  }

  throw new Error('Timeout esperando Apify Actor completar (120s)');
}

async function fetchDataset(datasetId: string): Promise<ApifyProfile[]> {
  const res = await apifyFetch(`/datasets/${datasetId}/items?clean=true`);
  if (!res.ok) throw new Error('Falha ao buscar resultados do Apify dataset');
  return res.json() as Promise<ApifyProfile[]>;
}

export async function searchInstagramProfiles(params: {
  nicho: string;
  location?: string;
  limit: number;
}): Promise<ApifyProfile[]> {
  const searchQuery = params.location
    ? `${params.nicho} ${params.location}`
    : params.nicho;

  let runId: string;

  try {
    runId = await runActor({ search: searchQuery, resultsLimit: params.limit });
  } catch (err) {
    if (err instanceof Error && err.message.includes('429')) {
      await new Promise((r) => setTimeout(r, 60_000));
      runId = await runActor({ search: searchQuery, resultsLimit: params.limit });
    } else {
      throw err;
    }
  }

  const datasetId = await pollRunStatus(runId);
  return fetchDataset(datasetId);
}

export async function testApifyConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await apifyFetch('/users/me');
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

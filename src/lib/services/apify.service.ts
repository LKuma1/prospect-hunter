import { env } from '@/lib/env';

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~instagram-scraper';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 180_000;

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

type RawItem = Record<string, unknown>;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

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
    throw new Error(`Apify actor run failed: ${(err as { error?: { message?: string } })?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return (data as { data: { id: string } }).data.id;
}

async function pollRunStatus(runId: string): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await apifyFetch(`/actor-runs/${runId}`);
    if (!res.ok) throw new Error(`Falha ao verificar status do run ${runId}`);

    const data = await res.json();
    const { status, defaultDatasetId } = (data as { data: { status: string; defaultDatasetId: string } }).data;

    if (status === 'SUCCEEDED') return defaultDatasetId;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${runId} terminou com status: ${status}`);
    }
  }

  throw new Error('Timeout esperando Apify Actor completar (180s)');
}

async function fetchDatasetRaw(datasetId: string): Promise<RawItem[]> {
  const res = await apifyFetch(`/datasets/${datasetId}/items?clean=true`);
  if (!res.ok) throw new Error('Falha ao buscar resultados do Apify dataset');
  const raw = (await res.json()) as RawItem[];
  return raw.filter((item) => !item.error);
}

// ---------------------------------------------------------------------------
// Hashtag URL builder
// ---------------------------------------------------------------------------

function buildHashtagUrls(nicho: string, location?: string): string[] {
  const cleanNicho = nicho
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  const urls: string[] = [];

  if (location) {
    const cleanLoc = location
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
    urls.push(`https://www.instagram.com/explore/tags/${cleanNicho}${cleanLoc}/`);
  }

  urls.push(`https://www.instagram.com/explore/tags/${cleanNicho}/`);
  return urls;
}

// ---------------------------------------------------------------------------
// Profile extraction from post item (hashtag scrape response)
// ---------------------------------------------------------------------------

function extractProfileFromPost(raw: RawItem): ApifyProfile | null {
  const owner = raw.owner as RawItem | undefined;

  const username = ((owner?.username ?? raw.ownerUsername ?? raw.username) as string | undefined)?.trim();
  if (!username) return null;

  return {
    username,
    fullName: ((owner?.fullName ?? owner?.full_name ?? raw.ownerFullName ?? null) as string | null),
    biography: ((owner?.biography ?? owner?.bio ?? raw.ownerBio ?? null) as string | null),
    followersCount: Number(owner?.followersCount ?? owner?.followers ?? raw.ownerFollowersCount ?? 0),
    followsCount: Number(owner?.followsCount ?? owner?.follows ?? raw.ownerFollowsCount ?? 0),
    postsCount: Number(owner?.postsCount ?? owner?.mediaCount ?? raw.ownerPostsCount ?? 0),
    profilePicUrl: ((owner?.profilePicUrl ?? owner?.profile_pic_url ?? raw.ownerProfilePicUrl ?? null) as string | null),
    url: `https://www.instagram.com/${username}/`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchInstagramProfiles(params: {
  nicho: string;
  location?: string;
  limit: number;
}): Promise<ApifyProfile[]> {
  const hashtagUrls = buildHashtagUrls(params.nicho, params.location);

  // Fetch more than needed to account for deduplication and filtering
  const fetchLimit = Math.min(params.limit * 5, 200);

  let runId: string;

  try {
    runId = await runActor({
      directUrls: hashtagUrls,
      resultsType: 'posts',
      resultsLimit: fetchLimit,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('429')) {
      await new Promise((r) => setTimeout(r, 60_000));
      runId = await runActor({
        directUrls: hashtagUrls,
        resultsType: 'posts',
        resultsLimit: fetchLimit,
      });
    } else {
      throw err;
    }
  }

  const datasetId = await pollRunStatus(runId);
  const items = await fetchDatasetRaw(datasetId);

  // Deduplicate by username
  const seen = new Set<string>();
  const profiles: ApifyProfile[] = [];

  for (const item of items) {
    const profile = extractProfileFromPost(item);
    if (profile && !seen.has(profile.username)) {
      seen.add(profile.username);
      profiles.push(profile);
    }
  }

  return profiles;
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

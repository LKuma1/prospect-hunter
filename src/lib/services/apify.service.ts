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
// Username extraction from hashtag post item
// ---------------------------------------------------------------------------

function extractUsernameFromPost(raw: RawItem): string | null {
  const owner = raw.owner as RawItem | undefined;
  const username = ((owner?.username ?? raw.ownerUsername ?? raw.username) as string | undefined)?.trim();
  return username ?? null;
}

// ---------------------------------------------------------------------------
// Profile normalization from full profile detail item
// ---------------------------------------------------------------------------

function normalizeFullProfile(raw: RawItem): ApifyProfile | null {
  const username = ((raw.username ?? raw.userName) as string | undefined)?.trim();
  if (!username) return null;

  // edge_followed_by / edge_follow are GraphQL field names sometimes returned
  const edgeFollowedBy = raw.edge_followed_by as { count?: number } | undefined;
  const edgeFollow = raw.edge_follow as { count?: number } | undefined;
  const edgeMedia = raw.edge_owner_to_timeline_media as { count?: number } | undefined;

  return {
    username,
    fullName: ((raw.fullName ?? raw.full_name ?? null) as string | null),
    biography: ((raw.biography ?? raw.bio ?? null) as string | null),
    followersCount: Number(raw.followersCount ?? raw.followers_count ?? edgeFollowedBy?.count ?? 0),
    followsCount: Number(raw.followsCount ?? raw.follows_count ?? edgeFollow?.count ?? 0),
    postsCount: Number(raw.postsCount ?? raw.mediaCount ?? raw.media_count ?? edgeMedia?.count ?? 0),
    profilePicUrl: ((raw.profilePicUrl ?? raw.profile_pic_url ?? null) as string | null),
    url: ((raw.url ?? `https://www.instagram.com/${username}/`) as string),
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

  // Fetch more posts than needed to get enough unique usernames after dedup
  const fetchLimit = Math.min(params.limit * 5, 200);

  // ── Phase 1: Discover usernames via hashtag posts ──────────────────────────
  let phase1RunId: string;
  try {
    phase1RunId = await runActor({
      directUrls: hashtagUrls,
      resultsType: 'posts',
      resultsLimit: fetchLimit,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('429')) {
      await new Promise((r) => setTimeout(r, 60_000));
      phase1RunId = await runActor({
        directUrls: hashtagUrls,
        resultsType: 'posts',
        resultsLimit: fetchLimit,
      });
    } else {
      throw err;
    }
  }

  const phase1DatasetId = await pollRunStatus(phase1RunId);
  const posts = await fetchDatasetRaw(phase1DatasetId);

  // Collect unique usernames (take up to limit*2 to allow for later filtering)
  const seen = new Set<string>();
  const usernames: string[] = [];
  for (const post of posts) {
    const username = extractUsernameFromPost(post);
    if (username && !seen.has(username)) {
      seen.add(username);
      usernames.push(username);
      if (usernames.length >= params.limit * 2) break;
    }
  }

  if (usernames.length === 0) return [];

  // ── Phase 2: Fetch full profile details (with follower counts) ─────────────
  const profileUrls = usernames.map((u) => `https://www.instagram.com/${u}/`);

  let phase2RunId: string;
  try {
    phase2RunId = await runActor({
      directUrls: profileUrls,
      resultsType: 'details',
      resultsLimit: profileUrls.length,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('429')) {
      await new Promise((r) => setTimeout(r, 60_000));
      phase2RunId = await runActor({
        directUrls: profileUrls,
        resultsType: 'details',
        resultsLimit: profileUrls.length,
      });
    } else {
      throw err;
    }
  }

  const phase2DatasetId = await pollRunStatus(phase2RunId);
  const profileItems = await fetchDatasetRaw(phase2DatasetId);

  const profiles: ApifyProfile[] = [];
  for (const item of profileItems) {
    const profile = normalizeFullProfile(item);
    if (profile) profiles.push(profile);
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

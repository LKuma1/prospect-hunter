import { env } from '@/lib/env';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-1.5-flash';
const MAX_MESSAGE_LENGTH = 300;
const MIN_MESSAGE_LENGTH = 100;

interface GeminiProfile {
  fullName?: string | null;
  username: string;
  bio?: string | null;
  nicho: string;
  followers: number;
}

function fillTemplate(template: string, profile: GeminiProfile): string {
  return template
    .replace(/\{\{fullName\}\}/g, profile.fullName || profile.username)
    .replace(/\{\{username\}\}/g, profile.username)
    .replace(/\{\{bio\}\}/g, profile.bio || 'não informada')
    .replace(/\{\{nicho\}\}/g, profile.nicho)
    .replace(/\{\{followers\}\}/g, String(profile.followers));
}

async function callGemini(
  prompt: string,
  maxOutputTokens = 200
): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 10_000));
    const retry = await fetch(
      `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (!retry.ok) {
      const err = await retry.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${err?.error?.message ?? retry.statusText}`);
    }
    const retryData = await retry.json();
    return retryData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

export async function generateOutreachMessage(
  profile: GeminiProfile,
  promptTemplate: string
): Promise<string> {
  const prompt = fillTemplate(promptTemplate, profile);
  let message = await callGemini(prompt, 200);

  if (message.length > MAX_MESSAGE_LENGTH) {
    message = message.slice(0, MAX_MESSAGE_LENGTH);
  }

  if (message.length < MIN_MESSAGE_LENGTH) {
    throw new Error(
      `Mensagem gerada muito curta (${message.length} chars). Mínimo: ${MIN_MESSAGE_LENGTH}.`
    );
  }

  return message;
}

export async function testGeminiConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await callGemini('ping', 5);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

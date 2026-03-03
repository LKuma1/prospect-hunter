import { z } from 'zod';
import { env } from '@/lib/env';
import { handleApiError } from '@/lib/api-error';

const ServiceSchema = z.object({
  service: z.enum(['apify', 'gemini']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { service } = ServiceSchema.parse(body);

    const start = Date.now();

    if (service === 'apify') {
      const res = await fetch(
        `https://api.apify.com/v2/users/me?token=${env.APIFY_TOKEN}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json({
          success: false,
          message: `✗ Erro: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`,
          latencyMs,
        });
      }

      return Response.json({ success: true, message: '✓ Conectado', latencyMs });
    }

    // gemini
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message ?? res.statusText;
      return Response.json({
        success: false,
        message: `✗ Erro: ${msg}`,
        latencyMs,
      });
    }

    return Response.json({ success: true, message: '✓ Conectado', latencyMs });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return Response.json({ success: false, message: '✗ Erro: timeout (>10s)', latencyMs: 10000 });
    }
    return handleApiError(error);
  }
}

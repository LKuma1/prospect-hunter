import { env } from '@/lib/env';
import { handleApiError } from '@/lib/api-error';

export function maskApiKey(key: string | undefined): string {
  if (!key || key.length < 4) return '(não configurado)';
  return '****' + key.slice(-4);
}

export async function GET() {
  try {
    return Response.json({
      apifyToken: maskApiKey(env.APIFY_TOKEN),
      geminiKey: maskApiKey(env.GEMINI_API_KEY),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

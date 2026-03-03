import { z } from 'zod';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

const SETTINGS_KEYS = [
  'gemini_prompt_template',
  'score_weight_followers',
  'score_weight_bio',
  'score_weight_contact',
] as const;

const PutSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const ScoringWeightsSchema = z.object({
  followers: z.number().int().min(0).max(100),
  bio: z.number().int().min(0).max(100),
  contact: z.number().int().min(0).max(100),
}).refine(
  (data) => data.followers + data.bio + data.contact === 100,
  { message: 'A soma dos pesos deve ser exatamente 100' }
);

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, [...SETTINGS_KEYS]));

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = PutSchema.parse(body);

    // Validate scoring weights if updating them in bulk
    if (key === '__scoring_weights') {
      const parsed = JSON.parse(value);
      ScoringWeightsSchema.parse(parsed);

      await Promise.all([
        db.insert(settings)
          .values({ key: 'score_weight_followers', value: String(parsed.followers), updatedAt: new Date() })
          .onConflictDoUpdate({ target: settings.key, set: { value: String(parsed.followers), updatedAt: new Date() } }),
        db.insert(settings)
          .values({ key: 'score_weight_bio', value: String(parsed.bio), updatedAt: new Date() })
          .onConflictDoUpdate({ target: settings.key, set: { value: String(parsed.bio), updatedAt: new Date() } }),
        db.insert(settings)
          .values({ key: 'score_weight_contact', value: String(parsed.contact), updatedAt: new Date() })
          .onConflictDoUpdate({ target: settings.key, set: { value: String(parsed.contact), updatedAt: new Date() } }),
      ]);

      return Response.json({ success: true });
    }

    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });

    return Response.json({ key, value });
  } catch (error) {
    return handleApiError(error);
  }
}

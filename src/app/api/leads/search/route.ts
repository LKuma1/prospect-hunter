import { z } from 'zod';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { searchInstagramProfiles } from '@/lib/services/apify.service';
import { calculateScore } from '@/lib/services/scoring.service';
import { handleApiError } from '@/lib/api-error';

const SearchSchema = z.object({
  nicho: z.string().min(1, 'Nicho é obrigatório'),
  location: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = SearchSchema.parse(body);

    const profiles = await searchInstagramProfiles(params);

    let inserted = 0;
    let duplicates = 0;
    const insertedLeads = [];

    for (const profile of profiles) {
      if (!profile.username) continue;

      const { score, breakdown } = calculateScore({
        followers: profile.followersCount ?? 0,
        bio: profile.biography ?? '',
        nicho: params.nicho,
      });

      const result = await db
        .insert(leads)
        .values({
          username: profile.username,
          fullName: profile.fullName,
          bio: profile.biography,
          followers: profile.followersCount ?? 0,
          following: profile.followsCount ?? 0,
          postsCount: profile.postsCount ?? 0,
          profileUrl: profile.url ?? `https://instagram.com/${profile.username}`,
          avatarUrl: profile.profilePicUrl,
          nicho: params.nicho,
          score,
          scoreBreakdown: JSON.stringify(breakdown),
          collectedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (result.length > 0) {
        inserted++;
        insertedLeads.push(result[0]);
      } else {
        duplicates++;
      }
    }

    return Response.json({ inserted, duplicates, leads: insertedLeads });
  } catch (error) {
    return handleApiError(error);
  }
}

import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const result = await db
      .selectDistinct({ nicho: leads.nicho })
      .from(leads)
      .orderBy(asc(leads.nicho));

    return Response.json(result.map((r) => r.nicho));
  } catch (error) {
    return handleApiError(error);
  }
}

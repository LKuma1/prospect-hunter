import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.approved, false));

    return Response.json({ count: result[0]?.count ?? 0 });
  } catch (error) {
    return handleApiError(error);
  }
}

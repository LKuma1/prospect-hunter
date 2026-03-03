import { db } from '@/lib/db';
import { messages, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const pending = await db
      .select({
        id: messages.id,
        content: messages.content,
        approved: messages.approved,
        createdAt: messages.createdAt,
        leadId: messages.leadId,
        leadUsername: leads.username,
        leadNicho: leads.nicho,
        leadScore: leads.score,
        leadStatus: leads.status,
      })
      .from(messages)
      .innerJoin(leads, eq(messages.leadId, leads.id))
      .where(eq(messages.approved, false));

    const result = pending.map((row) => ({
      id: row.id,
      content: row.content,
      approved: row.approved,
      createdAt: row.createdAt,
      lead: {
        id: row.leadId,
        username: row.leadUsername,
        nicho: row.leadNicho,
        score: row.leadScore,
        status: row.leadStatus,
      },
    }));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

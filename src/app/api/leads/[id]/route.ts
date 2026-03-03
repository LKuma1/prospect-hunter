import { db } from '@/lib/db';
import { leads, messages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = Number(id);
    if (isNaN(leadId)) {
      return Response.json({ error: 'ID inválido' }, { status: 400 });
    }

    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return Response.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.leadId, leadId))
      .orderBy(desc(messages.createdAt));

    const approvedMessages = allMessages.filter((m) => m.approved);
    const hasPendingMessage = allMessages.some((m) => !m.approved);

    return Response.json({
      ...lead,
      allMessages,
      approvedMessages,
      hasPendingMessage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

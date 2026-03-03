import { z } from 'zod';
import { db } from '@/lib/db';
import { messages, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  content: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messageId = Number(id);
    if (isNaN(messageId)) {
      return Response.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { action, content } = ActionSchema.parse(body);

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return Response.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    if (action === 'approve') {
      const [updated] = await db
        .update(messages)
        .set({
          approved: true,
          content: content ?? message.content,
        })
        .where(eq(messages.id, messageId))
        .returning();

      await db
        .update(leads)
        .set({ status: 'Contatado', statusUpdatedAt: new Date() })
        .where(eq(leads.id, message.leadId));

      return Response.json(updated);
    }

    // reject
    await db.delete(messages).where(eq(messages.id, messageId));
    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

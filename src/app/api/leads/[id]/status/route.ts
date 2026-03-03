import { z } from 'zod';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';

const StatusSchema = z.object({
  status: z.enum(['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = Number(id);
    if (isNaN(leadId)) {
      return Response.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = StatusSchema.parse(body);

    const existing = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!existing) {
      return Response.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    const [updated] = await db
      .update(leads)
      .set({ status, statusUpdatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning({
        id: leads.id,
        username: leads.username,
        status: leads.status,
        statusUpdatedAt: leads.statusUpdatedAt,
      });

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

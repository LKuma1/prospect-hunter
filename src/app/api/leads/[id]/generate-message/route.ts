import { db } from '@/lib/db';
import { leads, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOutreachMessage } from '@/lib/services/gemini.service';
import { getGeminiPromptTemplate } from '@/lib/services/settings.service';
import { handleApiError } from '@/lib/api-error';

export async function POST(
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

    const template = await getGeminiPromptTemplate();
    const content = await generateOutreachMessage(
      {
        fullName: lead.fullName,
        username: lead.username,
        bio: lead.bio,
        nicho: lead.nicho,
        followers: lead.followers,
      },
      template
    );

    const [message] = await db
      .insert(messages)
      .values({
        leadId,
        content,
        approved: false,
        createdAt: new Date(),
      })
      .returning();

    return Response.json(message);
  } catch (error) {
    return handleApiError(error);
  }
}

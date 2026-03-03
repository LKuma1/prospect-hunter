import { db } from '@/lib/db';
import { leads, messages } from '@/lib/db/schema';
import { and, inArray, like, or, gte, lte, desc, eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';
import type { LeadStatus } from '@/types';

const VALID_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado'];

export function escapeCSV(value: string): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusArr = url.searchParams.getAll('status');
    const nichoArr = url.searchParams.getAll('nicho');
    const minScoreRaw = url.searchParams.get('minScore');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');

    const conditions = [];

    if (statusArr.length) {
      const validStatus = statusArr.filter((s): s is LeadStatus =>
        VALID_STATUSES.includes(s as LeadStatus)
      );
      if (validStatus.length) conditions.push(inArray(leads.status, validStatus));
    }

    if (nichoArr.length) {
      conditions.push(inArray(leads.nicho, nichoArr));
    }

    if (minScoreRaw && Number(minScoreRaw) > 0) {
      conditions.push(gte(leads.score, Number(minScoreRaw)));
    }

    if (startDate) {
      conditions.push(gte(leads.collectedAt, new Date(startDate)));
    }

    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(leads.collectedAt, endOfDay));
    }

    if (search) {
      conditions.push(
        or(
          like(leads.username, `%${search}%`),
          like(leads.nicho, `%${search}%`)
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const allLeads = await db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.collectedAt));

    // Fetch last approved message per lead
    const leadIds = allLeads.map((l) => l.id);

    const lastMessages: Record<number, string> = {};
    if (leadIds.length > 0) {
      const msgRows = await db
        .select({
          leadId: messages.leadId,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.leadId, leadIds),
            eq(messages.approved, true)
          )
        )
        .orderBy(desc(messages.createdAt));

      // Keep only the latest per lead (already ordered desc)
      for (const row of msgRows) {
        if (!(row.leadId in lastMessages)) {
          lastMessages[row.leadId] = row.content;
        }
      }
    }

    const headers = [
      'username',
      'full_name',
      'bio',
      'followers',
      'nicho',
      'score',
      'status',
      'collected_at',
      'last_message',
    ];

    const rows = allLeads.map((lead) => [
      escapeCSV(lead.username),
      escapeCSV(lead.fullName ?? ''),
      escapeCSV(lead.bio ?? ''),
      lead.followers,
      escapeCSV(lead.nicho),
      lead.score,
      lead.status,
      new Date(lead.collectedAt).toLocaleDateString('pt-BR'),
      escapeCSV(lastMessages[lead.id] ?? ''),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const date = new Date().toISOString().split('T')[0];

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${date}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

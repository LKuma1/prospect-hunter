import { z } from 'zod';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { and, inArray, like, or, gte, lte, desc, count } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';
import type { LeadStatus } from '@/types';

const VALID_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado'];

const QuerySchema = z.object({
  status: z.array(z.string()).optional(),
  nicho: z.array(z.string()).optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusArr = url.searchParams.getAll('status');
    const nichoArr = url.searchParams.getAll('nicho');
    const minScoreRaw = url.searchParams.get('minScore');
    const startDate = url.searchParams.get('startDate') ?? undefined;
    const endDate = url.searchParams.get('endDate') ?? undefined;

    const params = QuerySchema.parse({
      status: statusArr.length ? statusArr : undefined,
      nicho: nichoArr.length ? nichoArr : undefined,
      minScore: minScoreRaw ? Number(minScoreRaw) : undefined,
      startDate,
      endDate,
      search: url.searchParams.get('search') ?? undefined,
      page: Number(url.searchParams.get('page') ?? 1),
      limit: Number(url.searchParams.get('limit') ?? 25),
    });

    const conditions = [];

    if (params.status?.length) {
      const validStatus = params.status.filter((s): s is LeadStatus =>
        VALID_STATUSES.includes(s as LeadStatus)
      );
      if (validStatus.length) conditions.push(inArray(leads.status, validStatus));
    }

    if (params.nicho?.length) {
      conditions.push(inArray(leads.nicho, params.nicho));
    }

    if (params.minScore !== undefined && params.minScore > 0) {
      conditions.push(gte(leads.score, params.minScore));
    }

    if (params.startDate) {
      conditions.push(gte(leads.collectedAt, new Date(params.startDate)));
    }

    if (params.endDate) {
      const endOfDay = new Date(params.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(leads.collectedAt, endOfDay));
    }

    if (params.search) {
      conditions.push(
        or(
          like(leads.username, `%${params.search}%`),
          like(leads.nicho, `%${params.search}%`)
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(leads)
        .where(where)
        .orderBy(desc(leads.collectedAt))
        .limit(params.limit)
        .offset((params.page - 1) * params.limit),
      db.select({ count: count() }).from(leads).where(where),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return Response.json({
      data,
      total,
      page: params.page,
      pages: Math.ceil(total / params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

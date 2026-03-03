import { Suspense } from 'react';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { ExportCSVButton } from '@/components/leads/ExportCSVButton';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { and, inArray, like, or, gte, lte, desc, count } from 'drizzle-orm';
import type { LeadStatus, PaginatedResponse, Lead } from '@/types';

const VALID_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado'];

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildFilterParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();

  const appendArray = (key: string) => {
    const val = searchParams[key];
    if (val) {
      (Array.isArray(val) ? val : [val]).forEach((v) => params.append(key, v));
    }
  };

  appendArray('status');
  appendArray('nicho');
  if (searchParams.search) params.set('search', searchParams.search as string);
  if (searchParams.minScore) params.set('minScore', searchParams.minScore as string);
  if (searchParams.startDate) params.set('startDate', searchParams.startDate as string);
  if (searchParams.endDate) params.set('endDate', searchParams.endDate as string);
  if (searchParams.page) params.set('page', searchParams.page as string);
  if (searchParams.limit) params.set('limit', searchParams.limit as string);

  return params;
}

async function fetchLeads(searchParams: Record<string, string | string[] | undefined>): Promise<PaginatedResponse<Lead>> {
  const getArr = (key: string): string[] => {
    const val = searchParams[key];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  const statusArr = getArr('status');
  const nichoArr = getArr('nicho');
  const minScore = searchParams.minScore ? Number(searchParams.minScore) : undefined;
  const startDate = searchParams.startDate as string | undefined;
  const endDate = searchParams.endDate as string | undefined;
  const search = searchParams.search as string | undefined;
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.limit ?? 25)));

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

  if (minScore !== undefined && minScore > 0) {
    conditions.push(gte(leads.score, minScore));
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

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.collectedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(leads).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as Lead[],
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const resolvedParams = await searchParams;
  const data = await fetchLeads(resolvedParams);
  const filterParams = buildFilterParams(resolvedParams).toString();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.total} lead{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
          </p>
        </div>
        <ExportCSVButton filterParams={filterParams} />
      </div>
      <Suspense>
        <LeadFilters />
      </Suspense>
      <Suspense>
        <LeadsTable data={data} />
      </Suspense>
    </div>
  );
}

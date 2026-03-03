import { Suspense } from 'react';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { ExportCSVButton } from '@/components/leads/ExportCSVButton';
import type { PaginatedResponse, Lead } from '@/types';

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
  const params = buildFilterParams(searchParams);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/leads?${params.toString()}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Falha ao buscar leads');
  return res.json();
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

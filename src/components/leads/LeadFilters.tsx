'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { apiRequest } from '@/lib/api-client';
import type { LeadStatus } from '@/types';

const ALL_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado'];

export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') ?? '';
  const currentStatuses = searchParams.getAll('status') as LeadStatus[];
  const currentNichos = searchParams.getAll('nicho');
  const currentMinScore = Number(searchParams.get('minScore') ?? '0');
  const currentStartDate = searchParams.get('startDate') ?? '';
  const currentEndDate = searchParams.get('endDate') ?? '';

  const [nichoOptions, setNichoOptions] = useState<string[]>([]);

  useEffect(() => {
    apiRequest<string[]>('/leads/niches').then(setNichoOptions).catch(() => {});
  }, []);

  const buildAndPush = useCallback(
    (overrides: Record<string, string | string[] | undefined>) => {
      const current: Record<string, string | string[]> = {
        search: currentSearch,
        status: currentStatuses,
        nicho: currentNichos,
        minScore: currentMinScore > 0 ? String(currentMinScore) : '',
        startDate: currentStartDate,
        endDate: currentEndDate,
      };

      const merged = { ...current, ...overrides };
      const params = new URLSearchParams();
      params.set('page', '1');

      if (merged.search) params.set('search', merged.search as string);
      (merged.status as string[]).forEach((s) => params.append('status', s));
      (merged.nicho as string[]).forEach((n) => params.append('nicho', n));
      if (merged.minScore) params.set('minScore', merged.minScore as string);
      if (merged.startDate) params.set('startDate', merged.startDate as string);
      if (merged.endDate) params.set('endDate', merged.endDate as string);

      router.push(`/leads?${params.toString()}`);
    },
    [router, currentSearch, currentStatuses, currentNichos, currentMinScore, currentStartDate, currentEndDate]
  );

  const toggleStatus = (status: LeadStatus) => {
    const next = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    buildAndPush({ status: next });
  };

  const toggleNicho = (nicho: string) => {
    const next = currentNichos.includes(nicho)
      ? currentNichos.filter((n) => n !== nicho)
      : [...currentNichos, nicho];
    buildAndPush({ nicho: next });
  };

  return (
    <div className="space-y-3">
      {/* Search + dates row */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar por username ou nicho..."
          defaultValue={currentSearch}
          onBlur={(e) => buildAndPush({ search: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') buildAndPush({ search: (e.target as HTMLInputElement).value });
          }}
          className="w-64"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">De</label>
          <input
            type="date"
            defaultValue={currentStartDate}
            onChange={(e) => buildAndPush({ startDate: e.target.value })}
            className="h-9 rounded-md border border-gray-200 px-2 text-sm"
          />
          <label className="text-xs text-gray-500">até</label>
          <input
            type="date"
            defaultValue={currentEndDate}
            onChange={(e) => buildAndPush({ endDate: e.target.value })}
            className="h-9 rounded-md border border-gray-200 px-2 text-sm"
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-gray-500 font-medium">Status:</span>
        {ALL_STATUSES.map((status) => {
          const active = currentStatuses.includes(status);
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Nicho filter */}
      {nichoOptions.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-500 font-medium">Nicho:</span>
          {nichoOptions.map((nicho) => {
            const active = currentNichos.includes(nicho);
            return (
              <button
                key={nicho}
                onClick={() => toggleNicho(nicho)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {nicho}
              </button>
            );
          })}
        </div>
      )}

      {/* Score slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 font-medium w-24">Score mín.:</span>
        <div className="w-48">
          <Slider
            min={0}
            max={100}
            step={5}
            value={[currentMinScore]}
            onValueChange={([val]) => buildAndPush({ minScore: val > 0 ? String(val) : '' })}
          />
        </div>
        <span className="text-xs font-semibold text-gray-700 w-8">{currentMinScore}</span>
      </div>
    </div>
  );
}

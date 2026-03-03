'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LeadScoreBadge } from './LeadScoreBadge';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import type { Lead, LeadStatus, PaginatedResponse } from '@/types';

interface LeadsTableProps {
  data: PaginatedResponse<Lead>;
}

export function LeadsTable({ data }: LeadsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (leadId: number, newStatus: LeadStatus) => {
    // O estado é gerenciado pelo LeadStatusDropdown; aqui não precisamos re-fetch
    void leadId;
    void newStatus;
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coletado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">@{lead.username}</TableCell>
                  <TableCell>{lead.nicho}</TableCell>
                  <TableCell>{lead.followers.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <LeadScoreBadge score={lead.score} />
                  </TableCell>
                  <TableCell>
                    <LeadStatusDropdown
                      leadId={lead.id}
                      currentStatus={lead.status}
                      onStatusChange={(s) => handleStatusChange(lead.id, s)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(lead.collectedAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/leads/${lead.id}?from=/leads?${searchParams.toString()}`}
                    >
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {data.total} lead{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => goToPage(data.page - 1)}
            >
              Anterior
            </Button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {data.page} / {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.pages}
              onClick={() => goToPage(data.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

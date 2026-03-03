'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/api-client';
import type { LeadStatus } from '@/types';

interface LeadStatusDropdownProps {
  leadId: number;
  currentStatus: LeadStatus;
  onStatusChange?: (status: LeadStatus) => void;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  Novo: 'text-gray-600',
  Contatado: 'text-blue-600',
  Respondeu: 'text-yellow-600',
  Fechado: 'text-green-600',
  Descartado: 'text-red-600',
};

const STATUS_OPTIONS: LeadStatus[] = [
  'Novo',
  'Contatado',
  'Respondeu',
  'Fechado',
  'Descartado',
];

export function LeadStatusDropdown({
  leadId,
  currentStatus,
  onStatusChange,
}: LeadStatusDropdownProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: string) => {
    const typed = newStatus as LeadStatus;
    setLoading(true);
    try {
      await apiRequest(`/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: typed }),
      });
      setStatus(typed);
      onStatusChange?.(typed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="h-7 text-xs w-36">
        <SelectValue>
          <span className={STATUS_COLORS[status]}>{status}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-xs">
            <span className={STATUS_COLORS[opt]}>{opt}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

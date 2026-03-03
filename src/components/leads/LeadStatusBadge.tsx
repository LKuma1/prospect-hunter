import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/types';

const STATUS_STYLES: Record<LeadStatus, string> = {
  Novo: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  Contatado: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Respondeu: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  Fechado: 'bg-green-100 text-green-700 hover:bg-green-100',
  Descartado: 'bg-red-100 text-red-700 hover:bg-red-100',
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}

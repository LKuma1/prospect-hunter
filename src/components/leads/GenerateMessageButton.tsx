'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/stores/app.store';

interface GenerateMessageButtonProps {
  leadId: number;
  hasPendingMessage: boolean;
}

export function GenerateMessageButton({
  leadId,
  hasPendingMessage: initialHasPending,
}: GenerateMessageButtonProps) {
  const [hasPendingMessage, setHasPendingMessage] = useState(initialHasPending);
  const [loading, setLoading] = useState(false);
  const { setPendingApprovals, pendingApprovals } = useAppStore();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await apiRequest(`/leads/${leadId}/generate-message`, { method: 'POST' });
      toast.success('Mensagem gerada! Acesse Aprovações para revisar.');
      setHasPendingMessage(true);
      setPendingApprovals(pendingApprovals + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar mensagem.');
    } finally {
      setLoading(false);
    }
  };

  if (hasPendingMessage) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sparkles className="w-4 h-4 mr-2" />
        Mensagem pendente de aprovação
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleGenerate} disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      Gerar Mensagem IA
    </Button>
  );
}

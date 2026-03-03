'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge';
import { apiRequest } from '@/lib/api-client';
import type { LeadStatus } from '@/types';

interface ApprovalCardProps {
  message: {
    id: number;
    content: string;
    leadId: number;
    lead: {
      id: number;
      username: string;
      nicho: string;
      score: number;
      status: LeadStatus;
    };
  };
  onAction: () => void;
}

type LoadingAction = 'approve' | 'reject' | 'regenerate' | null;

export function ApprovalCard({ message, onAction }: ApprovalCardProps) {
  const [content, setContent] = useState(message.content);
  const [loading, setLoading] = useState<LoadingAction>(null);

  const handleApprove = async () => {
    setLoading('approve');
    try {
      await apiRequest(`/messages/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve', content }),
      });
      toast.success('Mensagem aprovada! Lead marcado como Contatado.');
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar mensagem.');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await apiRequest(`/messages/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject' }),
      });
      toast.success('Mensagem descartada.');
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao descartar mensagem.');
    } finally {
      setLoading(null);
    }
  };

  const handleRegenerate = async () => {
    setLoading('regenerate');
    try {
      const newMessage = await apiRequest<{ content: string }>(
        `/leads/${message.lead.id}/generate-message`,
        { method: 'POST' }
      );
      setContent(newMessage.content);
      toast.success('Mensagem regenerada com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao regenerar mensagem.');
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-semibold text-gray-800">@{message.lead.username}</p>
          <p className="text-sm text-gray-500">{message.lead.nicho}</p>
        </div>
        <div className="ml-auto">
          <LeadScoreBadge score={message.lead.score} />
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
        rows={4}
        className="w-full p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={handleRegenerate}
        >
          {loading === 'regenerate' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Regenerar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isLoading}
          onClick={handleReject}
        >
          {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Descartar
        </Button>
        <Button
          size="sm"
          disabled={isLoading}
          onClick={handleApprove}
        >
          {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Aprovar
        </Button>
      </div>
    </div>
  );
}

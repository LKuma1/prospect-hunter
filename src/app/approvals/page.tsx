'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/stores/app.store';
import { ApprovalCard } from '@/components/messages/ApprovalCard';
import type { LeadStatus } from '@/types';

interface PendingMessage {
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
}

export default function ApprovalsPage() {
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPendingApprovals, decrementApprovals } = useAppStore();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await apiRequest<PendingMessage[]>('/messages');
        setMessages(data);
        setPendingApprovals(data.length);
      } catch {
        toast.error('Erro ao carregar mensagens pendentes.');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [setPendingApprovals]);

  const handleAction = (messageId: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    decrementApprovals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Aprovações Pendentes</h1>
        <span className="text-sm text-gray-500">
          {messages.length} mensagem{messages.length !== 1 ? 'ns' : ''} pendente{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-lg font-medium">Nenhuma aprovação pendente</p>
          <p className="text-sm mt-1">Todas as mensagens foram revisadas!</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {messages.map((message) => (
            <ApprovalCard
              key={message.id}
              message={message}
              onAction={() => handleAction(message.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

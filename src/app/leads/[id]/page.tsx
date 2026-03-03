import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Users, FileText } from 'lucide-react';
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge';
import { LeadStatusDropdown } from '@/components/leads/LeadStatusDropdown';
import { GenerateMessageButton } from '@/components/leads/GenerateMessageButton';
import { BackToLeadsButton } from '@/components/leads/BackToLeadsButton';
import { db } from '@/lib/db';
import { leads, messages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Lead, Message, ScoreBreakdown } from '@/types';

interface LeadDetailData extends Lead {
  allMessages: Message[];
  approvedMessages: Message[];
  hasPendingMessage: boolean;
}

async function getLeadDetail(id: string): Promise<LeadDetailData | null> {
  const leadId = Number(id);
  if (isNaN(leadId)) return null;

  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
  });

  if (!lead) return null;

  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.leadId, leadId))
    .orderBy(desc(messages.createdAt));

  const approvedMessages = allMessages.filter((m) => m.approved);
  const hasPendingMessage = allMessages.some((m) => !m.approved);

  return {
    ...(lead as Lead),
    allMessages: allMessages as Message[],
    approvedMessages: approvedMessages as Message[],
    hasPendingMessage,
  };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadDetail(id);

  if (!lead) notFound();

  const breakdown: ScoreBreakdown = (() => {
    try {
      return JSON.parse(lead.scoreBreakdown);
    } catch {
      return { followers: 0, bioKeywords: 0, contactInBio: 0 };
    }
  })();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Suspense fallback={null}>
        <BackToLeadsButton />
      </Suspense>

      {/* Header */}
      <div className="bg-white rounded-lg border p-5 space-y-3">
        <div className="flex items-start gap-4">
          {lead.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lead.avatarUrl}
              alt={lead.username}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">@{lead.username}</h1>
            {lead.fullName && (
              <p className="text-gray-600">{lead.fullName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {lead.nicho}
              </span>
              {lead.location && (
                <span className="text-sm text-gray-500">{lead.location}</span>
              )}
            </div>
          </div>
          <LeadScoreBadge score={lead.score} />
        </div>

        {lead.bio && (
          <p className="text-sm text-gray-600 border-t pt-3">{lead.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Seguidores', value: lead.followers.toLocaleString('pt-BR') },
          { label: 'Seguindo', value: lead.following.toLocaleString('pt-BR') },
          { label: 'Posts', value: lead.postsCount.toLocaleString('pt-BR') },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Score breakdown */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Followers', pts: breakdown.followers },
            { label: 'Bio Keywords', pts: breakdown.bioKeywords },
            { label: 'Contato na Bio', pts: breakdown.contactInBio },
          ].map(({ label, pts }) => (
            <div key={label} className="bg-gray-50 rounded p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{pts}pts</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status no Funil</h2>
        <LeadStatusDropdown leadId={lead.id} currentStatus={lead.status} />
        {lead.statusUpdatedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Atualizado em{' '}
            {new Date(lead.statusUpdatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* Generate message button */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Mensagem de Outreach</h2>
        <GenerateMessageButton
          leadId={lead.id}
          hasPendingMessage={lead.hasPendingMessage}
        />
      </div>

      {/* All messages (approved + pending) */}
      {lead.allMessages.length > 0 && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Histórico de Mensagens ({lead.allMessages.length})
          </h2>
          <div className="space-y-2">
            {lead.allMessages.map((msg) => (
              <div key={msg.id} className="bg-gray-50 rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      msg.approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {msg.approved ? 'Aprovada' : 'Pendente'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-gray-800">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Users className="w-3 h-3" />
        <span>
          Coletado em {new Date(lead.collectedAt).toLocaleDateString('pt-BR')} |{' '}
          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Ver perfil no Instagram
          </a>
        </span>
      </div>
    </div>
  );
}

import { Users, Plus, CheckSquare, TrendingUp, Trophy } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { LeadsBarChart } from '@/components/dashboard/LeadsBarChart';
import type { DashboardKPIs } from '@/types';

async function getKPIs(): Promise<DashboardKPIs> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/kpis`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('Erro ao buscar KPIs');
    return res.json();
  } catch {
    return {
      totalLeads: 0,
      newToday: 0,
      pendingApprovals: 0,
      responseRate: 0,
      closedLeads: 0,
      leadsPerDay: [],
    };
  }
}

export default async function HomePage() {
  const kpis = await getKPIs();

  const responseRateColor =
    kpis.responseRate >= 20 ? 'green' : kpis.responseRate >= 10 ? 'yellow' : 'red';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do funil de prospecção</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KPICard
          title="Total de Leads"
          value={kpis.totalLeads.toLocaleString('pt-BR')}
          icon={Users}
        />
        <KPICard
          title="Novos Hoje"
          value={kpis.newToday.toLocaleString('pt-BR')}
          icon={Plus}
          subtitle="coletados hoje"
        />
        <KPICard
          title="Aprovações Pendentes"
          value={kpis.pendingApprovals.toLocaleString('pt-BR')}
          icon={CheckSquare}
          subtitle="mensagens aguardando revisão"
        />
        <KPICard
          title="Taxa de Resposta"
          value={`${kpis.responseRate}%`}
          icon={TrendingUp}
          subtitle="Respondeu / Contatado"
          valueColor={responseRateColor}
        />
        <KPICard
          title="Leads Fechados"
          value={kpis.closedLeads.toLocaleString('pt-BR')}
          icon={Trophy}
          subtitle="negócios fechados"
          valueColor={kpis.closedLeads > 0 ? 'green' : 'default'}
        />
      </div>

      <LeadsBarChart data={kpis.leadsPerDay} />
    </div>
  );
}

import { Users, Plus, CheckSquare, TrendingUp, Trophy } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { LeadsBarChart } from '@/components/dashboard/LeadsBarChart';
import { db } from '@/lib/db';
import { leads, messages } from '@/lib/db/schema';
import { eq, gte, sql, count } from 'drizzle-orm';
import type { DashboardKPIs } from '@/types';

async function getKPIs(): Promise<DashboardKPIs> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      [totalRow],
      [newTodayRow],
      [pendingRow],
      [respondedRow],
      [contactedRow],
      [closedRow],
      chartData,
    ] = await Promise.all([
      db.select({ count: count() }).from(leads),
      db.select({ count: count() }).from(leads).where(gte(leads.collectedAt, todayStart)),
      db.select({ count: count() }).from(messages).where(eq(messages.approved, false)),
      db.select({ count: count() }).from(leads).where(eq(leads.status, 'Respondeu')),
      db.select({ count: count() }).from(leads).where(eq(leads.status, 'Contatado')),
      db.select({ count: count() }).from(leads).where(eq(leads.status, 'Fechado')),
      db
        .select({
          date: sql<string>`to_char(${leads.collectedAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(leads)
        .where(gte(leads.collectedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .groupBy(sql`to_char(${leads.collectedAt}, 'YYYY-MM-DD')`),
    ]);

    const contacted = contactedRow?.count ?? 0;
    const responded = respondedRow?.count ?? 0;
    const responseRate = contacted > 0 ? parseFloat(((responded / contacted) * 100).toFixed(1)) : 0;

    const chartMap = new Map(chartData.map((d) => [d.date, d.count]));
    const leadsPerDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      leadsPerDay.push({ date: dateStr, count: chartMap.get(dateStr) ?? 0 });
    }

    return {
      totalLeads: totalRow?.count ?? 0,
      newToday: newTodayRow?.count ?? 0,
      pendingApprovals: pendingRow?.count ?? 0,
      responseRate,
      closedLeads: closedRow?.count ?? 0,
      leadsPerDay,
    };
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

import { db } from '@/lib/db';
import { leads, messages } from '@/lib/db/schema';
import { eq, gte, sql, count } from 'drizzle-orm';
import { handleApiError } from '@/lib/api-error';
import type { DashboardKPIs } from '@/types';

export async function GET() {
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
        .where(
          gte(
            leads.collectedAt,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        )
        .groupBy(sql`to_char(${leads.collectedAt}, 'YYYY-MM-DD')`),
    ]);

    const contacted = contactedRow?.count ?? 0;
    const responded = respondedRow?.count ?? 0;
    const responseRate = contacted > 0 ? parseFloat(((responded / contacted) * 100).toFixed(1)) : 0;

    // Fill missing days with count=0
    const chartMap = new Map(chartData.map((d) => [d.date, d.count]));
    const leadsPerDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      leadsPerDay.push({ date: dateStr, count: chartMap.get(dateStr) ?? 0 });
    }

    const kpis: DashboardKPIs = {
      totalLeads: totalRow?.count ?? 0,
      newToday: newTodayRow?.count ?? 0,
      pendingApprovals: pendingRow?.count ?? 0,
      responseRate,
      closedLeads: closedRow?.count ?? 0,
      leadsPerDay,
    };

    return Response.json(kpis);
  } catch (error) {
    return handleApiError(error);
  }
}

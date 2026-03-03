import { describe, it, expect } from 'vitest';

describe('KPI calculations', () => {
  it('deve calcular responseRate como 0 quando não há Contatados (divisão por zero)', () => {
    const contacted = 0;
    const responded = 5;
    const responseRate = contacted > 0 ? parseFloat(((responded / contacted) * 100).toFixed(1)) : 0;

    expect(responseRate).toBe(0);
  });

  it('deve calcular responseRate corretamente', () => {
    const contacted = 10;
    const responded = 3;
    const responseRate = contacted > 0 ? parseFloat(((responded / contacted) * 100).toFixed(1)) : 0;

    expect(responseRate).toBe(30);
  });

  it('deve calcular responseRate com arredondamento', () => {
    const contacted = 3;
    const responded = 1;
    const responseRate = contacted > 0 ? parseFloat(((responded / contacted) * 100).toFixed(1)) : 0;

    expect(responseRate).toBe(33.3);
  });

  it('deve preencher 7 dias com count=0 para dias sem leads', () => {
    const chartData: { date: string; count: number }[] = [
      { date: '2026-03-01', count: 5 },
    ];

    const chartMap = new Map(chartData.map((d) => [d.date, d.count]));
    const leadsPerDay: { date: string; count: number }[] = [];

    // Simulate filling 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2026-03-07');
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      leadsPerDay.push({ date: dateStr, count: chartMap.get(dateStr) ?? 0 });
    }

    expect(leadsPerDay).toHaveLength(7);
    expect(leadsPerDay.find((d) => d.date === '2026-03-01')?.count).toBe(5);
    expect(leadsPerDay.find((d) => d.date === '2026-03-02')?.count).toBe(0);
    expect(leadsPerDay.find((d) => d.date === '2026-03-07')?.count).toBe(0);
  });

  it('deve retornar array de 7 dias mesmo sem dados', () => {
    const chartMap = new Map<string, number>();
    const leadsPerDay: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      leadsPerDay.push({ date: dateStr, count: chartMap.get(dateStr) ?? 0 });
    }

    expect(leadsPerDay).toHaveLength(7);
    expect(leadsPerDay.every((d) => d.count === 0)).toBe(true);
  });

  it('deve calcular responseRate como 100% quando todos os contatados responderam', () => {
    const contacted = 5;
    const responded = 5;
    const responseRate = contacted > 0 ? parseFloat(((responded / contacted) * 100).toFixed(1)) : 0;

    expect(responseRate).toBe(100);
  });
});

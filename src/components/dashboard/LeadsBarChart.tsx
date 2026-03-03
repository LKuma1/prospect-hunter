'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LeadsBarChartProps {
  data: { date: string; count: number }[];
}

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

export function LeadsBarChart({ data }: LeadsBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="bg-white rounded-lg border p-5">
      <p className="text-sm font-medium text-gray-500 mb-4">
        Leads coletados nos últimos 7 dias
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [`${value} lead${Number(value) !== 1 ? 's' : ''}`, '']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  valueColor?: 'default' | 'green' | 'yellow' | 'red';
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  valueColor = 'default',
}: KPICardProps) {
  const colorClass = {
    default: 'text-gray-900',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }[valueColor];

  return (
    <div className="bg-white rounded-lg border p-5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

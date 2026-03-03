'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Search,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/approvals', label: 'Aprovações', icon: CheckSquare },
  { href: '/search', label: 'Nova Busca', icon: Search },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { pendingApprovals, setPendingApprovals } = useAppStore();

  useEffect(() => {
    apiRequest<{ count: number }>('/messages/count')
      .then(({ count }) => setPendingApprovals(count))
      .catch(() => {});
  }, [setPendingApprovals]);

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">Prospect Hunter</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {label === 'Aprovações' && pendingApprovals > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingApprovals > 99 ? '99+' : pendingApprovals}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

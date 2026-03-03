'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackToLeadsButton() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/leads';

  return (
    <Link
      href={from}
      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar para Leads
    </Link>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface ServiceState {
  maskedKey: string;
  status: TestStatus;
  message: string;
  latencyMs?: number;
}

const INITIAL: ServiceState = { maskedKey: '...', status: 'idle', message: '' };

export function ApiStatusSettings() {
  const [apify, setApify] = useState<ServiceState>(INITIAL);
  const [gemini, setGemini] = useState<ServiceState>(INITIAL);

  useEffect(() => {
    apiRequest<{ apifyToken: string; geminiKey: string }>('/settings/api-status')
      .then(({ apifyToken, geminiKey }) => {
        setApify((prev) => ({ ...prev, maskedKey: apifyToken }));
        setGemini((prev) => ({ ...prev, maskedKey: geminiKey }));
      })
      .catch(() => {});
  }, []);

  const testConnection = async (service: 'apify' | 'gemini') => {
    const setState = service === 'apify' ? setApify : setGemini;
    setState((prev) => ({ ...prev, status: 'loading', message: '' }));

    try {
      const result = await apiRequest<{ success: boolean; message: string; latencyMs?: number }>(
        '/settings/test-connection',
        {
          method: 'POST',
          body: JSON.stringify({ service }),
        }
      );
      setState((prev) => ({
        ...prev,
        status: result.success ? 'success' : 'error',
        message: result.message,
        latencyMs: result.latencyMs,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        message: `✗ Erro: ${err instanceof Error ? err.message : 'desconhecido'}`,
      }));
    }
  };

  const renderStatus = (state: ServiceState) => {
    if (state.status === 'loading') {
      return (
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Testando...
        </span>
      );
    }
    if (state.status === 'success') {
      return (
        <span className="text-sm text-green-600 font-medium">
          {state.message}
          {state.latencyMs !== undefined && (
            <span className="text-xs text-gray-400 ml-1">({state.latencyMs}ms)</span>
          )}
        </span>
      );
    }
    if (state.status === 'error') {
      return <span className="text-sm text-red-600">{state.message}</span>;
    }
    return null;
  };

  const services = [
    { key: 'apify' as const, label: 'Apify', state: apify },
    { key: 'gemini' as const, label: 'Gemini', state: gemini },
  ];

  return (
    <div className="space-y-4 max-w-md">
      {services.map(({ key, label, state }) => (
        <div key={key} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{state.maskedKey}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testConnection(key)}
              disabled={state.status === 'loading'}
            >
              {state.status === 'loading' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Testar Conexão
            </Button>
          </div>
          {renderStatus(state)}
        </div>
      ))}
    </div>
  );
}

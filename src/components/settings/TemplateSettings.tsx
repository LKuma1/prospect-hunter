'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';

const DEFAULT_TEMPLATE = `Você é especialista em outreach para marketing digital.
Gere uma mensagem direta e profissional para Instagram DM.
A mensagem deve ter entre 100-300 caracteres, mencionar {{fullName}},
referenciar a área {{nicho}}, apresentar serviço de criação de conteúdo
para Instagram e terminar com call-to-action.
Bio: {{bio}} | Seguidores: {{followers}}`;

export function TemplateSettings() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<Record<string, string>>('/settings')
      .then((data) => setContent(data.gemini_prompt_template ?? DEFAULT_TEMPLATE))
      .catch(() => setContent(DEFAULT_TEMPLATE))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: 'gemini_prompt_template', value: content }),
      });
      toast.success('Template salvo!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Prompt do Gemini</p>
        <p className="text-xs text-gray-500 mb-3">
          Placeholders disponíveis:{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{fullName}}'}</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{username}}'}</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{bio}}'}</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{nicho}}'}</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{followers}}'}</code>
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Template
      </Button>
    </div>
  );
}

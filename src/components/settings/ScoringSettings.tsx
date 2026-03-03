'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';

interface Weights {
  followers: number;
  bio: number;
  contact: number;
}

const DEFAULTS: Weights = { followers: 50, bio: 30, contact: 20 };

export function ScoringSettings() {
  const [weights, setWeights] = useState<Weights>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const total = weights.followers + weights.bio + weights.contact;
  const isValid = total === 100;

  useEffect(() => {
    apiRequest<Record<string, string>>('/settings')
      .then((data) => {
        setWeights({
          followers: Number(data.score_weight_followers ?? DEFAULTS.followers),
          bio: Number(data.score_weight_bio ?? DEFAULTS.bio),
          contact: Number(data.score_weight_contact ?? DEFAULTS.contact),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: '__scoring_weights', value: JSON.stringify(weights) }),
      });
      toast.success('Pesos de scoring salvos!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar pesos.');
    } finally {
      setSaving(false);
    }
  };

  const updateWeight = (field: keyof Weights, value: string) => {
    const num = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
    setWeights((prev) => ({ ...prev, [field]: num }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-sm">
      <p className="text-sm text-gray-600">
        Configure a importância de cada critério no cálculo do score. A soma deve ser <strong>100</strong>.
      </p>

      {[
        { label: 'Followers', field: 'followers' as const },
        { label: 'Bio Keywords', field: 'bio' as const },
        { label: 'Contato na Bio', field: 'contact' as const },
      ].map(({ label, field }) => (
        <div key={field} className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-36">{label}</label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights[field]}
            onChange={(e) => updateWeight(field, e.target.value)}
            className="w-20 h-9 rounded-md border border-gray-200 px-3 text-sm text-center"
          />
          <span className="text-xs text-gray-400">pts</span>
        </div>
      ))}

      <div className={`text-sm font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
        Total: {total}/100 {isValid ? '✓' : '— deve somar 100'}
      </div>

      <Button onClick={handleSave} disabled={!isValid || saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Pesos
      </Button>
    </div>
  );
}

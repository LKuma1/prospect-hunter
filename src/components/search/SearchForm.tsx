'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api-client';

interface SearchResult {
  inserted: number;
  duplicates: number;
}

export function SearchForm() {
  const [nicho, setNicho] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicho.trim()) {
      toast.error('Informe o nicho para buscar.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<SearchResult>('/leads/search', {
        method: 'POST',
        body: JSON.stringify({ nicho: nicho.trim(), location: location.trim() || undefined, limit }),
      });
      toast.success(`${result.inserted} leads adicionados, ${result.duplicates} duplicatas ignoradas.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar leads.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-1">
        <Label htmlFor="nicho">Nicho *</Label>
        <Input
          id="nicho"
          value={nicho}
          onChange={(e) => setNicho(e.target.value)}
          placeholder="ex: dentista, psicólogo, eletricista"
          disabled={loading}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="location">Localização (opcional)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="ex: São Paulo, Rio de Janeiro"
          disabled={loading}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="limit">Quantidade</Label>
        <Input
          id="limit"
          type="number"
          min={1}
          max={200}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Buscando...
          </>
        ) : (
          'Buscar Prospects'
        )}
      </Button>
    </form>
  );
}

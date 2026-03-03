import { SearchForm } from '@/components/search/SearchForm';

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nova Busca de Prospects</h1>
      <p className="text-gray-500">
        Busque perfis no Instagram por nicho e localização via Apify.
      </p>
      <SearchForm />
    </div>
  );
}

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateSettings } from '@/components/settings/TemplateSettings';
import { ScoringSettings } from '@/components/settings/ScoringSettings';
import { ApiStatusSettings } from '@/components/settings/ApiStatusSettings';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates de Mensagem</TabsTrigger>
          <TabsTrigger value="scoring">Critérios de Scoring</TabsTrigger>
          <TabsTrigger value="api-status">Status das APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <TemplateSettings />
        </TabsContent>

        <TabsContent value="scoring" className="mt-6">
          <ScoringSettings />
        </TabsContent>

        <TabsContent value="api-status" className="mt-6">
          <ApiStatusSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

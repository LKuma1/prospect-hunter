import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PROMPT_TEMPLATE = `Você é especialista em outreach para marketing digital.
Gere uma mensagem direta e profissional para Instagram DM.
A mensagem deve ter entre 100-300 caracteres, mencionar {{fullName}},
referenciar a área {{nicho}}, apresentar serviço de criação de conteúdo
para Instagram e terminar com call-to-action.
Bio: {{bio}} | Seguidores: {{followers}}`;

export async function getSetting(key: string): Promise<string | null> {
  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return row[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getGeminiPromptTemplate(): Promise<string> {
  const saved = await getSetting('gemini_prompt_template');
  return saved ?? DEFAULT_PROMPT_TEMPLATE;
}

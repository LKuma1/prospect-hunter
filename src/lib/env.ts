import { z } from 'zod';

const envSchema = z.object({
  APIFY_TOKEN: z.string().min(1, 'APIFY_TOKEN é obrigatório'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY é obrigatório'),
});

export const env = envSchema.parse({
  APIFY_TOKEN: process.env.APIFY_TOKEN,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});

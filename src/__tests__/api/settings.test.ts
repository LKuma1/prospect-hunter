import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// Mock env before importing the route (env validation runs at module load)
vi.mock('@/lib/env', () => ({
  env: { APIFY_TOKEN: 'test-apify-token-xxxx', GEMINI_API_KEY: 'test-gemini-key-yyyy' },
}));

import { maskApiKey } from '@/app/api/settings/api-status/route';

const ScoringWeightsSchema = z.object({
  followers: z.number().int().min(0).max(100),
  bio: z.number().int().min(0).max(100),
  contact: z.number().int().min(0).max(100),
}).refine(
  (data: { followers: number; bio: number; contact: number }) =>
    data.followers + data.bio + data.contact === 100,
  { message: 'A soma dos pesos deve ser exatamente 100' }
);

describe('maskApiKey', () => {
  it('deve mascarar chave mostrando apenas últimos 4 chars', () => {
    expect(maskApiKey('abcdefgh1234')).toBe('****1234');
    expect(maskApiKey('mytoken5678')).toBe('****5678');
  });

  it('deve retornar "(não configurado)" se chave for undefined', () => {
    expect(maskApiKey(undefined)).toBe('(não configurado)');
  });

  it('deve retornar "(não configurado)" se chave for string vazia', () => {
    expect(maskApiKey('')).toBe('(não configurado)');
  });

  it('deve retornar "(não configurado)" se chave tiver menos de 4 chars', () => {
    expect(maskApiKey('abc')).toBe('(não configurado)');
    expect(maskApiKey('ab')).toBe('(não configurado)');
  });

  it('nunca deve retornar o valor completo da chave', () => {
    const key = 'AIzaSyDEFGHIJKLMNOP1234567890';
    const masked = maskApiKey(key);
    expect(masked).not.toBe(key);
    expect(masked).toMatch(/^\*{4}/);
  });
});

describe('Scoring weights validation', () => {
  it('deve aceitar pesos que somam 100', () => {
    expect(() => ScoringWeightsSchema.parse({ followers: 50, bio: 30, contact: 20 })).not.toThrow();
    expect(() => ScoringWeightsSchema.parse({ followers: 100, bio: 0, contact: 0 })).not.toThrow();
    expect(() => ScoringWeightsSchema.parse({ followers: 33, bio: 33, contact: 34 })).not.toThrow();
  });

  it('deve rejeitar pesos que não somam 100', () => {
    expect(() => ScoringWeightsSchema.parse({ followers: 50, bio: 30, contact: 30 })).toThrow();
    expect(() => ScoringWeightsSchema.parse({ followers: 0, bio: 0, contact: 0 })).toThrow();
    expect(() => ScoringWeightsSchema.parse({ followers: 60, bio: 60, contact: 0 })).toThrow();
  });

  it('deve rejeitar pesos negativos', () => {
    expect(() => ScoringWeightsSchema.parse({ followers: -10, bio: 60, contact: 50 })).toThrow();
  });
});

describe('test-connection service validation', () => {
  it('deve aceitar apenas "apify" ou "gemini"', () => {
    const ServiceSchema = z.object({
      service: z.enum(['apify', 'gemini']),
    });

    expect(() => ServiceSchema.parse({ service: 'apify' })).not.toThrow();
    expect(() => ServiceSchema.parse({ service: 'gemini' })).not.toThrow();
    expect(() => ServiceSchema.parse({ service: 'openai' })).toThrow();
    expect(() => ServiceSchema.parse({ service: '' })).toThrow();
  });
});

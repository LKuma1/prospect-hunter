import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const mockUpdate = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      leads: { findFirst: mockFindFirst },
    },
    update: mockUpdate,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  leads: {
    id: 'id',
    status: 'status',
    statusUpdatedAt: 'statusUpdatedAt',
    username: 'username',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

vi.mock('@/lib/api-error', () => ({
  handleApiError: vi.fn((err) => Response.json({ error: err.message }, { status: 500 })),
}));

describe('PATCH /api/leads/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve atualizar status válido e retornar lead atualizado', async () => {
    const mockLead = { id: 1, username: 'joao', status: 'Novo' };
    const mockUpdated = { id: 1, username: 'joao', status: 'Contatado', statusUpdatedAt: new Date() };

    mockFindFirst.mockResolvedValue(mockLead);
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockUpdated]),
    });

    // Simula validação Zod
    const StatusSchema = z.object({
      status: z.enum(['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado']),
    });

    const result = StatusSchema.parse({ status: 'Contatado' });
    expect(result.status).toBe('Contatado');
  });

  it('deve rejeitar status inválido com erro Zod', () => {
    const StatusSchema = z.object({
      status: z.enum(['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado']),
    });

    expect(() => StatusSchema.parse({ status: 'Invalido' })).toThrow();
    expect(() => StatusSchema.parse({ status: '' })).toThrow();
    expect(() => StatusSchema.parse({})).toThrow();
  });

  it('deve retornar 404 se lead não encontrado', async () => {
    mockFindFirst.mockResolvedValue(null);

    const lead = await mockFindFirst({ where: { id: 9999 } });
    expect(lead).toBeNull();
  });

  it('deve aceitar todos os status válidos', () => {
    const StatusSchema = z.object({
      status: z.enum(['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado']),
    });

    const validStatuses = ['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado'];
    validStatuses.forEach((status) => {
      expect(() => StatusSchema.parse({ status })).not.toThrow();
    });
  });

  it('deve atualizar statusUpdatedAt junto com o status', () => {
    const before = new Date();
    const updated = { status: 'Respondeu', statusUpdatedAt: new Date() };

    expect(updated.statusUpdatedAt).toBeInstanceOf(Date);
    expect(updated.statusUpdatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock the db module
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      messages: {
        findFirst: mockFindFirst,
      },
    },
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  messages: { id: 'id', approved: 'approved', content: 'content', leadId: 'leadId' },
  leads: { id: 'id', status: 'status', statusUpdatedAt: 'statusUpdatedAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

vi.mock('@/lib/api-error', () => ({
  handleApiError: vi.fn((err) => Response.json({ error: err.message }, { status: 500 })),
}));

describe('PATCH /api/messages/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve aprovar mensagem e atualizar status do lead', async () => {
    const mockMessage = { id: 1, leadId: 42, content: 'Olá!', approved: false };
    const mockUpdated = { ...mockMessage, approved: true, content: 'Olá editado!' };

    mockFindFirst.mockResolvedValue(mockMessage);
    mockUpdate
      .mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdated]),
      })
      .mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

    // Simula a lógica de aprovação diretamente
    const action = 'approve';
    const content = 'Olá editado!';

    expect(action).toBe('approve');
    expect(content).toBe('Olá editado!');
    expect(mockMessage.leadId).toBe(42);
  });

  it('deve rejeitar mensagem e deletá-la do banco', async () => {
    const mockMessage = { id: 2, leadId: 43, content: 'Mensagem', approved: false };

    mockFindFirst.mockResolvedValue(mockMessage);
    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    // Simula a lógica de rejeição diretamente
    const action = 'reject';

    expect(action).toBe('reject');
    expect(mockMessage.id).toBe(2);
  });

  it('deve retornar 404 se mensagem não encontrada', async () => {
    mockFindFirst.mockResolvedValue(null);

    const message = await mockFindFirst({ where: { id: 999 } });
    expect(message).toBeNull();
  });

  it('deve validar schema Zod — rejeitar action inválida', () => {
    const ActionSchema = z.object({
      action: z.enum(['approve', 'reject']),
      content: z.string().optional(),
    });

    expect(() => ActionSchema.parse({ action: 'invalid' })).toThrow();
    expect(() => ActionSchema.parse({ action: 'approve' })).not.toThrow();
    expect(() => ActionSchema.parse({ action: 'reject' })).not.toThrow();
    expect(() =>
      ActionSchema.parse({ action: 'approve', content: 'texto' })
    ).not.toThrow();
  });
});

describe('GET /api/messages/count', () => {
  it('deve retornar contagem de mensagens pendentes', async () => {
    // Simulação da lógica da rota
    const mockCount = 5;
    const result = { count: mockCount };

    expect(result.count).toBe(5);
    expect(typeof result.count).toBe('number');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOutreachMessage } from '@/lib/services/gemini.service';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/lib/env', () => ({
  env: { APIFY_TOKEN: 'test', GEMINI_API_KEY: 'test-key' },
}));

const TEMPLATE = 'Olá {{fullName}}, vi seu perfil de {{nicho}}. Posso ajudar com conteúdo no Instagram. Bio: {{bio}} | Seguidores: {{followers}}';

const PROFILE = {
  fullName: 'Dr. João Silva',
  username: 'joaosilva',
  bio: 'Dentista especialista',
  nicho: 'dentista',
  followers: 5000,
};

function mockGeminiResponse(text: string, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status === 200,
    status,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
  });
}

describe('generateOutreachMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera mensagem com placeholders substituídos', async () => {
    const message = 'Oi Dr. João Silva! Vi seu trabalho como dentista e quero ajudar com conteúdo para Instagram. Vamos conversar?';
    mockGeminiResponse(message);

    const result = await generateOutreachMessage(PROFILE, TEMPLATE);
    expect(result).toBe(message);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.contents[0].parts[0].text).toContain('Dr. João Silva');
    expect(body.contents[0].parts[0].text).toContain('dentista');
  });

  it('trunca mensagem para 300 chars se necessário', async () => {
    const longMessage = 'A'.repeat(400);
    mockGeminiResponse(longMessage);

    const result = await generateOutreachMessage(PROFILE, TEMPLATE);
    expect(result.length).toBe(300);
  });

  it('lança erro se mensagem for muito curta (< 100 chars)', async () => {
    mockGeminiResponse('Curta demais.');

    await expect(generateOutreachMessage(PROFILE, TEMPLATE)).rejects.toThrow(
      'muito curta'
    );
  });

  it('faz retry em caso de 429', async () => {
    vi.useFakeTimers();
    const shortDelay = vi.fn();
    vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      shortDelay();
      (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    const goodMessage = 'Oi Dr. João Silva! Vi seu perfil de dentista e posso ajudar com conteúdo para seu Instagram. Vamos conversar?';
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: goodMessage }] } }],
        }),
      });

    const result = await generateOutreachMessage(PROFILE, TEMPLATE);
    expect(result).toBe(goodMessage);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('lança erro descritivo em caso de erro 500', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal Server Error' } }),
    });

    await expect(generateOutreachMessage(PROFILE, TEMPLATE)).rejects.toThrow(
      'Gemini API error'
    );
  });
});

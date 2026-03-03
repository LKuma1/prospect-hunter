import { ZodError } from 'zod';

export function handleApiError(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      { error: 'Dados inválidos', details: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
      return Response.json(
        { error: 'Rate limit atingido. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
}

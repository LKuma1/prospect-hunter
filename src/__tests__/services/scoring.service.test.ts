import { describe, it, expect } from 'vitest';
import { calculateScore } from '@/lib/services/scoring.service';

describe('calculateScore', () => {
  it('retorna score máximo para dentista ideal (1k-50k followers, keywords na bio, contato)', () => {
    const { score, breakdown } = calculateScore({
      followers: 5000,
      bio: 'Dentista especialista em estética dental 😁 WhatsApp: (11) 99999-9999',
      nicho: 'dentista',
    });

    expect(breakdown.followers).toBe(50);
    expect(breakdown.bioKeywords).toBeGreaterThan(0);
    expect(breakdown.contactInBio).toBe(20);
    expect(score).toBeGreaterThan(80);
  });

  it('retorna score baixo para perfil sem match de nicho e poucos followers', () => {
    const { score, breakdown } = calculateScore({
      followers: 100,
      bio: 'Amante de café e viagens ✈️',
      nicho: 'dentista',
    });

    expect(breakdown.followers).toBeLessThanOrEqual(15);
    expect(breakdown.bioKeywords).toBe(0);
    expect(breakdown.contactInBio).toBe(0);
    expect(score).toBeLessThan(20);
  });

  it('pontuação de followers: sweet spot 1k-50k = peso total', () => {
    const { breakdown: low } = calculateScore({ followers: 300, bio: '', nicho: 'teste' });
    const { breakdown: mid } = calculateScore({ followers: 10000, bio: '', nicho: 'teste' });
    const { breakdown: high } = calculateScore({ followers: 100000, bio: '', nicho: 'teste' });

    expect(mid.followers).toBeGreaterThan(low.followers);
    expect(mid.followers).toBeGreaterThan(high.followers);
    expect(mid.followers).toBe(50);
  });

  it('detecta contato via wpp na bio', () => {
    const { breakdown } = calculateScore({
      followers: 5000,
      bio: 'Me chame no wpp!',
      nicho: 'dentista',
    });
    expect(breakdown.contactInBio).toBe(20);
  });

  it('detecta contato via número telefônico na bio', () => {
    const { breakdown } = calculateScore({
      followers: 5000,
      bio: 'Ligue: (11) 91234-5678',
      nicho: 'dentista',
    });
    expect(breakdown.contactInBio).toBe(20);
  });

  it('score não ultrapassa 100', () => {
    const { score } = calculateScore({
      followers: 5000,
      bio: 'Dentista odontologia clínica saúde bucal sorriso WhatsApp: (11) 99999-9999 dentista',
      nicho: 'dentista',
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('respeita configuração de pesos personalizada', () => {
    const config = { followersWeight: 60, bioWeight: 30, contactWeight: 10 };
    const { breakdown } = calculateScore(
      { followers: 5000, bio: 'sem contato', nicho: 'dentista' },
      config
    );
    expect(breakdown.followers).toBe(60);
    expect(breakdown.contactInBio).toBe(0);
  });
});

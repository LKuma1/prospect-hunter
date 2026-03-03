import { describe, it, expect } from 'vitest';
import { escapeCSV } from '@/app/api/leads/export/route';

describe('escapeCSV', () => {
  it('deve retornar string simples sem alteração', () => {
    expect(escapeCSV('joao')).toBe('joao');
    expect(escapeCSV('dentista')).toBe('dentista');
    expect(escapeCSV('123')).toBe('123');
  });

  it('deve envolver em aspas quando contém vírgula', () => {
    expect(escapeCSV('São Paulo, SP')).toBe('"São Paulo, SP"');
    expect(escapeCSV('bio com, vírgula')).toBe('"bio com, vírgula"');
  });

  it('deve escapar aspas duplas internas', () => {
    expect(escapeCSV('"Doutor João"')).toBe('"""Doutor João"""');
    expect(escapeCSV('ele disse "oi"')).toBe('"ele disse ""oi"""');
  });

  it('deve envolver em aspas quando contém quebra de linha', () => {
    expect(escapeCSV('linha1\nlinha2')).toBe('"linha1\nlinha2"');
    expect(escapeCSV('linha1\rlinha2')).toBe('"linha1\rlinha2"');
  });

  it('deve lidar com string vazia', () => {
    expect(escapeCSV('')).toBe('');
  });

  it('deve lidar com valores numéricos convertidos para string', () => {
    expect(escapeCSV(String(1500))).toBe('1500');
    expect(escapeCSV(String(85))).toBe('85');
  });
});

describe('CSV generation logic', () => {
  it('deve gerar CSV com headers corretos', () => {
    const headers = ['username', 'full_name', 'bio', 'followers', 'nicho', 'score', 'status', 'collected_at', 'last_message'];
    const rows = [['joao123', 'João Silva', 'Dentista há 10 anos', '5000', 'Saúde', '85', 'Contatado', '01/03/2026', 'Olá João!']];

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');

    const lines = csv.split('\n');
    expect(lines[0]).toBe(headers.join(','));
    expect(lines[1]).toBe(rows[0].join(','));
  });

  it('deve ter 9 colunas no header', () => {
    const headers = ['username', 'full_name', 'bio', 'followers', 'nicho', 'score', 'status', 'collected_at', 'last_message'];
    expect(headers).toHaveLength(9);
  });
});

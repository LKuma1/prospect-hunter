import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge';

describe('LeadScoreBadge', () => {
  it('exibe score verde para valores >= 70', () => {
    const { container } = render(<LeadScoreBadge score={80} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.textContent).toBe('80');
    expect(badge.className).toContain('green');
  });

  it('exibe score amarelo para valores entre 40 e 69', () => {
    const { container } = render(<LeadScoreBadge score={50} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.textContent).toBe('50');
    expect(badge.className).toContain('yellow');
  });

  it('exibe score outline para valores < 40', () => {
    const { container } = render(<LeadScoreBadge score={20} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.textContent).toBe('20');
    expect(screen.getByText('20')).toBeDefined();
  });

  it('exibe o valor numérico corretamente', () => {
    render(<LeadScoreBadge score={95} />);
    expect(screen.getByText('95')).toBeDefined();
  });
});

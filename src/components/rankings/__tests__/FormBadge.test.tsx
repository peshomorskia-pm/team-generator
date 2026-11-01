import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormBadge } from '../FormBadge';
import type { FormOutcome } from '../../../types/rankings';

describe('FormBadge Component', () => {
  it('renders 5 pills for a full form array with correct Bulgarian labels (П / З)', () => {
    const fullForm: FormOutcome[] = ['W', 'W', 'L', 'W', 'L'];
    render(<FormBadge form={fullForm} />);

    const wins = screen.getAllByTitle('Победа');
    const losses = screen.getAllByTitle('Загуба');

    expect(wins).toHaveLength(3);
    expect(losses).toHaveLength(2);

    expect(wins[0]).toHaveTextContent('П');
    expect(losses[0]).toHaveTextContent('З');
    expect(screen.queryByTitle('Няма изигран мач')).not.toBeInTheDocument();
  });

  it('renders green styling for wins and red styling for losses', () => {
    const form: FormOutcome[] = ['W', 'L'];
    render(<FormBadge form={form} />);

    const winPill = screen.getByTitle('Победа');
    const lossPill = screen.getByTitle('Загуба');

    expect(winPill.className).toContain('text-emerald-700');
    expect(lossPill.className).toContain('text-rose-700');
  });

  it('renders placeholders with "-" and title "Няма изигран мач" when form has fewer than 5 items', () => {
    const form: FormOutcome[] = ['W', 'L'];
    render(<FormBadge form={form} />);

    const placeholders = screen.getAllByTitle('Няма изигран мач');
    expect(placeholders).toHaveLength(3);
    placeholders.forEach((p) => {
      expect(p).toHaveTextContent('-');
    });

    expect(screen.getAllByTitle('Победа')).toHaveLength(1);
    expect(screen.getAllByTitle('Загуба')).toHaveLength(1);
  });

  it('handles empty form array by rendering 5 neutral placeholders', () => {
    render(<FormBadge form={[]} />);

    const placeholders = screen.getAllByTitle('Няма изигран мач');
    expect(placeholders).toHaveLength(5);
    expect(screen.queryByTitle('Победа')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Загуба')).not.toBeInTheDocument();
  });

  it('has proper aria-label on container', () => {
    render(<FormBadge form={['W']} />);
    expect(screen.getByLabelText('Форма от последните 5 мача')).toBeInTheDocument();
  });
});

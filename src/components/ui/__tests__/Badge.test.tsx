import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Star } from 'lucide-react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default classes (slate variant, sm size)', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-slate-100');
    expect(badge).toHaveClass('text-slate-800');
    expect(badge).toHaveClass('text-xs');
  });

  it('applies specific style classes based on variant prop', () => {
    const { rerender } = render(<Badge variant="indigo">Indigo</Badge>);
    let badge = screen.getByText('Indigo');
    expect(badge).toHaveClass('bg-indigo-100');
    expect(badge).toHaveClass('text-indigo-800');

    rerender(<Badge variant="emerald">Emerald</Badge>);
    badge = screen.getByText('Emerald');
    expect(badge).toHaveClass('bg-emerald-100');
    expect(badge).toHaveClass('text-emerald-800');

    rerender(<Badge variant="amber">Amber</Badge>);
    badge = screen.getByText('Amber');
    expect(badge).toHaveClass('bg-amber-100');
    expect(badge).toHaveClass('text-amber-800');

    rerender(<Badge variant="purple">Purple</Badge>);
    badge = screen.getByText('Purple');
    expect(badge).toHaveClass('bg-purple-100');
    expect(badge).toHaveClass('text-purple-800');
  });

  it('applies size classes based on size prop', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    let badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('text-sm');
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <Badge icon={Star}>With Icon</Badge>
    );
    expect(screen.getByText('With Icon')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

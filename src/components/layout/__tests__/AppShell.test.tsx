import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../AppShell';
import { ThemeProvider } from '../../../context/ThemeContext';

describe('AppShell Layout Component', () => {
  it('renders AppShell with dynamic bottom padding class on main container', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </MemoryRouter>
      </ThemeProvider>
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]');
    expect(mainElement).toHaveClass('md:pb-8');
  });

  it('renders mobile navigation with safe-area-bottom utility', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </MemoryRouter>
      </ThemeProvider>
    );

    const mobileNav = screen.getByRole('navigation', { name: 'Мобилна навигация' });
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav).toHaveClass('safe-area-bottom');
  });
});

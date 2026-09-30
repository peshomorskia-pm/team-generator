import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { AppShell } from '../../components/layout/AppShell';
import { LandingPage } from '../LandingPage';
import { GeneratorPage } from '../GeneratorPage';
import { PlayersPage } from '../PlayersPage';
import { MatchesPage } from '../MatchesPage';
import { RankingsPage } from '../RankingsPage';
import { NotFoundPage } from '../NotFoundPage';

const renderAppRoute = (initialRoute: string) => {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="generator" element={<GeneratorPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="rankings" element={<RankingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('App Route Smoke and Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders LandingPage on root ("/")', () => {
    renderAppRoute('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /балансирани отбори/i })
    ).toBeInTheDocument();
  });

  it('renders GeneratorPage on "/generator"', () => {
    renderAppRoute('/generator');
    expect(
      screen.getByRole('heading', { level: 1, name: /генератор на отбори/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/списък с играчи/i)).toBeInTheDocument();
  });

  it('renders PlayersPage on "/players"', () => {
    renderAppRoute('/players');
    expect(screen.getByRole('heading', { name: 'Играчи', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Управлението на играчи очаква старт')).toBeInTheDocument();
  });

  it('renders MatchesPage on "/matches"', () => {
    renderAppRoute('/matches');
    expect(screen.getByRole('heading', { name: 'Мачове', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Модулът за мачове очаква старт')).toBeInTheDocument();
  });

  it('renders RankingsPage on "/rankings"', () => {
    renderAppRoute('/rankings');
    expect(screen.getByRole('heading', { name: 'Класиране', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Класирането очаква своите първи шампиони')).toBeInTheDocument();
  });

  it('renders NotFoundPage on unmapped routes like "/rules", "/tactics", "/history", "/admin", "/not-found"', () => {
    const unmappedRoutes = ['/rules', '/tactics', '/history', '/admin', '/not-found'];

    for (const route of unmappedRoutes) {
      const { unmount } = renderAppRoute(route);
      expect(screen.getByText('Страницата не е намерена')).toBeInTheDocument();
      expect(screen.getByText(/Грешка 404/i)).toBeInTheDocument();
      unmount();
    }
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { AppShell } from '../../components/layout/AppShell';
import { LandingPage } from '../LandingPage';
import { GeneratorPage } from '../GeneratorPage';
import { PlayersPage } from '../PlayersPage';
import { MatchesPage } from '../MatchesPage';
import { TournamentsPage } from '../TournamentsPage';
import { RankingsPage } from '../RankingsPage';
import { NotFoundPage } from '../NotFoundPage';
import { PlaceholderPage } from '../../components/layout/PlaceholderPage';
import { Trophy, ArrowLeft } from 'lucide-react';

vi.mock('../../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: [],
    loading: false,
    error: null,
    alert: null,
    fetchPlayers: vi.fn(),
    createPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    deletePlayer: vi.fn(),
    clearAlert: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMatches', () => ({
  useMatches: () => ({
    matches: [],
    loading: false,
    error: null,
    alert: null,
    fetchMatches: vi.fn(),
    createMatch: vi.fn(),
    updateMatch: vi.fn(),
    deleteMatch: vi.fn(),
    clearAlert: vi.fn(),
  }),
}));

vi.mock('../../hooks/useTournaments', () => ({
  useTournaments: () => ({
    tournaments: [],
    loading: false,
    error: null,
    fetchTournaments: vi.fn(),
    createTournament: vi.fn(),
    updateTournament: vi.fn(),
    deleteTournament: vi.fn(),
  }),
}));

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
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route
              path="tournaments/:id"
              element={
                <PlaceholderPage
                  title="Турнирен панел"
                  description="Детайлният турнирен панел е в процес на разработка (PR 3)."
                  icon={Trophy}
                  cardTitle="Турнирен панел"
                  cardDescription="Детайлният турнирен панел е в процес на разработка (PR 3)."
                  ctaText="Към турнири"
                  ctaTo="/tournaments"
                  ctaIcon={ArrowLeft}
                />
              }
            />
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
    expect(screen.getByRole('heading', { name: 'Играчи', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /нов играч/i })).toBeInTheDocument();
  });

  it('renders MatchesPage on "/matches"', () => {
    renderAppRoute('/matches');
    expect(screen.getByRole('heading', { name: 'Мачове', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /нов мач/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders RankingsPage on "/rankings"', () => {
    renderAppRoute('/rankings');
    expect(screen.getByRole('heading', { name: 'Класиране', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /поединично/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Търси играч...')).toBeInTheDocument();
  });

  it('renders TournamentsPage on "/tournaments"', () => {
    renderAppRoute('/tournaments');
    expect(screen.getByRole('heading', { name: /турнири/i, level: 1 })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /\+ нов турнир/i }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders PlaceholderPage on "/tournaments/:id"', () => {
    renderAppRoute('/tournaments/test-tournament-123');
    expect(screen.getByRole('heading', { name: 'Турнирен панел', level: 2 })).toBeInTheDocument();
    expect(
      screen.getAllByText(/детайлният турнирен панел е в процес на разработка/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /към турнири/i })).toHaveAttribute('href', '/tournaments');
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

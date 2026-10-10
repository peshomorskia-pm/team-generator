import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { PlayersPage } from './pages/PlayersPage';
import { MatchesPage } from './pages/MatchesPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { RankingsPage } from './pages/RankingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './components/layout/PlaceholderPage';
import { Trophy, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

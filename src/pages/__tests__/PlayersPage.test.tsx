import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayersPage, getRatingBadgeVariant } from '../PlayersPage';
import * as usePlayersHook from '../../hooks/usePlayers';
import type { PlayerRow } from '../../types/database.types';

vi.mock('../../hooks/usePlayers');

describe('PlayersPage', () => {
  const samplePlayers: PlayerRow[] = [
    {
      id: 'p-1',
      name: 'Христо Стоичков',
      rating: 1950,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-2',
      name: 'Димитър Бербатов',
      rating: 1450,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-3',
      name: 'Красимир Балъков',
      rating: 1250,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-4',
      name: 'Трифон Иванов',
      rating: 950,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  const defaultMockReturn: usePlayersHook.UsePlayersReturn = {
    players: samplePlayers,
    loading: false,
    error: null,
    alert: null,
    fetchPlayers: vi.fn().mockResolvedValue(undefined),
    createPlayer: vi.fn().mockResolvedValue(undefined),
    updatePlayer: vi.fn().mockResolvedValue(undefined),
    deletePlayer: vi.fn().mockResolvedValue(undefined),
    clearAlert: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePlayersHook.usePlayers).mockReturnValue({ ...defaultMockReturn });
  });

  describe('Rating badge variant logic', () => {
    it('returns emerald for ratings >= 1500', () => {
      expect(getRatingBadgeVariant(1500)).toBe('emerald');
      expect(getRatingBadgeVariant(2000)).toBe('emerald');
    });

    it('returns indigo for ratings >= 1300 and < 1500', () => {
      expect(getRatingBadgeVariant(1300)).toBe('indigo');
      expect(getRatingBadgeVariant(1499)).toBe('indigo');
    });

    it('returns amber for ratings >= 1100 and < 1300', () => {
      expect(getRatingBadgeVariant(1100)).toBe('amber');
      expect(getRatingBadgeVariant(1299)).toBe('amber');
    });

    it('returns slate for ratings < 1100', () => {
      expect(getRatingBadgeVariant(1099)).toBe('slate');
      expect(getRatingBadgeVariant(800)).toBe('slate');
    });
  });

  describe('Rendering and layout', () => {
    it('renders page header, count badge, and "+ Нов играч" button', () => {
      render(<PlayersPage />);

      expect(screen.getByRole('heading', { name: 'Играчи', level: 1 })).toBeInTheDocument();
      expect(screen.getByText('4 играчи')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /нов играч/i })).toBeInTheDocument();
    });

    it('renders single player count label correctly', () => {
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        players: [samplePlayers[0]],
      });

      render(<PlayersPage />);
      expect(screen.getByText('1 играч')).toBeInTheDocument();
    });

    it('renders both desktop table and mobile cards with dual ELO badges', () => {
      const dualPlayer: PlayerRow = {
        id: 'p-dual',
        name: 'Григор Димитров',
        rating: 1800,
        singles_rating: 1950,
        doubles_rating: 1650,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        players: [dualPlayer],
      });

      render(<PlayersPage />);

      // Table presence
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Играч' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Рейтинг' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Действия' })).toBeInTheDocument();

      // Check player rows (each player appears in table and mobile card)
      const playerElements = screen.getAllByText('Григор Димитров');
      expect(playerElements.length).toBeGreaterThanOrEqual(2);

      // Verify dual badges (🎾 and 👥) on both desktop and mobile
      const singlesBadges = screen.getAllByText('🎾 1950 ELO');
      const doublesBadges = screen.getAllByText('👥 1650 ELO');
      expect(singlesBadges.length).toBeGreaterThanOrEqual(2);
      expect(doublesBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('renders loading state when loading is true and players array is empty', () => {
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        players: [],
        loading: true,
      });

      render(<PlayersPage />);
      expect(screen.getByRole('status', { name: 'Зареждане' })).toBeInTheDocument();
      expect(screen.getByText('Зареждане на играчите...')).toBeInTheDocument();
    });

    it('renders empty state when there are no players and opens modal on CTA click', async () => {
      const user = userEvent.setup();
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        players: [],
        loading: false,
      });

      render(<PlayersPage />);

      expect(screen.getByText('Няма добавени играчи')).toBeInTheDocument();
      const ctaBtn = screen.getByRole('button', { name: /добави първия играч/i });
      expect(ctaBtn).toBeInTheDocument();

      await user.click(ctaBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Нов играч' })).toBeInTheDocument();
    });

    it('renders alert notification and handles dismiss', async () => {
      const user = userEvent.setup();
      const clearAlertMock = vi.fn();
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        alert: { type: 'success', message: 'Успешна операция' },
        clearAlert: clearAlertMock,
      });

      render(<PlayersPage />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Успешна операция')).toBeInTheDocument();

      const closeAlertBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeAlertBtn);

      expect(clearAlertMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Search filtering', () => {
    it('filters players case-insensitively based on search input', async () => {
      const user = userEvent.setup();
      render(<PlayersPage />);

      const searchInput = screen.getByLabelText('Търсене по име на играч');
      await user.type(searchInput, 'бербатов');

      expect(screen.queryByText('Христо Стоичков')).not.toBeInTheDocument();
      expect(screen.getAllByText('Димитър Бербатов').length).toBeGreaterThanOrEqual(1);
    });

    it('renders no search results empty state when query does not match any players', async () => {
      const user = userEvent.setup();
      render(<PlayersPage />);

      const searchInput = screen.getByLabelText('Търсене по име на играч');
      await user.type(searchInput, 'Несъществуващ');

      expect(screen.getByText('Няма намерени играчи')).toBeInTheDocument();
      expect(
        screen.getByText('Не са открити резултати, отговарящи на "Несъществуващ".')
      ).toBeInTheDocument();
    });
  });

  describe('Modals integration and CRUD triggers', () => {
    it('opens create modal on "+ Нов играч" click and calls createPlayer upon submission', async () => {
      const user = userEvent.setup();
      const createPlayerMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        createPlayer: createPlayerMock,
      });

      render(<PlayersPage />);

      const createBtn = screen.getByRole('button', { name: /нов играч/i });
      await user.click(createBtn);

      expect(screen.getByRole('heading', { name: 'Нов играч' })).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/име на играча/i);
      const ratingInput = screen.getByLabelText(/общ рейтинг/i);
      const singlesInput = screen.getByLabelText(/рейтинг поединично/i);
      const doublesInput = screen.getByLabelText(/рейтинг по двойки/i);

      await user.type(nameInput, 'Стилиян Петров');
      await user.clear(ratingInput);
      await user.type(ratingInput, '1400');
      await user.clear(singlesInput);
      await user.type(singlesInput, '1450');
      await user.clear(doublesInput);
      await user.type(doublesInput, '1350');

      const submitBtn = screen.getByRole('button', { name: /създай/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(createPlayerMock).toHaveBeenCalledWith('Стилиян Петров', 1400, 1450, 1350);
      });
    });

    it('opens edit modal on edit button click and calls updatePlayer upon submission', async () => {
      const user = userEvent.setup();
      const updatePlayerMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        updatePlayer: updatePlayerMock,
      });

      render(<PlayersPage />);

      // First edit button (for Христо Стоичков)
      const editButtons = screen.getAllByLabelText('Редактирай Христо Стоичков');
      await user.click(editButtons[0]);

      expect(screen.getByRole('heading', { name: 'Редактиране на играч' })).toBeInTheDocument();
      const ratingInput = screen.getByLabelText(/общ рейтинг/i);
      const singlesInput = screen.getByLabelText(/рейтинг поединично/i);
      const doublesInput = screen.getByLabelText(/рейтинг по двойки/i);

      await user.clear(ratingInput);
      await user.type(ratingInput, '2050');
      await user.clear(singlesInput);
      await user.type(singlesInput, '2100');
      await user.clear(doublesInput);
      await user.type(doublesInput, '2000');

      const saveBtn = screen.getByRole('button', { name: /запази/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updatePlayerMock).toHaveBeenCalledWith(
          'p-1',
          'Христо Стоичков',
          2050,
          2100,
          2000
        );
      });
    });

    it('opens delete confirmation modal and calls deletePlayer upon confirmation', async () => {
      const user = userEvent.setup();
      const deletePlayerMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(usePlayersHook.usePlayers).mockReturnValue({
        ...defaultMockReturn,
        deletePlayer: deletePlayerMock,
      });

      render(<PlayersPage />);

      // First delete button (for Христо Стоичков)
      const deleteButtons = screen.getAllByLabelText('Изтрий Христо Стоичков');
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('heading', { name: 'Изтриване на играч' })).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes('Сигурни ли сте, че искате да изтриете')
        )
      ).toBeInTheDocument();

      const confirmDeleteBtn = screen.getByRole('button', { name: 'Изтриване' });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(deletePlayerMock).toHaveBeenCalledWith('p-1');
      });
    });
  });
});

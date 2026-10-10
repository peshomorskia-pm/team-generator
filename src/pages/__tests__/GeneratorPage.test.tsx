import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GeneratorPage } from '../GeneratorPage';
import { ThemeProvider } from '../../context/ThemeContext';
import * as usePlayersModule from '../../hooks/usePlayers';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTournaments = [
  {
    id: 't-1',
    title: 'Есенен турнир 2026',
    date: '2026-10-15',
    format: 'doubles',
    status: 'in_progress',
    winner_team_name: null,
    notes: 'Тенис кортове Диана',
    created_at: '2026-10-01',
    updated_at: '2026-10-01',
  },
  {
    id: 't-singles',
    title: 'Турнир поединично',
    date: '2026-10-20',
    format: 'singles',
    status: 'draft',
    winner_team_name: null,
    notes: null,
    created_at: '2026-10-01',
    updated_at: '2026-10-01',
  },
];

vi.mock('../../hooks/useTournaments', () => ({
  useTournaments: () => ({
    tournaments: mockTournaments,
    loading: false,
    error: null,
    fetchTournaments: vi.fn(),
    createTournament: vi.fn(),
    updateTournament: vi.fn(),
    deleteTournament: vi.fn(),
  }),
}));

const mockCreateMatch = vi.fn();
const mockBulkCreateMatches = vi.fn();
vi.mock('../../hooks/useMatches', () => ({
  useMatches: () => ({
    matches: [],
    loading: false,
    error: null,
    alert: null,
    createMatch: mockCreateMatch,
    bulkCreateMatches: mockBulkCreateMatches,
    updateMatch: vi.fn(),
    deleteMatch: vi.fn(),
    clearAlert: vi.fn(),
    fetchMatches: vi.fn(),
  }),
}));

describe('GeneratorPage Integration Tests', { timeout: 20000 }, () => {
  const mockCreatePlayer = vi.fn();
  const mockUpdatePlayer = vi.fn();
  const mockDeletePlayer = vi.fn();
  const mockFetchPlayers = vi.fn();

  const dummyDbPlayers = [
    {
      id: 'db-1',
      name: 'Иван Иванов',
      rating: 1600,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'db-2',
      name: 'Георги Димитров',
      rating: 1400,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockCreateMatch.mockReset();
    mockBulkCreateMatches.mockReset();
    mockBulkCreateMatches.mockResolvedValue({ count: 6, error: null });

    vi.spyOn(usePlayersModule, 'usePlayers').mockReturnValue({
      players: dummyDbPlayers,
      loading: false,
      error: null,
      alert: null,
      fetchPlayers: mockFetchPlayers,
      createPlayer: mockCreatePlayer,
      updatePlayer: mockUpdatePlayer,
      deletePlayer: mockDeletePlayer,
      clearAlert: vi.fn(),
    });
  });

  const renderComponent = (initialRoute = '/generator') => {
    return render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <GeneratorPage />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders hybrid generator page layout and initial empty pool', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { level: 1, name: /генератор на отбори/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Регистрирани играчи' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Добави гости' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Активен състав' })).toBeInTheDocument();
    expect(
      screen.getByText(/Няма избрани играчи. Изберете регистрирани играчи или добавете гости/i)
    ).toBeInTheDocument();
  });

  it('end-to-end: adds 1 DB player and 2 guests to pool without triggering any DB mutations', async () => {
    const user = userEvent.setup();
    renderComponent();

    // 1. Select 1 DB player
    const dbCheckbox = screen.getByRole('checkbox', { name: 'Иван Иванов' });
    await user.click(dbCheckbox);
    expect(dbCheckbox).toBeChecked();

    // 2. Add 2 guest players via guest input
    const guestInput = screen.getByPlaceholderText(
      'напр. Иван, Петър, Георги'
    );
    const addGuestBtn = screen.getByRole('button', { name: /добави/i });

    await user.type(guestInput, 'Гост А, Гост Б');
    await user.click(addGuestBtn);

    // 3. Assert active pool has 3 elements
    const poolContainer = screen.getByTestId('active-pool-list');
    expect(within(poolContainer).getByText('Иван Иванов')).toBeInTheDocument();
    expect(within(poolContainer).getByText('Гост А')).toBeInTheDocument();
    expect(within(poolContainer).getByText('Гост Б')).toBeInTheDocument();

    // Verify summary counts
    expect(screen.getByText('1 регистрирани')).toBeInTheDocument();
    expect(screen.getByText('2 гости')).toBeInTheDocument();

    // 4. Assert NO mutation calls (createPlayer/updatePlayer/deletePlayer) were fired against the DB
    expect(mockCreatePlayer).not.toHaveBeenCalled();
    expect(mockUpdatePlayer).not.toHaveBeenCalled();
    expect(mockDeletePlayer).not.toHaveBeenCalled();
  });

  it('generates teams, allows balancing by rating, and copies results to clipboard', async () => {
    const user = userEvent.setup();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    renderComponent();

    // Select both DB players (1600 and 1400)
    await user.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    await user.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Add 2 guests
    const guestInput = screen.getByPlaceholderText(
      'напр. Иван, Петър, Георги'
    );
    await user.type(guestInput, 'Гост 1, Гост 2');
    await user.click(screen.getByRole('button', { name: /добави/i }));

    // Balance by rating checkbox appears in tennis mode because ratings exist in pool
    const balanceCheckbox = screen.getByRole('checkbox', {
      name: /балансирай отборите по рейтинг на играчите/i,
    });
    expect(balanceCheckbox).toBeInTheDocument();
    await user.click(balanceCheckbox);
    expect(balanceCheckbox).toBeChecked();

    // Verify it disappears when switching to generic mode
    await user.click(screen.getByRole('button', { name: '🎲 Универсален' }));
    expect(
      screen.queryByRole('checkbox', {
        name: /балансирай отборите по рейтинг на играчите/i,
      })
    ).not.toBeInTheDocument();

    // Switch back to tennis mode to generate balanced tennis teams
    await user.click(screen.getByRole('button', { name: '🎾 Тенис' }));

    // Click generate button
    const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
    await user.click(generateBtn);

    // Results section appears
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();

    // Copy results
    const copyBtn = screen.getByRole('button', { name: /копирай/i });
    await user.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalled();
  });

  it('shows error notification when attempting to generate with insufficient players', async () => {
    const user = userEvent.setup();
    renderComponent();

    const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
    await user.click(generateBtn);

    expect(
      screen.getByText('Списъкът с играчи е празен. Моля, въведете поне няколко имена.')
    ).toBeInTheDocument();
  });

  it('removes players from active pool when clicking the remove button', async () => {
    const user = userEvent.setup();
    renderComponent();

    const guestInput = screen.getByPlaceholderText(
      'напр. Иван, Петър, Георги'
    );
    await user.type(guestInput, 'Никола');
    await user.click(screen.getByRole('button', { name: /добави/i }));

    expect(screen.getByText('Никола')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: 'Премахни Никола' });
    await user.click(removeBtn);

    expect(screen.queryByText('Никола')).not.toBeInTheDocument();
  });

  it("clears active pool, generated results, and search filter when clicking 'Изчисти всички'", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Type in search query to filter registered players
    const searchInput = screen.getByPlaceholderText('Търсене на играчи...') as HTMLInputElement;
    await user.type(searchInput, 'Иван');
    expect(searchInput.value).toBe('Иван');

    // Select filtered player
    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));

    // Clear search and select second player
    await user.clear(searchInput);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Re-type a search query to simulate active filter at time of clear
    await user.type(searchInput, 'Димитров');
    expect(searchInput.value).toBe('Димитров');

    // Switch to Generic mode, set number of teams = 2 and generate
    fireEvent.click(screen.getByRole('button', { name: '🎲 Универсален' }));
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
    fireEvent.click(generateBtn);

    // Verify results exist
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();

    // Click 'Изчисти всички'
    const clearAllBtn = screen.getByRole('button', { name: /изчисти всички/i });
    fireEvent.click(clearAllBtn);

    // Verify active pool is cleared
    expect(
      screen.getByText(/Няма избрани играчи. Изберете регистрирани играчи или добавете гости/i)
    ).toBeInTheDocument();

    // Verify results section is cleared
    expect(screen.queryByRole('heading', { level: 2, name: 'Резултати' })).not.toBeInTheDocument();

    // Verify search filter is also cleared
    expect(searchInput.value).toBe('');
  });

  it('Scenario 1 (Integration): generates 2 teams -> opens MatchModal prefilled -> cancels modal without affecting generator teams', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Select 1 registered player
    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));

    // Add 1 guest player
    const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
    await user.type(guestInput, 'Гост Стоян');
    fireEvent.click(screen.getByRole('button', { name: /добави/i }));

    // Switch to singles format for 1v1 match (2 players)
    fireEvent.click(screen.getByRole('button', { name: 'Поединично' }));

    // Generate teams
    fireEvent.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Assert results are rendered
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();

    // Assert 'Запиши като мач' button is rendered
    const saveAsMatchBtn = screen.getByRole('button', { name: /запиши като мач/i });
    expect(saveAsMatchBtn).toBeInTheDocument();

    // Click 'Запиши като мач'
    fireEvent.click(saveAsMatchBtn);

    // Assert MatchModal appears
    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();
    expect(within(modalDialog).getByRole('heading', { name: 'Нов мач' })).toBeInTheDocument();

    // Assert players are mapped into the modal rosters
    expect(within(modalDialog).getByText('Иван Иванов')).toBeInTheDocument();
    expect(within(modalDialog).getByText('Гост Стоян')).toBeInTheDocument();
    expect(within(modalDialog).getByText('(гост)')).toBeInTheDocument();

    // Cancel modal
    const cancelBtn = within(modalDialog).getByRole('button', { name: 'Отказ' });
    fireEvent.click(cancelBtn);

    // Assert modal closes
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Assert generator state and teams remain intact
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
  });

  it('Scenario 2 (Submission & Navigation): generates 2 teams -> submits MatchModal -> navigates to /matches', async () => {
    mockCreateMatch.mockResolvedValue(true);

    renderComponent();

    // Select 2 registered players
    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Switch to singles format for 1v1 match (2 players)
    fireEvent.click(screen.getByRole('button', { name: 'Поединично' }));

    // Generate teams
    fireEvent.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Open MatchModal
    fireEvent.click(screen.getByRole('button', { name: /запиши като мач/i }));

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();

    // Submit modal (Create button)
    const submitBtn = within(modalDialog).getByRole('button', { name: /създай/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Verify createMatch was invoked with mapped team players
    expect(mockCreateMatch).toHaveBeenCalledTimes(1);
    expect(mockCreateMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        team_1_score: null,
        team_2_score: null,
      })
    );

    // Verify navigation to /matches was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/matches');

    // Verify modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('leaves modal open when createMatch fails', async () => {
    mockCreateMatch.mockResolvedValue(false);

    renderComponent();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Switch to singles format for 1v1 match (2 players)
    fireEvent.click(screen.getByRole('button', { name: 'Поединично' }));

    fireEvent.click(screen.getByRole('button', { name: /разпредели в отбори/i }));
    fireEvent.click(screen.getByRole('button', { name: /запиши като мач/i }));

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();

    const submitBtn = within(modalDialog).getByRole('button', { name: /създай/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockCreateMatch).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles format toggle interaction and passes active format into MatchModal', () => {
    mockCreateMatch.mockResolvedValue(true);

    renderComponent();

    // Verify format pills: doubles is active by default
    const doublesFormatBtn = screen.getByRole('button', { name: 'По двойки' });
    const singlesFormatBtn = screen.getByRole('button', { name: 'Поединично' });

    expect(doublesFormatBtn).toHaveAttribute('aria-pressed', 'true');
    expect(singlesFormatBtn).toHaveAttribute('aria-pressed', 'false');

    // Switch to singles
    fireEvent.click(singlesFormatBtn);
    expect(singlesFormatBtn).toHaveAttribute('aria-pressed', 'true');
    expect(doublesFormatBtn).toHaveAttribute('aria-pressed', 'false');

    // Add players and generate teams
    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    fireEvent.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Click "Запиши като мач"
    fireEvent.click(screen.getByRole('button', { name: /запиши като мач/i }));

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();

    // Verify MatchModal initialized with singles format
    const modalSinglesBtn = within(modalDialog).getByRole('button', { name: 'Поединично' });
    expect(modalSinglesBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates PlayerSelector badges when format toggles and respects format-aware ratings', () => {
    vi.spyOn(usePlayersModule, 'usePlayers').mockReturnValue({
      players: [
        {
          id: 'db-format-1',
          name: 'Красимир',
          rating: 1200,
          singles_rating: 1750,
          doubles_rating: 1450,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      ],
      loading: false,
      error: null,
      alert: null,
      fetchPlayers: mockFetchPlayers,
      createPlayer: mockCreatePlayer,
      updatePlayer: mockUpdatePlayer,
      deletePlayer: mockDeletePlayer,
      clearAlert: vi.fn(),
    });

    renderComponent();

    // Default doubles format: displays 1450
    expect(screen.getByText('1450')).toBeInTheDocument();
    expect(screen.queryByText('1750')).not.toBeInTheDocument();

    // Toggle format to singles: displays 1750
    const singlesFormatBtn = screen.getByRole('button', { name: 'Поединично' });
    fireEvent.click(singlesFormatBtn);

    expect(screen.getByText('1750')).toBeInTheDocument();
    expect(screen.queryByText('1450')).not.toBeInTheDocument();

    // Toggle mode to generic: player ratings are stripped/hidden
    const genericModeBtn = screen.getByRole('button', { name: '🎲 Универсален' });
    fireEvent.click(genericModeBtn);

    expect(screen.queryByText('1200')).not.toBeInTheDocument();
    expect(screen.queryByText('1750')).not.toBeInTheDocument();
    expect(screen.queryByText('1450')).not.toBeInTheDocument();
  });

  it('Scenario 3 (UI Visibility): toggles mode between Tennis and Generic, updating controls appropriately', () => {
    renderComponent();

    // Initially in Tennis mode: format pills visible, generic manual count inputs missing
    expect(screen.getByRole('button', { name: 'По двойки' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Поединично' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/брой отбори/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/брой играчи в отбор/i)).not.toBeInTheDocument();

    // Toggle mode to Generic
    fireEvent.click(screen.getByRole('button', { name: '🎲 Универсален' }));

    // In Generic mode: generic manual count inputs appear, format pills disappear
    expect(screen.getByLabelText(/брой отбори/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/брой играчи в отбор/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'По двойки' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Поединично' })).not.toBeInTheDocument();
  });

  it('Scenario 4 (Save As Match Decoupling): strictly hides "Запиши като мач" button when teams are generated in Generic mode', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Toggle mode to Generic
    fireEvent.click(screen.getByRole('button', { name: '🎲 Универсален' }));

    // Select 2 registered players
    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Set number of teams = 2
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    // Generate teams
    fireEvent.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Results container rendered with 2 teams
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();

    // "Запиши като мач" must be strictly hidden in Generic mode
    expect(screen.queryByRole('button', { name: /запиши като мач/i })).not.toBeInTheDocument();
  });

  it('displays validation error and disables generate button when generic settings are invalid', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Toggle mode to Generic
    fireEvent.click(screen.getByRole('button', { name: '🎲 Универсален' }));

    // Select 2 registered players
    fireEvent.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Configure invalid playersPerTeam = 2 (which is >= activePool.length = 2)
    const pptInput = screen.getByLabelText(/брой играчи в отбор/i);
    await user.type(pptInput, '2');

    // Assert validation error banner is displayed
    const expectedError =
      'Броят играчи в отбор (2) не може да бъде по-голям или равен на общия брой играчи (2). Нужни са играчи за поне 2 отбора.';
    expect(screen.getByText(expectedError)).toBeInTheDocument();

    // Assert generate button is disabled
    const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
    expect(generateBtn).toBeDisabled();

    // Now set numberOfTeams to 3 (which is > activePool.length = 2)
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.type(numTeamsInput, '3');

    const expectedTeamError = 'Броят отбори (3) не може да надвишава наличните играчи (2).';
    expect(screen.getByText(expectedTeamError)).toBeInTheDocument();
    expect(generateBtn).toBeDisabled();
  });

  describe('Tournament groups draw integration', () => {
    it('auto-assigns single group and shows generate schedule for N in {3, 4, 5} in tennis mode', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Switch to singles
      await user.click(screen.getByRole('button', { name: 'Поединично' }));

      // Add 4 guests -> 4 teams
      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'А1, А2, А3, А4');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Generate teams
      await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

      // "🎲 Тегли жребий за групи" button is NOT visible for N in {3, 4, 5}
      expect(screen.queryByRole('button', { name: /тегли жребий за групи/i })).not.toBeInTheDocument();

      // GroupList is mounted directly, showing "Турнирни групи" and "Група А"
      expect(screen.getByRole('heading', { level: 2, name: 'Турнирни групи' })).toBeInTheDocument();
      expect(screen.getByText('Група А')).toBeInTheDocument();

      // Primary action button "📅 Генерирай програма с мачове" is visible
      const genScheduleBtn = screen.getByRole('button', { name: /генерирай програма с мачове/i });
      expect(genScheduleBtn).toBeInTheDocument();

      // Click to generate tournament schedule
      await user.click(genScheduleBtn);

      // MatchScheduleList is rendered with "Програма на срещите"
      expect(screen.getByRole('heading', { level: 2, name: 'Програма на срещите' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /генерирай програма с мачове/i })).not.toBeInTheDocument();

      // Clear schedule
      const clearScheduleBtn = screen.getByRole('button', { name: /изчисти програмата/i });
      await user.click(clearScheduleBtn);

      // Schedule is cleared and generate button reappears
      expect(screen.queryByRole('heading', { level: 2, name: 'Програма на срещите' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /генерирай програма с мачове/i })).toBeInTheDocument();
    });

    it('shows "🎲 Тегли жребий за групи" button for N >= 6 teams and allows drawing groups and generating schedule', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Switch to singles
      await user.click(screen.getByRole('button', { name: 'Поединично' }));

      // Add 6 guests -> 6 teams
      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'А1, А2, А3, А4, А5, А6');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Generate teams
      await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

      // "Резултати" heading is visible
      expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();

      // "🎲 Тегли жребий за групи" button is visible
      const drawBtn = screen.getByRole('button', { name: /тегли жребий за групи/i });
      expect(drawBtn).toBeInTheDocument();

      // Click to draw groups
      await user.click(drawBtn);

      // GroupList is mounted, showing "Турнирни групи", "Група А", "Група Б"
      expect(screen.getByRole('heading', { level: 2, name: 'Турнирни групи' })).toBeInTheDocument();
      expect(screen.getByText('Група А')).toBeInTheDocument();
      expect(screen.getByText('Група Б')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /нов жребий/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /изчисти жребия/i })).toBeInTheDocument();

      // Generate schedule button is visible
      const genScheduleBtn = screen.getByRole('button', { name: /генерирай програма с мачове/i });
      expect(genScheduleBtn).toBeInTheDocument();

      // Click "Изчисти жребия" to clear groups
      await user.click(screen.getByRole('button', { name: /изчисти жребия/i }));

      // Groups cleared, TeamList returned
      expect(screen.queryByRole('heading', { level: 2, name: 'Турнирни групи' })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /тегли жребий за групи/i })).toBeInTheDocument();
    });

    it('does not display "🎲 Тегли жребий за групи" button when mode is generic even with >= 3 teams', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Switch to generic
      await user.click(screen.getByRole('button', { name: '🎲 Универсален' }));

      // Add 4 guests
      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'Г1, Г2, Г3, Г4');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Number of teams = 3
      const numTeamsInput = screen.getByLabelText(/брой отбори/i);
      await user.clear(numTeamsInput);
      await user.type(numTeamsInput, '3');

      // Generate teams
      await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

      // Results rendered
      expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();

      // Group draw button must NOT exist
      expect(screen.queryByRole('button', { name: /тегли жребий за групи/i })).not.toBeInTheDocument();
    });

    it('generates schedule and saves all tournament matches navigating to /matches with location state', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Switch to singles
      await user.click(screen.getByRole('button', { name: 'Поединично' }));

      // Add 4 guests -> 4 teams
      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'А1, А2, А3, А4');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Generate teams
      await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

      // Generate schedule
      await user.click(screen.getByRole('button', { name: /генерирай програма с мачове/i }));

      // Verify "⚡ Запиши всички мачове" button is rendered
      const saveAllBtn = screen.getByRole('button', { name: /запиши всички мачове/i });
      expect(saveAllBtn).toBeInTheDocument();

      // Click "⚡ Запиши всички мачове"
      await user.click(saveAllBtn);

      // Verify bulkCreateMatches was called with schedule and format
      expect(mockBulkCreateMatches).toHaveBeenCalledTimes(1);
      expect(mockBulkCreateMatches).toHaveBeenCalledWith(expect.any(Array), 'singles');

      // Verify navigation to /matches with state payload
      expect(mockNavigate).toHaveBeenCalledWith('/matches', {
        state: {
          fromBulkCreate: true,
          matchCount: 6,
          statusFilter: 'upcoming',
        },
      });
    });

    it('shows Bulgarian error alert notification without resetting schedule when bulk save fails', async () => {
      mockBulkCreateMatches.mockResolvedValueOnce({
        count: 0,
        error: new Error('Network failure'),
      });

      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: 'Поединично' }));

      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'А1, А2, А3, А4');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));
      await user.click(screen.getByRole('button', { name: /генерирай програма с мачове/i }));

      const saveAllBtn = screen.getByRole('button', { name: /запиши всички мачове/i });
      await user.click(saveAllBtn);

      // Check alert
      expect(
        screen.getByText('Възникна грешка при записване на турнирните мачове.')
      ).toBeInTheDocument();

      // Verify navigate was NOT called
      expect(mockNavigate).not.toHaveBeenCalled();

      // Schedule is still present
      expect(screen.getByRole('heading', { level: 2, name: 'Програма на срещите' })).toBeInTheDocument();
    });
  });

  describe('In-place team slot substitution & gating integration', () => {
    it('handles in-place player removal and substitution in tennis doubles', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Add 4 guests in tennis doubles
      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'Иван, Петър, Георги, Стоян');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Generate teams
      const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
      await user.click(generateBtn);

      expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
      const saveMatchBtn = screen.getByRole('button', { name: /запиши като мач/i });
      expect(saveMatchBtn).toBeEnabled();
      expect(screen.queryByText('Свободно място')).not.toBeInTheDocument();

      // Remove "Стоян" from the active pool
      const removeStoyanBtn = screen.getByRole('button', { name: 'Премахни Стоян' });
      await user.click(removeStoyanBtn);

      // Now 1 team is incomplete: placeholder is displayed
      expect(screen.getByText('Свободно място')).toBeInTheDocument();
      // "Запиши като мач" is disabled
      expect(screen.getByRole('button', { name: /запиши като мач/i })).toBeDisabled();
      // Validation warning is shown
      expect(screen.getByTestId('tennis-validation-warning')).toHaveTextContent(
        'Добавете още 1 играч за пълни двойки'
      );

      // Substitute with new guest "Васил"
      await user.type(guestInput, 'Васил');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Slot is filled with "Васил" (appears in both ActivePool and TeamCard)
      expect(screen.getAllByText('Васил')).toHaveLength(2);
      expect(screen.queryByText('Свободно място')).not.toBeInTheDocument();
      // Save as match is enabled again
      expect(screen.getByRole('button', { name: /запиши като мач/i })).toBeEnabled();
      // Validation warning is cleared
      expect(screen.queryByTestId('tennis-validation-warning')).not.toBeInTheDocument();
    });
  });

  describe('Tournament Context Integration (?tournamentId)', () => {
    it('renders tournament contextual header banner with title, format and back link', () => {
      renderComponent('/generator?tournamentId=t-1');

      expect(screen.getByText(/Турнир: Есенен турнир 2026 \(По двойки\)/i)).toBeInTheDocument();
      const backLink = screen.getByRole('link', { name: /обратно към турнира/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/tournaments/t-1');
    });

    it('locks mode to tennis and syncs format to tournament format (singles)', () => {
      renderComponent('/generator?tournamentId=t-singles');

      expect(screen.getByText(/Турнир: Турнир поединично \(Поединично\)/i)).toBeInTheDocument();
      const singlesBtn = screen.getByRole('button', { name: 'Поединично' });
      expect(singlesBtn).toHaveAttribute('aria-pressed', 'true');

      // Attempting to toggle format or mode is prevented
      const doublesBtn = screen.getByRole('button', { name: 'По двойки' });
      fireEvent.click(doublesBtn);
      expect(singlesBtn).toHaveAttribute('aria-pressed', 'true');

      const genericBtn = screen.getByRole('button', { name: '🎲 Универсален' });
      fireEvent.click(genericBtn);
      expect(screen.queryByLabelText(/брой отбори/i)).not.toBeInTheDocument();
    });

    it('calls bulkCreateMatches with tournamentId and redirects to /tournaments/:tournamentId upon saving all matches', async () => {
      const user = userEvent.setup();
      renderComponent('/generator?tournamentId=t-1');

      // Add 8 guests -> 4 doubles teams
      const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
      await user.type(guestInput, 'И1, И2, И3, И4, И5, И6, И7, И8');
      await user.click(screen.getByRole('button', { name: /добави/i }));

      // Generate teams
      await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

      // Generate schedule
      await user.click(screen.getByRole('button', { name: /генерирай програма с мачове/i }));

      const saveAllBtn = screen.getByRole('button', { name: /запиши всички мачове/i });
      expect(saveAllBtn).toBeInTheDocument();
      await user.click(saveAllBtn);

      expect(mockBulkCreateMatches).toHaveBeenCalledWith(expect.any(Array), 'doubles', 't-1');
      expect(mockNavigate).toHaveBeenCalledWith('/tournaments/t-1', {
        state: {
          fromBulkCreate: true,
          matchCount: 6,
        },
      });
    });
  });
});


import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const mockCreateMatch = vi.fn();
vi.mock('../../hooks/useMatches', () => ({
  useMatches: () => ({
    matches: [],
    loading: false,
    error: null,
    alert: null,
    createMatch: mockCreateMatch,
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

  const renderComponent = () => {
    return render(
      <ThemeProvider>
        <GeneratorPage />
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

    // Switch to Generic mode
    await user.click(screen.getByRole('button', { name: '🎲 Универсален' }));

    // Set number of teams = 2
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    // Balance by rating checkbox appears because ratings exist in pool
    const balanceCheckbox = screen.getByRole('checkbox', {
      name: /балансирай отборите по рейтинг на играчите/i,
    });
    expect(balanceCheckbox).toBeInTheDocument();
    await user.click(balanceCheckbox);
    expect(balanceCheckbox).toBeChecked();

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

    // Toggle mode to generic: displays general rating 1200 without format ratings
    const genericModeBtn = screen.getByRole('button', { name: '🎲 Универсален' });
    fireEvent.click(genericModeBtn);

    expect(screen.getByText('1200')).toBeInTheDocument();
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
});


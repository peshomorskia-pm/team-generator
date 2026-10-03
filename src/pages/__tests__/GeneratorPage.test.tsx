import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

describe('GeneratorPage Integration Tests', () => {
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
    await user.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));

    // Clear search and select second player
    await user.clear(searchInput);
    await user.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Re-type a search query to simulate active filter at time of clear
    await user.type(searchInput, 'Димитров');
    expect(searchInput.value).toBe('Димитров');

    // Set number of teams = 2 and generate
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
    await user.click(generateBtn);

    // Verify results exist
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();

    // Click 'Изчисти всички'
    const clearAllBtn = screen.getByRole('button', { name: /изчисти всички/i });
    await user.click(clearAllBtn);

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
    await user.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));

    // Add 1 guest player
    const guestInput = screen.getByPlaceholderText('напр. Иван, Петър, Георги');
    await user.type(guestInput, 'Гост Стоян');
    await user.click(screen.getByRole('button', { name: /добави/i }));

    // Set number of teams = 2
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    // Generate teams
    await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Assert results are rendered
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();

    // Assert 'Запиши като мач' button is rendered
    const saveAsMatchBtn = screen.getByRole('button', { name: /запиши като мач/i });
    expect(saveAsMatchBtn).toBeInTheDocument();

    // Click 'Запиши като мач'
    await user.click(saveAsMatchBtn);

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
    await user.click(cancelBtn);

    // Assert modal closes
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Assert generator state and teams remain intact
    expect(screen.getByRole('heading', { level: 2, name: 'Резултати' })).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
  });

  it('Scenario 2 (Submission & Navigation): generates 2 teams -> submits MatchModal -> navigates to /matches', async () => {
    const user = userEvent.setup();
    mockCreateMatch.mockResolvedValue(true);

    renderComponent();

    // Select 2 registered players
    await user.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    await user.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    // Set number of teams = 2
    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    // Generate teams
    await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Open MatchModal
    await user.click(screen.getByRole('button', { name: /запиши като мач/i }));

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();

    // Submit modal (Create button)
    const submitBtn = within(modalDialog).getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

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
    const user = userEvent.setup();
    mockCreateMatch.mockResolvedValue(false);

    renderComponent();

    await user.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    await user.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));
    await user.click(screen.getByRole('button', { name: /запиши като мач/i }));

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();

    const submitBtn = within(modalDialog).getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

    expect(mockCreateMatch).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles format toggle interaction and passes active format into MatchModal', async () => {
    const user = userEvent.setup();
    mockCreateMatch.mockResolvedValue(true);

    renderComponent();

    // Select format "По двойки"
    const doublesFormatBtn = screen.getByRole('button', { name: 'По двойки' });
    const singlesFormatBtn = screen.getByRole('button', { name: 'Поединично' });

    expect(singlesFormatBtn).toHaveAttribute('aria-pressed', 'true');
    expect(doublesFormatBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(doublesFormatBtn);
    expect(doublesFormatBtn).toHaveAttribute('aria-pressed', 'true');
    expect(singlesFormatBtn).toHaveAttribute('aria-pressed', 'false');

    // Add players and generate teams
    await user.click(screen.getByRole('checkbox', { name: 'Иван Иванов' }));
    await user.click(screen.getByRole('checkbox', { name: 'Георги Димитров' }));

    const numTeamsInput = screen.getByLabelText(/брой отбори/i);
    await user.clear(numTeamsInput);
    await user.type(numTeamsInput, '2');

    await user.click(screen.getByRole('button', { name: /разпредели в отбори/i }));

    // Click "Запиши като мач"
    await user.click(screen.getByRole('button', { name: /запиши като мач/i }));

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeInTheDocument();

    // Verify MatchModal initialized with doubles format
    const modalDoublesBtn = within(modalDialog).getByRole('button', { name: 'По двойки' });
    expect(modalDoublesBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

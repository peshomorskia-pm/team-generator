import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerProfileModal } from '../PlayerProfileModal';
import type { PlayerProfileData } from '../../../utils/playerProfileStats';
import type { MatchDetail } from '../../../types/matches';

const mockPlayerProfileData: PlayerProfileData = {
  playerId: 'p-1',
  summary: {
    all: {
      matchesPlayed: 10,
      wins: 7,
      losses: 3,
      winRate: 70.0,
      gamesWon: 55,
      gamesLost: 40,
      gameDifference: 15,
      form: ['W', 'L', 'W', 'W', 'W'],
    },
    doubles: {
      matchesPlayed: 6,
      wins: 4,
      losses: 2,
      winRate: 66.7,
      gamesWon: 32,
      gamesLost: 24,
      gameDifference: 8,
      form: ['W', 'L', 'W', 'W'],
    },
    singles: {
      matchesPlayed: 4,
      wins: 3,
      losses: 1,
      winRate: 75.0,
      gamesWon: 23,
      gamesLost: 16,
      gameDifference: 7,
      form: ['W', 'W', 'W'],
    },
  },
  timeline: [
    {
      matchId: 'm-1',
      date: '2026-03-01T10:00:00Z',
      format: 'doubles',
      isWinner: true,
      partner: { id: 'p-2', name: 'Георги Иванов' },
      opponents: [
        { id: 'p-3', name: 'Петър Симеонов' },
        { id: 'p-4', name: 'Димитър Колев' },
      ],
      scoreDisplay: '6:4, 6:3',
      tournamentName: 'Пролетен Турнир',
      stage: 'final',
    },
    {
      matchId: 'm-2',
      date: '2026-02-15T10:00:00Z',
      format: 'singles',
      isWinner: false,
      opponents: [{ id: 'p-3', name: 'Петър Симеонов' }],
      scoreDisplay: '4:6, 3:6',
      tournamentName: undefined,
    },
  ],
  partners: [
    {
      partnerId: 'p-2',
      partnerName: 'Георги Иванов',
      matchesTogether: 6,
      wins: 4,
      losses: 2,
      winRate: 66.7,
    },
  ],
  rivals: [
    {
      rivalId: 'p-3',
      rivalName: 'Петър Симеонов',
      encounters: 5,
      wins: 3,
      losses: 2,
      winRate: 60.0,
    },
  ],
  titles: [
    {
      tournamentId: 't-1',
      tournamentName: 'Пролетен Турнир',
      date: '2026-03-01T10:00:00Z',
      format: 'doubles',
    },
  ],
  favoritePartner: {
    partnerId: 'p-2',
    partnerName: 'Георги Иванов',
    matchesTogether: 6,
    wins: 4,
    losses: 2,
    winRate: 66.7,
  },
  topRival: {
    rivalId: 'p-3',
    rivalName: 'Петър Симеонов',
    encounters: 5,
    wins: 3,
    losses: 2,
    winRate: 60.0,
  },
  mainRival: {
    rivalId: 'p-3',
    rivalName: 'Петър Симеонов',
    encounters: 5,
    wins: 3,
    losses: 2,
    winRate: 60.0,
  },
  titlesCount: 1,
};

describe('PlayerProfileModal Component', () => {
  it('1. renders nothing when isOpen is false', () => {
    const { container } = render(
      <PlayerProfileModal
        isOpen={false}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. renders dialog container with accessibility attributes when isOpen is true', () => {
    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'player-profile-title');
    expect(screen.getByRole('heading', { name: 'Иван Петров' })).toHaveAttribute(
      'id',
      'player-profile-title'
    );
  });

  it('3. renders player name and initial avatar correctly', () => {
    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const avatar = screen.getByTestId('player-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('И');
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
  });

  it('4. renders doubles and singles standing rank badges', () => {
    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
        doublesRank={1}
        singlesRank={3}
      />
    );

    expect(screen.getByText('#1 по двойки')).toBeInTheDocument();
    expect(screen.getByText('#3 поединично')).toBeInTheDocument();
  });

  it('5. renders "Нов" badge when player is unranked with 0 matches', () => {
    const emptyProfileData: PlayerProfileData = {
      ...mockPlayerProfileData,
      summary: {
        all: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 50.0,
          gamesWon: 0,
          gamesLost: 0,
          gameDifference: 0,
          form: [],
        },
        doubles: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 50.0,
          gamesWon: 0,
          gamesLost: 0,
          gameDifference: 0,
          form: [],
        },
        singles: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 50.0,
          gamesWon: 0,
          gamesLost: 0,
          gameDifference: 0,
          form: [],
        },
      },
      timeline: [],
      favoritePartner: null,
      topRival: null,
      titles: [],
    };

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-new"
        playerName="Нов Играч"
        profileData={emptyProfileData}
        doublesRank={null}
        singlesRank={null}
      />
    );

    expect(screen.getByText('Нов')).toBeInTheDocument();
  });

  it('6. invokes onClose when 44px close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={handleClose}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Затвори' });
    expect(closeBtn).toHaveClass('min-w-[44px]', 'min-h-[44px]');

    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('7. invokes onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={handleClose}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('8. invokes onClose when clicking on backdrop', () => {
    const handleClose = vi.fn();

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={handleClose}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('9. does not trigger onClose when clicking inside the dialog card', () => {
    const handleClose = vi.fn();

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={handleClose}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('10. defaults to "Всички" tab and renders aggregate summary stats', () => {
    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const allTab = screen.getByRole('tab', { name: 'Всички' });
    expect(allTab).toHaveAttribute('aria-selected', 'true');

    expect(within(screen.getByTestId('stat-matches')).getByText('10')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-wins')).getByText('7')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-losses')).getByText('3')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-winrate')).getByText('70%')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-gamediff')).getByText('+15')).toBeInTheDocument();
  });

  it('11. switches to "По двойки" tab and updates metrics and timeline', async () => {
    const user = userEvent.setup();

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const doublesTab = screen.getByRole('tab', { name: 'По двойки' });
    await user.click(doublesTab);

    expect(doublesTab).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByTestId('stat-matches')).getByText('6')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-wins')).getByText('4')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-losses')).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-winrate')).getByText('66.7%')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-gamediff')).getByText('+8')).toBeInTheDocument();

    // Verify timeline only shows doubles match
    expect(screen.getByText('6:4, 6:3')).toBeInTheDocument();
    expect(screen.queryByText('4:6, 3:6')).not.toBeInTheDocument();
  });

  it('12. switches to "Поединично" tab and updates metrics and timeline', async () => {
    const user = userEvent.setup();

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const singlesTab = screen.getByRole('tab', { name: 'Поединично' });
    await user.click(singlesTab);

    expect(singlesTab).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByTestId('stat-matches')).getByText('4')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-wins')).getByText('3')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-losses')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-winrate')).getByText('75%')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-gamediff')).getByText('+7')).toBeInTheDocument();

    // Verify timeline only shows singles match
    expect(screen.getByText('4:6, 3:6')).toBeInTheDocument();
    expect(screen.queryByText('6:4, 6:3')).not.toBeInTheDocument();
  });

  it('13. renders Favorite Partner and Top Rival cards with stats', () => {
    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const partnerCard = screen.getByTestId('card-favorite-partner');
    expect(within(partnerCard).getByText('Любим партньор')).toBeInTheDocument();
    expect(within(partnerCard).getByText('Георги Иванов')).toBeInTheDocument();
    expect(
      within(partnerCard).getByText(/6 мача \(4П - 2З, 66\.7%\)/)
    ).toBeInTheDocument();

    const rivalCard = screen.getByTestId('card-top-rival');
    expect(within(rivalCard).getByText('Най-чест съперник')).toBeInTheDocument();
    expect(within(rivalCard).getByText('Петър Симеонов')).toBeInTheDocument();
    expect(
      within(rivalCard).getByText(/5 мача \(3П - 2З, 60%\)/)
    ).toBeInTheDocument();
  });

  it('14. renders tournament championship titles card when titles exist', () => {
    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-1"
        playerName="Иван Петров"
        profileData={mockPlayerProfileData}
      />
    );

    const titlesCard = screen.getByTestId('card-championship-titles');
    expect(within(titlesCard).getByText(/🏆 Титли \(1\)/)).toBeInTheDocument();
    expect(within(titlesCard).getByText('Пролетен Турнир')).toBeInTheDocument();
  });

  it('15. renders friendly Bulgarian empty states when player has 0 matches', () => {
    const emptyProfileData: PlayerProfileData = {
      playerId: 'p-empty',
      summary: {
        all: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 50.0,
          gamesWon: 0,
          gamesLost: 0,
          gameDifference: 0,
          form: [],
        },
        doubles: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 50.0,
          gamesWon: 0,
          gamesLost: 0,
          gameDifference: 0,
          form: [],
        },
        singles: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 50.0,
          gamesWon: 0,
          gamesLost: 0,
          gameDifference: 0,
          form: [],
        },
      },
      timeline: [],
      partners: [],
      rivals: [],
      titles: [],
      favoritePartner: null,
      topRival: null,
      mainRival: null,
      titlesCount: 0,
    };

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-empty"
        playerName="Празен Играч"
        profileData={emptyProfileData}
      />
    );

    expect(
      screen.getByText('Този играч все още няма записани изиграни срещи.')
    ).toBeInTheDocument();
    expect(screen.getByText('Няма изиграни мачове по двойки')).toBeInTheDocument();
    expect(screen.getByText('Няма регистрирани съперници')).toBeInTheDocument();
    expect(screen.queryByTestId('card-championship-titles')).not.toBeInTheDocument();
  });

  it('16. calculates profile data on-the-fly when profileData prop is not passed', () => {
    const rawMatches: MatchDetail[] = [
      {
        id: 'raw-1',
        match_format: 'singles',
        team_1_score: 6,
        team_2_score: 2,
        played_at: '2026-03-01T12:00:00Z',
        created_at: '2026-03-01T12:00:00Z',
        updated_at: '2026-03-01T12:00:00Z',
        match_players: [
          {
            id: 'mp-1',
            match_id: 'raw-1',
            player_id: 'p-onthefly',
            team_side: 'team_1',
            guest_name: null,
            rating_before: null,
            rating_after: null,
            players: { id: 'p-onthefly', name: 'Динамичен Играч' },
          },
          {
            id: 'mp-2',
            match_id: 'raw-1',
            player_id: 'p-opp',
            team_side: 'team_2',
            guest_name: null,
            rating_before: null,
            rating_after: null,
            players: { id: 'p-opp', name: 'Опонент' },
          },
        ],
      },
    ];

    render(
      <PlayerProfileModal
        isOpen={true}
        onClose={vi.fn()}
        playerId="p-onthefly"
        playerName="Динамичен Играч"
        matches={rawMatches}
      />
    );

    // Should compute 1 match, 1 win, 0 losses, 100% win rate
    expect(screen.getByText('Динамичен Играч')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-matches')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-wins')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-losses')).getByText('0')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-winrate')).getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('6:2')).toBeInTheDocument(); // perspective score
  });
});

import type { Team, GeneratorMode, AlertNotification } from './index';
import type { GeneratorPlayer, DatabasePlayer } from './generator';

export interface TournamentGroup {
  id: string; // e.g. 'group-0'
  name: string; // e.g. 'Група А'
  teams: Team[];
}

export interface TournamentMatch {
  id: string; // Format: 'match-group-0-r1-m1'
  groupId: string;
  groupName: string;
  round: number; // 1-indexed (1, 2, 3...)
  team1: Team;
  team2: Team;
  byeTeam?: Team; // Resting team in this round, if applicable
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
  byeTeam?: Team;
}

export interface UseTeamGeneratorReturn {
  mode: GeneratorMode;
  setMode: (mode: GeneratorMode) => void;
  canGenerate: boolean;
  validationError: string | null;
  validationMessage: string | null;
  activePool: GeneratorPlayer[];
  players: GeneratorPlayer[];
  numberOfTeams: number | null;
  setNumberOfTeams: (val: number | null) => void;
  playersPerTeam: number | null;
  setPlayersPerTeam: (val: number | null) => void;
  teams: Team[];
  targetTeamSize: number;
  hasIncompleteTeams: boolean;
  groups: TournamentGroup[];
  drawGroups: () => void;
  resetGroups: () => void;
  clearGroups: () => void;
  schedule: TournamentMatch[];
  generateSchedule: () => void;
  resetSchedule: () => void;
  history: string[];
  alert: AlertNotification | null;
  showAlert: (message: string, type?: 'error' | 'success') => void;
  isCopied: boolean;
  balanceByRating: boolean;
  setBalanceByRating: (val: boolean) => void;
  format: 'singles' | 'doubles';
  setFormat: (format: 'singles' | 'doubles') => void;
  addGuest: (name: string) => void;
  toggleRegisteredPlayer: (
    player:
      | DatabasePlayer
      | {
          id: string;
          name: string;
          rating?: number;
          singles_rating?: number;
          doubles_rating?: number;
        }
  ) => void;
  addRegisteredPlayer?: (
    player:
      | DatabasePlayer
      | {
          id: string;
          name: string;
          rating?: number;
          singles_rating?: number;
          doubles_rating?: number;
        }
  ) => void;
  removePlayer: (id: string) => void;
  clearPool: () => void;
  generateTeams: (teamCount?: number, balanceByRatingParam?: boolean) => void;
  shuffleSingleTeam: (teamId: string) => void;
  copyResults: () => Promise<boolean>;
}

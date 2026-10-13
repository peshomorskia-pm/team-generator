import type { Team, GeneratorMode, AlertNotification } from './index';
import type { GeneratorPlayer, DatabasePlayer, TeamFormationMode } from './generator';

export type TournamentStatus = 'draft' | 'in_progress' | 'completed';
export type TournamentFormat = 'singles' | 'doubles';

export interface TournamentDraftState {
  targetTeams: number;
  formationMode: TeamFormationMode; // 'auto' | 'manual'
  teams: Team[];
  activePool: GeneratorPlayer[];
  groups?: TournamentGroup[] | null;
  schedule?: TournamentMatch[] | null;
}

export interface Tournament {
  id: string;
  title: string;
  date: string;
  format: TournamentFormat;
  status: TournamentStatus;
  winner_team_name: string | null;
  notes: string | null;
  draft_state?: TournamentDraftState | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTournamentInput {
  title: string;
  date?: string;
  format?: TournamentFormat;
  status?: TournamentStatus;
  winner_team_name?: string | null;
  notes?: string | null;
  draft_state?: TournamentDraftState | null;
}

export interface UpdateTournamentInput {
  title?: string;
  date?: string;
  format?: TournamentFormat;
  status?: TournamentStatus;
  winner_team_name?: string | null;
  notes?: string | null;
  draft_state?: TournamentDraftState | null;
}

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

export interface UseTeamGeneratorOptions {
  initialMode?: GeneratorMode;
  initialFormat?: 'singles' | 'doubles';
  initialDraftState?: TournamentDraftState | null;
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
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  targetTeamSize: number;
  hasIncompleteTeams: boolean;
  groups: TournamentGroup[];
  drawGroups: (teamsOverride?: Team[]) => void;
  resetGroups: () => void;
  clearGroups: () => void;
  drawnGroups: TournamentGroup[];
  setDrawnGroups: (groups: TournamentGroup[] | ((prev: TournamentGroup[]) => TournamentGroup[])) => void;
  unassignedTeams: Team[];
  hasValidGroupsForSchedule: boolean;
  groupValidationMessage: string | null;
  initializeBlankGroups: (totalTeams?: number) => TournamentGroup[];
  assignTeamToGroup: (groupId: string, team: Team) => void;
  removeTeamFromGroup: (groupId: string, teamId: string) => void;
  moveTeamBetweenGroups: (teamId: string, targetGroupId: string) => void;
  autoFillRemainingGroupTeams: () => void;
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
  formationMode: import('./generator').TeamFormationMode;
  setFormationMode: (mode: import('./generator').TeamFormationMode) => void;
  teamFormationMode: import('./generator').TeamFormationMode;
  setTeamFormationMode: (mode: import('./generator').TeamFormationMode) => void;
  unassignedPoolPlayers: GeneratorPlayer[];
  initializeBlankTeams: (numTeams: number, playersPerTeam?: number) => void;
  addBlankTeam: () => void;
  deleteTeam: (teamId: string) => void;
  assignPlayerToTeam: (teamId: string, player: GeneratorPlayer) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;
  autoFillRemainingSlots: (balance?: boolean) => void;
  hydrateFromDraft?: (draftState: TournamentDraftState) => void;
}

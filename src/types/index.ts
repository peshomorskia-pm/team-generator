export interface Player {
  id: string;
  name: string;
  rating?: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  totalRating?: number;
}

export interface PlayerInputProps {
  onAddPlayer: (name: string, rating?: number) => void;
  isLoading?: boolean;
}

export interface TeamSettingsProps {
  numberOfTeams: number;
  onSettingsChange: (teams: number) => void;
  onGenerate: () => void;
  playersPerTeam?: number | '';
  onPlayersPerTeamChange?: (count: number | '') => void;
}

export interface TeamListProps {
  teams: Team[];
  onShuffleTeam?: (teamId: string) => void;
}

export interface TeamCardProps {
  team: Team;
}

export interface AlertNotification {
  message: string;
  type: 'error' | 'success';
}

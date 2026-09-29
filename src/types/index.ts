import type { LucideIcon } from 'lucide-react';

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
  value?: string;
  onChange?: (val: string) => void;
  playerCount?: number;
}

export interface TeamSettingsProps {
  numberOfTeams: number;
  onSettingsChange: (teams: number) => void;
  onGenerate: () => void;
  playersPerTeam?: number | null;
  onPlayersPerTeamChange?: (count: number | null) => void;
  balanceByRating?: boolean;
  onBalanceToggle?: (checked: boolean) => void;
  hasRatings?: boolean;
}

export interface TeamListProps {
  teams: Team[];
  onShuffleTeam?: (teamId: string) => void;
  onCopy?: () => void;
  isCopied?: boolean;
}

export interface TeamCardProps {
  team: Team;
  index?: number;
  onShuffleTeam?: (teamId: string) => void;
}

export interface AlertNotification {
  message: string;
  type: 'error' | 'success';
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  end?: boolean;
}

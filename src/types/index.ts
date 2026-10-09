import type { LucideIcon } from 'lucide-react';

export interface Player {
  id: string;
  name: string;
  rating?: number;
  singles_rating?: number;
  doubles_rating?: number;
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

export type GeneratorMode = 'tennis' | 'generic';

export interface TeamSettingsProps {
  mode?: GeneratorMode;
  onModeChange?: (mode: GeneratorMode) => void;
  numberOfTeams?: number | null;
  onSettingsChange?: (teams: number | null) => void;
  onGenerate: () => void;
  playersPerTeam?: number | null;
  onPlayersPerTeamChange?: (count: number | null) => void;
  balanceByRating?: boolean;
  onBalanceToggle?: (checked: boolean) => void;
  hasRatings?: boolean;
  format?: 'singles' | 'doubles';
  onFormatChange?: (format: 'singles' | 'doubles') => void;
  canGenerate?: boolean;
  validationError?: string | null;
}

export interface TeamListProps {
  teams: Team[];
  onShuffleTeam?: (teamId: string) => void;
  onCopy?: () => void;
  isCopied?: boolean;
  onSaveAsMatch?: () => void;
  format?: 'singles' | 'doubles';
  mode?: GeneratorMode;
  onDrawGroups?: () => void;
  hasIncompleteTeams?: boolean;
  targetTeamSize?: number;
}

export interface TeamCardProps {
  team: Team;
  index?: number;
  onShuffleTeam?: (teamId: string) => void;
  format?: 'singles' | 'doubles';
  mode?: GeneratorMode;
  targetSize?: number;
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

export * from './generator';
export * from './matches';
export * from './tournament';


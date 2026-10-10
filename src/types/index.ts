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
  formationMode?: import('./generator').TeamFormationMode;
  onFormationModeChange?: (mode: import('./generator').TeamFormationMode) => void;
  manualTeamCount?: number;
  onManualTeamCountChange?: (count: number) => void;
  onCreateBlankTeams?: () => void;
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
  formationMode?: import('./generator').TeamFormationMode;
  onSelectEmptySlot?: (teamId: string) => void;
  onRemovePlayer?: (teamId: string, playerId: string) => void;
  onAutoFillRemaining?: () => void;
}

export interface TeamCardProps {
  team: Team;
  index?: number;
  onShuffleTeam?: (teamId: string) => void;
  format?: 'singles' | 'doubles';
  mode?: GeneratorMode;
  targetSize?: number;
  onSelectEmptySlot?: (teamId: string) => void;
  onRemovePlayer?: (teamId: string, playerId: string) => void;
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


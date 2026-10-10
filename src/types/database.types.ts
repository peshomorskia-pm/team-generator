export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string; // uuid
          name: string; // text
          rating: number; // numeric
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
          singles_rating?: number; // numeric
          doubles_rating?: number; // numeric
          singles_matches_played?: number; // integer
          singles_wins?: number; // integer
          singles_losses?: number; // integer
          doubles_matches_played?: number; // integer
          doubles_wins?: number; // integer
          doubles_losses?: number; // integer
        };
        Insert: {
          id?: string;
          name: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
          singles_rating?: number;
          doubles_rating?: number;
          singles_matches_played?: number;
          singles_wins?: number;
          singles_losses?: number;
          doubles_matches_played?: number;
          doubles_wins?: number;
          doubles_losses?: number;
        };
        Update: {
          id?: string;
          name?: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
          singles_rating?: number;
          doubles_rating?: number;
          singles_matches_played?: number;
          singles_wins?: number;
          singles_losses?: number;
          doubles_matches_played?: number;
          doubles_wins?: number;
          doubles_losses?: number;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string; // uuid
          match_format?: 'singles' | 'doubles'; // text
          team_1_name?: string | null; // text
          team_2_name?: string | null; // text
          group_name?: string | null; // text
          round?: number | null; // integer
          team_1_score: number | null; // integer
          team_2_score: number | null; // integer
          played_at: string; // timestamptz
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          match_format?: 'singles' | 'doubles';
          team_1_name?: string | null;
          team_2_name?: string | null;
          group_name?: string | null;
          round?: number | null;
          team_1_score?: number | null;
          team_2_score?: number | null;
          played_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_format?: 'singles' | 'doubles';
          team_1_name?: string | null;
          team_2_name?: string | null;
          group_name?: string | null;
          round?: number | null;
          team_1_score?: number | null;
          team_2_score?: number | null;
          played_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      match_players: {
        Row: {
          id: string; // uuid
          match_id: string; // uuid
          player_id: string | null; // uuid
          guest_name: string | null; // text
          team_side: 'team_1' | 'team_2'; // text
          rating_before: number | null; // integer
          rating_after: number | null; // integer
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id?: string | null;
          guest_name?: string | null;
          team_side: 'team_1' | 'team_2';
          rating_before?: number | null;
          rating_after?: number | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string | null;
          guest_name?: string | null;
          team_side?: 'team_1' | 'team_2';
          rating_before?: number | null;
          rating_after?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_players_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_players_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type PlayerRow = Database['public']['Tables']['players']['Row'];
export type PlayerInsert = Database['public']['Tables']['players']['Insert'];
export type PlayerUpdate = Database['public']['Tables']['players']['Update'];

export type MatchRow = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];
export type MatchUpdate = Database['public']['Tables']['matches']['Update'];

export type MatchPlayerRow = Database['public']['Tables']['match_players']['Row'];
export type MatchPlayerInsert = Database['public']['Tables']['match_players']['Insert'];
export type MatchPlayerUpdate = Database['public']['Tables']['match_players']['Update'];

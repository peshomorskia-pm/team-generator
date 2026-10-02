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
        };
        Insert: {
          id?: string;
          name: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string; // uuid
          team_1_score: number; // integer
          team_2_score: number; // integer
          played_at: string; // timestamptz
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          team_1_score: number;
          team_2_score: number;
          played_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_1_score?: number;
          team_2_score?: number;
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

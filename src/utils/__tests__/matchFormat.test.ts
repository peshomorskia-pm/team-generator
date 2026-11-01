import { describe, expect, it } from 'vitest';
import { resolveMatchFormat } from '../matchFormat';

describe('resolveMatchFormat', () => {
  it('returns doubles when team 1 or team 2 has > 1 participant', () => {
    const resultTeam1 = resolveMatchFormat({
      match_players: [
        { team_side: 'team_1' },
        { team_side: 'team_1' },
        { team_side: 'team_2' },
      ],
    });
    expect(resultTeam1).toBe('doubles');

    const resultTeam2 = resolveMatchFormat({
      match_players: [
        { team_side: 'team_1' },
        { team_side: 'team_2' },
        { team_side: 'team_2' },
      ],
    });
    expect(resultTeam2).toBe('doubles');
  });

  it('returns doubles when match_format is explicitly doubles even with single participants', () => {
    const result = resolveMatchFormat({
      match_format: 'doubles',
      match_players: [
        { team_side: 'team_1' },
        { team_side: 'team_2' },
      ],
    });
    expect(result).toBe('doubles');
  });

  it('returns singles when match_format is singles or null with 1 participant per team', () => {
    const resultSingles = resolveMatchFormat({
      match_format: 'singles',
      match_players: [
        { team_side: 'team_1' },
        { team_side: 'team_2' },
      ],
    });
    expect(resultSingles).toBe('singles');

    const resultNullFormat = resolveMatchFormat({
      match_format: null,
      match_players: [
        { team_side: 'team_1' },
        { team_side: 'team_2' },
      ],
    });
    expect(resultNullFormat).toBe('singles');
  });

  it('handles empty match_players and null match_format gracefully by returning singles', () => {
    const result = resolveMatchFormat({
      match_format: null,
      match_players: [],
    });
    expect(result).toBe('singles');
  });

  it('handles undefined match_players gracefully', () => {
    const result = resolveMatchFormat({});
    expect(result).toBe('singles');
  });
});

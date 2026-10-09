import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyTextToClipboard, formatTeamsForClipboard, formatGroupsForClipboard } from '../clipboard';
import type { Team, TournamentGroup } from '../../types';

describe('clipboard utils', () => {
  describe('copyTextToClipboard', () => {
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
      document.execCommand = originalExecCommand;
    });

    it('successfully copies using navigator.clipboard.writeText when available', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const result = await copyTextToClipboard('Test content');

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('Test content');
    });

    it('falls back to execCommand when navigator.clipboard is undefined', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const execMock = vi.fn().mockReturnValue(true);
      document.execCommand = execMock;

      const result = await copyTextToClipboard('Fallback content');

      expect(result).toBe(true);
      expect(execMock).toHaveBeenCalledWith('copy');
      // Verify no leaked textarea in DOM
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('falls back to execCommand when navigator.clipboard.writeText rejects', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const execMock = vi.fn().mockReturnValue(true);
      document.execCommand = execMock;

      const result = await copyTextToClipboard('Fallback on rejection');

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('Fallback on rejection');
      expect(execMock).toHaveBeenCalledWith('copy');
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('returns false when both navigator.clipboard and execCommand fail', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const execMock = vi.fn().mockReturnValue(false);
      document.execCommand = execMock;

      const result = await copyTextToClipboard('Failed copy');

      expect(result).toBe(false);
      expect(execMock).toHaveBeenCalledWith('copy');
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('returns false when execCommand throws an error', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error('execCommand disabled');
      });

      const result = await copyTextToClipboard('Exception handling');

      expect(result).toBe(false);
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('configures fallback textarea with viewport-safe styles and cleans up from DOM', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      let textareaCaptured: HTMLTextAreaElement | null = null;
      document.execCommand = vi.fn().mockImplementation(() => {
        textareaCaptured = document.querySelector('textarea');
        return true;
      });

      const result = await copyTextToClipboard('Verify styles');

      expect(result).toBe(true);
      expect(textareaCaptured).not.toBeNull();
      if (textareaCaptured) {
        const el = textareaCaptured as HTMLTextAreaElement;
        expect(el.style.position).toBe('fixed');
        expect(el.style.top).toBe('0px');
        expect(el.style.left).toBe('0px');
        expect(el.style.opacity).toBe('0');
        expect(el.style.pointerEvents).toBe('none');
        expect(el.readOnly).toBe(true);
        expect(el.value).toBe('Verify styles');
      }

      expect(document.querySelector('textarea')).toBeNull();
    });
  });

  describe('formatTeamsForClipboard', () => {
    const sampleTeamsWithoutRatings: Team[] = [
      {
        id: 'team-1',
        name: 'Отбор 1',
        players: [
          { id: 'p1', name: 'Иван' },
          { id: 'p2', name: 'Петър' },
        ],
      },
      {
        id: 'team-2',
        name: 'Отбор 2',
        players: [
          { id: 'p3', name: 'Георги' },
          { id: 'p4', name: 'Стоян' },
        ],
      },
    ];

    const sampleTeamsWithRatings: Team[] = [
      {
        id: 'team-1',
        name: 'Отбор 1',
        totalRating: 3200,
        players: [
          { id: 'p1', name: 'Иван', rating: 1600, singles_rating: 1650, doubles_rating: 1600 },
          { id: 'p2', name: 'Петър', rating: 1600, singles_rating: 1550, doubles_rating: 1600 },
        ],
      },
      {
        id: 'team-2',
        name: 'Отбор 2',
        totalRating: 2800,
        players: [
          { id: 'p3', name: 'Георги', rating: 1400, singles_rating: 1400, doubles_rating: 1400 },
          { id: 'p4', name: 'Стоян', rating: 1400, singles_rating: 1400, doubles_rating: 1400 },
        ],
      },
    ];

    it('returns empty string if teams array is empty', () => {
      expect(formatTeamsForClipboard([])).toBe('');
    });

    it('formats tennis doubles mode with 2 teams and matchup line', () => {
      const output = formatTeamsForClipboard(sampleTeamsWithoutRatings, 'tennis', 'doubles');

      expect(output).toContain('🎾 Тенис - По двойки');
      expect(output).toContain('Отбор 1:\n- Иван\n- Петър');
      expect(output).toContain('Отбор 2:\n- Георги\n- Стоян');
      expect(output).toContain('Среща: Отбор 1 vs Отбор 2');
    });

    it('formats tennis singles mode with 2 teams and matchup line', () => {
      const singlesTeams: Team[] = [
        { id: 'team-1', name: 'Отбор 1', players: [{ id: 'p1', name: 'Иван' }] },
        { id: 'team-2', name: 'Отбор 2', players: [{ id: 'p2', name: 'Георги' }] },
      ];

      const output = formatTeamsForClipboard(singlesTeams, 'tennis', 'singles');

      expect(output).toContain('🎾 Тенис - Поединично');
      expect(output).toContain('Отбор 1:\n- Иван');
      expect(output).toContain('Отбор 2:\n- Георги');
      expect(output).toContain('Среща: Отбор 1 vs Отбор 2');
    });

    it('formats generic mode without matchup line', () => {
      const output = formatTeamsForClipboard(sampleTeamsWithoutRatings, 'generic');

      expect(output).toContain('🎲 Универсални отбори');
      expect(output).toContain('Отбор 1:\n- Иван\n- Петър');
      expect(output).toContain('Отбор 2:\n- Георги\n- Стоян');
      expect(output).not.toContain('Среща:');
    });

    it('does not include matchup line in tennis mode when team count is not 2', () => {
      const threeTeams: Team[] = [
        ...sampleTeamsWithoutRatings,
        { id: 'team-3', name: 'Отбор 3', players: [{ id: 'p5', name: 'Димитър' }] },
      ];

      const output = formatTeamsForClipboard(threeTeams, 'tennis', 'doubles');

      expect(output).toContain('🎾 Тенис - По двойки');
      expect(output).toContain('Отбор 3:\n- Димитър');
      expect(output).not.toContain('Среща:');
    });

    it('includes player ratings and team total rating when ratings exist', () => {
      const output = formatTeamsForClipboard(sampleTeamsWithRatings, 'tennis', 'doubles');

      expect(output).toContain('Отбор 1 (Общ рейтинг: 3200):');
      expect(output).toContain('- Иван (★ 1600)');
      expect(output).toContain('- Петър (★ 1600)');
      expect(output).toContain('Отбор 2 (Общ рейтинг: 2800):');
      expect(output).toContain('- Георги (★ 1400)');
      expect(output).toContain('- Стоян (★ 1400)');
    });

    it('uses singles ratings in tennis singles mode when available', () => {
      const singlesWithRatings: Team[] = [
        {
          id: 'team-1',
          name: 'Отбор 1',
          totalRating: 1650,
          players: [{ id: 'p1', name: 'Иван', singles_rating: 1650, doubles_rating: 1600, rating: 1500 }],
        },
        {
          id: 'team-2',
          name: 'Отбор 2',
          totalRating: 1400,
          players: [{ id: 'p2', name: 'Георги', singles_rating: 1400, doubles_rating: 1300, rating: 1350 }],
        },
      ];

      const output = formatTeamsForClipboard(singlesWithRatings, 'tennis', 'singles');

      expect(output).toContain('🎾 Тенис - Поединично');
      expect(output).toContain('Отбор 1 (Общ рейтинг: 1650):');
      expect(output).toContain('- Иван (★ 1650)');
      expect(output).toContain('Отбор 2 (Общ рейтинг: 1400):');
      expect(output).toContain('- Георги (★ 1400)');
    });
  });

  describe('formatGroupsForClipboard', () => {
    it('returns empty string if groups array is empty', () => {
      expect(formatGroupsForClipboard([])).toBe('');
    });

    it('formats tournament groups into structured Bulgarian plaintext', () => {
      const dummyGroups: TournamentGroup[] = [
        {
          id: 'group-0',
          name: 'Група А',
          teams: [
            {
              id: 'team-1',
              name: 'Отбор 1',
              players: [{ id: 'p1', name: 'Иван', rating: 1500 }],
            },
            {
              id: 'team-2',
              name: 'Отбор 2',
              players: [{ id: 'p2', name: 'Петър', rating: 1400 }],
            },
          ],
        },
        {
          id: 'group-1',
          name: 'Група Б',
          teams: [
            {
              id: 'team-3',
              name: 'Отбор 3',
              players: [{ id: 'p3', name: 'Георги', rating: 1600 }],
            },
          ],
        },
      ];

      const text = formatGroupsForClipboard(dummyGroups, 'tennis');
      expect(text).toContain('🏆 Турнирни групи');
      expect(text).toContain('📌 Група А:');
      expect(text).toContain('- Отбор 1: Иван (★ 1500)');
      expect(text).toContain('- Отбор 2: Петър (★ 1400)');
      expect(text).toContain('📌 Група Б:');
      expect(text).toContain('- Отбор 3: Георги (★ 1600)');
    });
  });
});


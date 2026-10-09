import { Team, GeneratorMode } from '../types';

/**
 * Copies plain text to system clipboard using modern Clipboard API with
 * viewport-safe DOM fallback and return-value verification.
 *
 * @param text - Text content to copy
 * @returns Promise<boolean> - true if successfully copied, false otherwise
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // 1. Primary: Try modern async Clipboard API if available
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Async clipboard rejected (e.g. permission denied or window unfocused) -> fallback
    }
  }

  // 2. Secondary fallback: Viewport-safe DOM textarea + document.execCommand('copy')
  if (typeof document !== 'undefined') {
    let textArea: HTMLTextAreaElement | null = null;
    try {
      textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      if (typeof textArea.setSelectionRange === 'function') {
        textArea.setSelectionRange(0, text.length);
      }

      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch {
        successful = false;
      }

      return Boolean(successful);
    } catch {
      return false;
    } finally {
      if (textArea && textArea.parentNode) {
        textArea.parentNode.removeChild(textArea);
      }
    }
  }

  return false;
}

/**
 * Formats team generator results into a clean, human-readable plain text
 * suitable for chat apps (Viber, WhatsApp) and text editors.
 *
 * @param teams - Array of generated teams
 * @param mode - Generator mode ('tennis' | 'generic')
 * @param format - Tennis format ('singles' | 'doubles')
 * @returns Cleanly formatted string
 */
export function formatTeamsForClipboard(
  teams: Team[],
  mode: GeneratorMode = 'tennis',
  format?: 'singles' | 'doubles'
): string {
  if (!teams || teams.length === 0) {
    return '';
  }

  const isTennis = mode === 'tennis';
  let header = '🎲 Универсални отбори';
  if (isTennis) {
    header = format === 'singles' ? '🎾 Тенис - Поединично' : '🎾 Тенис - По двойки';
  }

  const lines: string[] = [header, ''];

  teams.forEach((team, index) => {
    const teamHasRatings = team.players.some((p) => {
      const r = isTennis
        ? (format === 'singles' ? p.singles_rating : p.doubles_rating) ?? p.rating
        : p.rating;
      return r !== undefined && r !== null;
    });

    const teamHeader =
      teamHasRatings && team.totalRating
        ? `${team.name} (Общ рейтинг: ${team.totalRating}):`
        : `${team.name}:`;

    lines.push(teamHeader);

    team.players.forEach((player) => {
      const r = isTennis
        ? (format === 'singles' ? player.singles_rating : player.doubles_rating) ?? player.rating
        : player.rating;

      if (r !== undefined && r !== null) {
        lines.push(`- ${player.name} (★ ${r})`);
      } else {
        lines.push(`- ${player.name}`);
      }
    });

    if (index < teams.length - 1) {
      lines.push('');
    }
  });

  if (isTennis && teams.length === 2) {
    lines.push('');
    lines.push(`Среща: ${teams[0].name} vs ${teams[1].name}`);
  }

  return lines.join('\n');
}

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GroupList } from '../GroupList';
import type { TournamentGroup } from '../../../types';

describe('GroupList component', () => {
  const dummyGroups: TournamentGroup[] = [
    {
      id: 'group-0',
      name: 'Група А',
      teams: [
        {
          id: 'team-1',
          name: 'Отбор 1',
          players: [{ id: 'p1', name: 'Иван' }],
        },
        {
          id: 'team-2',
          name: 'Отбор 2',
          players: [{ id: 'p2', name: 'Петър' }],
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
          players: [{ id: 'p3', name: 'Георги' }],
        },
      ],
    },
  ];

  it('renders null when groups is empty', () => {
    const { container } = render(<GroupList groups={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders tournament groups heading and group cards', () => {
    render(<GroupList groups={dummyGroups} mode="tennis" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Турнирни групи' })).toBeInTheDocument();
    expect(screen.getByText('Група А')).toBeInTheDocument();
    expect(screen.getByText('Група Б')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
    expect(screen.getByText('Отбор 3')).toBeInTheDocument();
  });

  it('invokes onRedraw / onReDraw when clicking "Нов жребий"', () => {
    const onRedrawMock = vi.fn();
    render(<GroupList groups={dummyGroups} onRedraw={onRedrawMock} />);

    const redrawBtn = screen.getByRole('button', { name: 'Нов жребий' });
    fireEvent.click(redrawBtn);

    expect(onRedrawMock).toHaveBeenCalledTimes(1);
  });

  it('invokes onReset / onClear when clicking "Изчисти жребия"', () => {
    const onResetMock = vi.fn();
    render(<GroupList groups={dummyGroups} onReset={onResetMock} />);

    const resetBtn = screen.getByRole('button', { name: 'Изчисти жребия' });
    fireEvent.click(resetBtn);

    expect(onResetMock).toHaveBeenCalledTimes(1);
  });

  it('invokes custom onCopy handler or copies to clipboard', async () => {
    const onCopyMock = vi.fn();
    render(<GroupList groups={dummyGroups} onCopy={onCopyMock} />);

    const copyBtn = screen.getByRole('button', { name: 'Копирай групите' });
    fireEvent.click(copyBtn);

    expect(onCopyMock).toHaveBeenCalledTimes(1);
  });

  it('handles internal clipboard copy when no onCopy prop is provided', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<GroupList groups={dummyGroups} />);

    const copyBtn = screen.getByRole('button', { name: 'Копирай групите' });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalled();
    expect(screen.getByText('Копирано!')).toBeInTheDocument();
  });

  describe('tournament match schedule integration', () => {
    it('renders "📅 Генерирай програма с мачове" button when onGenerateSchedule is provided and hasSchedule is false', () => {
      const onGenerateScheduleMock = vi.fn();
      render(
        <GroupList
          groups={dummyGroups}
          onGenerateSchedule={onGenerateScheduleMock}
          hasSchedule={false}
        />
      );

      const genBtn = screen.getByRole('button', { name: /генерирай програма с мачове/i });
      expect(genBtn).toBeInTheDocument();

      fireEvent.click(genBtn);
      expect(onGenerateScheduleMock).toHaveBeenCalledTimes(1);
    });

    it('hides "📅 Генерирай програма с мачове" button when hasSchedule is true', () => {
      render(
        <GroupList
          groups={dummyGroups}
          onGenerateSchedule={vi.fn()}
          hasSchedule={true}
        />
      );

      expect(screen.queryByRole('button', { name: /генерирай програма с мачове/i })).not.toBeInTheDocument();
    });
  });
});

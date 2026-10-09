import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSettings } from '../TeamSettings';

describe('TeamSettings', () => {
  describe('Mode selector & Tennis mode (default)', () => {
    it('renders mode toggle with tennis active by default, showing format pills and hiding manual counts', () => {
      render(
        <TeamSettings
          onGenerate={vi.fn()}
        />
      );

      const tennisBtn = screen.getByRole('button', { name: '🎾 Тенис' });
      const genericBtn = screen.getByRole('button', { name: '🎲 Универсален' });
      expect(tennisBtn).toHaveAttribute('aria-pressed', 'true');
      expect(genericBtn).toHaveAttribute('aria-pressed', 'false');

      // Tennis format controls should be visible
      expect(screen.getByRole('button', { name: 'По двойки' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Поединично' })).toBeInTheDocument();

      // Manual count inputs should be hidden in tennis mode
      expect(screen.queryByLabelText(/брой отбори/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/брой играчи в отбор/i)).not.toBeInTheDocument();

      // Generate button is present
      expect(screen.getByRole('button', { name: /разпредели в отбори/i })).toBeInTheDocument();
    });

    it('triggers onModeChange when mode buttons are clicked', () => {
      const handleModeChange = vi.fn();

      render(
        <TeamSettings
          mode="tennis"
          onModeChange={handleModeChange}
          onGenerate={vi.fn()}
        />
      );

      const genericBtn = screen.getByRole('button', { name: '🎲 Универсален' });
      fireEvent.click(genericBtn);
      expect(handleModeChange).toHaveBeenCalledWith('generic');
    });

    it('renders format selector pills with "doubles" active by default and handles toggling', () => {
      const handleFormatChange = vi.fn();

      const { rerender } = render(
        <TeamSettings
          mode="tennis"
          format="doubles"
          onFormatChange={handleFormatChange}
          onGenerate={vi.fn()}
        />
      );

      const doublesBtn = screen.getByRole('button', { name: 'По двойки' });
      const singlesBtn = screen.getByRole('button', { name: 'Поединично' });

      expect(doublesBtn).toHaveAttribute('aria-pressed', 'true');
      expect(singlesBtn).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(singlesBtn);
      expect(handleFormatChange).toHaveBeenCalledWith('singles');

      rerender(
        <TeamSettings
          mode="tennis"
          format="singles"
          onFormatChange={handleFormatChange}
          onGenerate={vi.fn()}
        />
      );

      expect(doublesBtn).toHaveAttribute('aria-pressed', 'false');
      expect(singlesBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders validation warning in tennis mode when validationError is provided', () => {
      render(
        <TeamSettings
          mode="tennis"
          validationError="Добавете още 1 играч за пълни двойки"
          onGenerate={vi.fn()}
        />
      );

      expect(
        screen.getByText('Добавете още 1 играч за пълни двойки')
      ).toBeInTheDocument();
    });
  });

  describe('Generic mode', () => {
    it('renders manual count inputs and hides format pills in generic mode', () => {
      render(
        <TeamSettings
          mode="generic"
          numberOfTeams={2}
          onSettingsChange={vi.fn()}
          onGenerate={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/брой отбори/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/брой играчи в отбор/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'По двойки' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Поединично' })).not.toBeInTheDocument();
    });

    it('triggers onSettingsChange when number of teams input changes', async () => {
      const user = userEvent.setup();
      const handleSettingsChange = vi.fn();

      const Wrapper = () => {
        const [teams, setTeams] = useState(2);
        return (
          <TeamSettings
            mode="generic"
            numberOfTeams={teams}
            onSettingsChange={(val) => {
              setTeams(val);
              handleSettingsChange(val);
            }}
            onGenerate={vi.fn()}
          />
        );
      };

      render(<Wrapper />);

      const teamsInput = screen.getByLabelText(/брой отбори/i);
      await user.clear(teamsInput);
      await user.type(teamsInput, '4');

      expect(handleSettingsChange).toHaveBeenCalledWith(4);
    });

    it('triggers onPlayersPerTeamChange when players per team input changes', async () => {
      const user = userEvent.setup();
      const handlePptChange = vi.fn();

      const Wrapper = () => {
        const [ppt, setPpt] = useState<number | null>(null);
        return (
          <TeamSettings
            mode="generic"
            numberOfTeams={0}
            onSettingsChange={vi.fn()}
            onGenerate={vi.fn()}
            playersPerTeam={ppt}
            onPlayersPerTeamChange={(val) => {
              setPpt(val);
              handlePptChange(val);
            }}
          />
        );
      };

      render(<Wrapper />);

      const pptInput = screen.getByLabelText(/брой играчи в отбор/i);
      await user.type(pptInput, '5');

      expect(handlePptChange).toHaveBeenCalledWith(5);
    });
  });

  describe('Shared features (Ratings & Generation)', () => {
    it('renders balance checkbox when hasRatings is true and handles toggle', async () => {
      const user = userEvent.setup();
      const handleBalanceToggle = vi.fn();
      const { rerender } = render(
        <TeamSettings
          onGenerate={vi.fn()}
          hasRatings={false}
          onBalanceToggle={handleBalanceToggle}
        />
      );

      expect(
        screen.queryByLabelText(/балансирай отборите по рейтинг/i)
      ).not.toBeInTheDocument();

      rerender(
        <TeamSettings
          onGenerate={vi.fn()}
          hasRatings={true}
          balanceByRating={false}
          onBalanceToggle={handleBalanceToggle}
        />
      );

      const checkbox = screen.getByLabelText(/балансирай отборите по рейтинг/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(handleBalanceToggle).toHaveBeenCalledWith(true);
    });

    it('triggers onGenerate when generate button is clicked', async () => {
      const user = userEvent.setup();
      const handleGenerate = vi.fn();
      render(
        <TeamSettings
          onGenerate={handleGenerate}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
      await user.click(generateBtn);

      expect(handleGenerate).toHaveBeenCalledTimes(1);
    });
  });
});

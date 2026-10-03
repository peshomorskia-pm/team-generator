import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSettings } from '../TeamSettings';

describe('TeamSettings', () => {
  it('renders settings inputs and generate button', () => {
    render(
      <TeamSettings
        numberOfTeams={2}
        onSettingsChange={vi.fn()}
        onGenerate={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/брой отбори/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/брой играчи в отбор/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /разпредели в отбори/i })).toBeInTheDocument();
  });

  it('triggers onSettingsChange when number of teams input changes', async () => {
    const user = userEvent.setup();
    const handleSettingsChange = vi.fn();

    const Wrapper = () => {
      const [teams, setTeams] = useState(2);
      return (
        <TeamSettings
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

  it('renders balance checkbox when hasRatings is true and handles toggle', async () => {
    const user = userEvent.setup();
    const handleBalanceToggle = vi.fn();
    const { rerender } = render(
      <TeamSettings
        numberOfTeams={2}
        onSettingsChange={vi.fn()}
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
        numberOfTeams={2}
        onSettingsChange={vi.fn()}
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
        numberOfTeams={2}
        onSettingsChange={vi.fn()}
        onGenerate={handleGenerate}
      />
    );

    const generateBtn = screen.getByRole('button', { name: /разпредели в отбори/i });
    await user.click(generateBtn);

    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  describe('format selector', () => {
    it('renders format selector pills with "singles" active by default and handles toggling', async () => {
      const user = userEvent.setup();
      const handleFormatChange = vi.fn();

      const { rerender } = render(
        <TeamSettings
          numberOfTeams={2}
          onSettingsChange={vi.fn()}
          onGenerate={vi.fn()}
          format="singles"
          onFormatChange={handleFormatChange}
        />
      );

      const singlesBtn = screen.getByRole('button', { name: 'Поединично' });
      const doublesBtn = screen.getByRole('button', { name: 'По двойки' });

      expect(singlesBtn).toBeInTheDocument();
      expect(doublesBtn).toBeInTheDocument();
      expect(singlesBtn).toHaveAttribute('aria-pressed', 'true');
      expect(doublesBtn).toHaveAttribute('aria-pressed', 'false');

      await user.click(doublesBtn);
      expect(handleFormatChange).toHaveBeenCalledWith('doubles');

      rerender(
        <TeamSettings
          numberOfTeams={2}
          onSettingsChange={vi.fn()}
          onGenerate={vi.fn()}
          format="doubles"
          onFormatChange={handleFormatChange}
        />
      );

      expect(singlesBtn).toHaveAttribute('aria-pressed', 'false');
      expect(doublesBtn).toHaveAttribute('aria-pressed', 'true');

      await user.click(singlesBtn);
      expect(handleFormatChange).toHaveBeenCalledWith('singles');
    });
  });
});

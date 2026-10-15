import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScheduleResetModal } from '../ScheduleResetModal';

describe('ScheduleResetModal Component', () => {
  it('renders Bulgarian warning copy and accessible dialog attributes', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ScheduleResetModal
        isOpen={true}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'schedule-reset-modal-title');

    expect(
      screen.getByRole('heading', { name: 'Предупреждение за промяна на групите' })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Внимание: Програмата на мачовете вече е генерирана\. Промяната на отборите в групите ще изисква ново генериране на срещите\. Желаете ли да продължите\?/
      )
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Отказ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Продължи' })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ScheduleResetModal
        isOpen={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('triggers onCancel when clicking "Отказ", clicking backdrop, or pressing Escape', () => {
    const handleCancel = vi.fn();

    const { rerender } = render(
      <ScheduleResetModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    // 1. Click "Отказ"
    fireEvent.click(screen.getByRole('button', { name: 'Отказ' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    // 2. Click backdrop
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
    expect(handleCancel).toHaveBeenCalledTimes(2);

    // 3. Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalledTimes(3);

    // 4. Click close X button
    fireEvent.click(screen.getByRole('button', { name: 'Затвори' }));
    expect(handleCancel).toHaveBeenCalledTimes(4);

    rerender(
      <ScheduleResetModal
        isOpen={false}
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );
  });

  it('triggers onConfirm when clicking "Продължи"', () => {
    const handleConfirm = vi.fn();

    render(
      <ScheduleResetModal
        isOpen={true}
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Продължи' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});

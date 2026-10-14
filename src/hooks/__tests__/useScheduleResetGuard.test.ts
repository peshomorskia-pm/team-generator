import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useScheduleResetGuard } from '../useScheduleResetGuard';

describe('useScheduleResetGuard Hook', () => {
  it('executes action immediately when hasSchedule is false', () => {
    const onResetSchedule = vi.fn();
    const action = vi.fn();

    const { result } = renderHook(() =>
      useScheduleResetGuard({
        hasSchedule: false,
        onResetSchedule,
      })
    );

    const guarded = result.current.guardAction(action);
    act(() => {
      guarded('arg1', 42);
    });

    expect(action).toHaveBeenCalledWith('arg1', 42);
    expect(result.current.isGuardModalOpen).toBe(false);
    expect(onResetSchedule).not.toHaveBeenCalled();
  });

  it('opens modal and pauses action when hasSchedule is true', () => {
    const onResetSchedule = vi.fn();
    const action = vi.fn();

    const { result } = renderHook(() =>
      useScheduleResetGuard({
        hasSchedule: true,
        onResetSchedule,
      })
    );

    const guarded = result.current.guardAction(action);
    act(() => {
      guarded('test-val');
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isGuardModalOpen).toBe(true);

    // Cancel reset
    act(() => {
      result.current.cancelReset();
    });

    expect(result.current.isGuardModalOpen).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(onResetSchedule).not.toHaveBeenCalled();
  });

  it('resets schedule and executes queued action upon confirmation', () => {
    const onResetSchedule = vi.fn();
    const action = vi.fn();

    const { result } = renderHook(() =>
      useScheduleResetGuard({
        hasSchedule: true,
        onResetSchedule,
      })
    );

    const guarded = result.current.guardAction(action);
    act(() => {
      guarded('confirmed-val');
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isGuardModalOpen).toBe(true);

    // Confirm reset
    act(() => {
      result.current.confirmResetAndExecute();
    });

    expect(result.current.isGuardModalOpen).toBe(false);
    expect(onResetSchedule).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith('confirmed-val');
  });
});

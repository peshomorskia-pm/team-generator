import { useState, useCallback, useRef } from 'react';

export interface UseScheduleResetGuardOptions {
  hasSchedule: boolean;
  onResetSchedule: () => void;
}

export interface UseScheduleResetGuardReturn {
  isGuardModalOpen: boolean;
  guardAction: <Args extends unknown[], R>(action: (...args: Args) => R) => (...args: Args) => void;
  confirmResetAndExecute: () => void;
  cancelReset: () => void;
}

export function useScheduleResetGuard({
  hasSchedule,
  onResetSchedule,
}: UseScheduleResetGuardOptions): UseScheduleResetGuardReturn {
  const [isGuardModalOpen, setIsGuardModalOpen] = useState<boolean>(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const guardAction = useCallback(
    <Args extends unknown[], R>(action: (...args: Args) => R) => {
      return (...args: Args): void => {
        if (!hasSchedule) {
          action(...args);
          return;
        }

        // If schedule exists, queue the action and prompt user
        pendingActionRef.current = () => {
          action(...args);
        };
        setIsGuardModalOpen(true);
      };
    },
    [hasSchedule]
  );

  const confirmResetAndExecute = useCallback(() => {
    setIsGuardModalOpen(false);
    onResetSchedule();
    if (pendingActionRef.current) {
      const pending = pendingActionRef.current;
      pendingActionRef.current = null;
      pending();
    }
  }, [onResetSchedule]);

  const cancelReset = useCallback(() => {
    setIsGuardModalOpen(false);
    pendingActionRef.current = null;
  }, []);

  return {
    isGuardModalOpen,
    guardAction,
    confirmResetAndExecute,
    cancelReset,
  };
}

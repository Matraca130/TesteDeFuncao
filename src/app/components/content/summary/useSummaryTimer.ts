import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing the study session timer.
 */
export function useSummaryTimer(initialSeconds = 0) {
  const [sessionElapsed, setSessionElapsed] = useState(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setSessionElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = useCallback((totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const resetTimer = useCallback(() => {
    setSessionElapsed(0);
    setIsTimerRunning(true);
  }, []);

  const toggleTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev);
  }, []);

  return {
    sessionElapsed,
    setSessionElapsed,
    isTimerRunning,
    setIsTimerRunning,
    formatTime,
    resetTimer,
    toggleTimer,
  };
}

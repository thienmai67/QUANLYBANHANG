import { useState, useEffect } from 'react';

/**
 * Custom hook updating every minute (60 seconds) for live 2H countdown calculations.
 * Returns the current Date instance.
 */
export function useNow(intervalMs: number = 60000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update immediately on mount to synchronize
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

export default useNow;

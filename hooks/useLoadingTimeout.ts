import { useState, useEffect } from 'react';

const DEFAULT_TIMEOUT_MS = 15000;

export function useLoadingTimeout(isLoading: boolean, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(t);
  }, [isLoading, timeoutMs]);

  return timedOut;
}

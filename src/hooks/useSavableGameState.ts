
import { useState, useEffect, useCallback } from 'react';

export function useSavableGameState<T>(key: string, initialState: T): [T, (state: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`khans-playhub-game-${key}`);
      return saved ? JSON.parse(saved) : initialState;
    } catch (e) {
      console.error(`Failed to parse saved state for ${key}`, e);
      return initialState;
    }
  });

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prev) 
        : newState;
      localStorage.setItem(`khans-playhub-game-${key}`, JSON.stringify(resolvedState));
      return resolvedState;
    });
  }, [key]);

  const clearState = useCallback(() => {
    setState(initialState);
    localStorage.removeItem(`khans-playhub-game-${key}`);
  }, [key, initialState]);

  return [state, updateState, clearState];
}

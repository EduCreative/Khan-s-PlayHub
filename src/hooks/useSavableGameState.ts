
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

  // Persist state changes in useEffect
  useEffect(() => {
    localStorage.setItem(`khans-playhub-game-${key}`, JSON.stringify(state));
  }, [key, state]);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(newState);
  }, []);

  const clearState = useCallback(() => {
    setState(initialState);
    localStorage.removeItem(`khans-playhub-game-${key}`);
  }, [key, initialState]);

  return [state, updateState, clearState];
}

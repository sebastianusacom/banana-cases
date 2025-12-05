import { create } from 'zustand';

interface CrashGameState {
  hasBet: boolean;
  phase: 'waiting' | 'flying' | 'crashed';
  setGameState: (hasBet: boolean, phase: 'waiting' | 'flying' | 'crashed') => void;
}

export const useCrashGameStore = create<CrashGameState>((set) => ({
  hasBet: false,
  phase: 'waiting',
  setGameState: (hasBet, phase) => set({ hasBet, phase }),
}));




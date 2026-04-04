import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
  slab: string;
  perk: string;
  accomplishments?: string;
  premium: boolean;
}

interface Team {
  id: string;
  name: string;
  isCPU: boolean;
  section: 'A' | 'B';
  purse: number;
  squad: Player[];
  consecutiveRejections: number;
}

interface GameState {
  userId: string | null;
  gameKey: string | null;
  round: number;
  currentSection: 'A' | 'B';
  turnState: 'WAITING_FOR_PICKS' | 'AUCTION_PHASE' | 'COMPLETED';
  teams: Team[];
  
  // Actions
  setUserId: (id: string) => void;
  setGameKey: (key: string) => void;
  updateGameState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  userId: null,
  gameKey: null,
  round: 1,
  currentSection: 'A',
  turnState: 'WAITING_FOR_PICKS',
  teams: [],
  
  setUserId: (id) => set({ userId: id }),
  setGameKey: (key) => set({ gameKey: key }),
  updateGameState: (state) => set((prev) => ({ ...prev, ...state })),
}));

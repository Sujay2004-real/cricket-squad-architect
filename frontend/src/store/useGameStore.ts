import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  slab: string;
  perk: string;
  accomplishments?: string;
  premium: boolean;
  teamId?: string;
  draftPrice?: number;
}

export interface Team {
  id: string;
  name: string;
  isCPU: boolean;
  section: 'A' | 'B';
  purse: number;
  aiDifficulty?: string | null;
}

export interface GameResult {
  teams: Team[];
  draftPool: Player[];
  totalRounds: number;
}

interface GameState {
  userId: string | null;
  gameKey: string | null;
  round: number;
  currentSection: 'A' | 'B';
  turnState: 'WAITING_FOR_PICKS' | 'AUCTION_PHASE' | 'COMPLETED';
  teams: Team[];
  draftPool: Player[];
  isTutorialMode: boolean;
  gameResult: GameResult | null;

  // Actions
  setUserId: (id: string) => void;
  setGameKey: (key: string) => void;
  setTutorialMode: (val: boolean) => void;
  setGameResult: (result: GameResult) => void;
  updateGameState: (state: Partial<GameState>) => void;

  // Derived helper — human player's current purse
  getMyPurse: () => number;
}

export const useGameStore = create<GameState>((set, get) => ({
  userId: null,
  gameKey: null,
  round: 1,
  currentSection: 'A',
  turnState: 'WAITING_FOR_PICKS',
  teams: [],
  draftPool: [],
  isTutorialMode: false,
  gameResult: null,

  setUserId: (id) => set({ userId: id }),
  setGameKey: (key) => set({ gameKey: key }),
  setTutorialMode: (val) => set({ isTutorialMode: val }),
  setGameResult: (result) => set({ gameResult: result }),
  updateGameState: (state) => set((prev) => ({ ...prev, ...state })),

  getMyPurse: () => {
    const { userId, teams } = get();
    return teams.find((t) => t.id === userId)?.purse ?? 100;
  },
}));

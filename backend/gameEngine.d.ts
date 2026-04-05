import { Server } from 'socket.io';
export declare class GameEngine {
    private io;
    constructor(io: Server);
    /**
     * Initializes a game instance into memory and notifies the lobby.
     */
    initializeGame(gameKey: string): Promise<void>;
    /**
     * Triggers the start of a new round and requests selections from teams.
     */
    startRound(gameKey: string): void;
    /**
     * Calculates priority list based off all selections and begins the auction phase.
     */
    processPicks(gameKey: string): void;
    /**
     * Handles live bids during the auction sequence.
     */
    handleBid(gameKey: string, teamId: string, amount: number): void;
}
//# sourceMappingURL=gameEngine.d.ts.map
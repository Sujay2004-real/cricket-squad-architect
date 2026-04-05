import { Server } from 'socket.io';
export declare class GameEngine {
    private io;
    constructor(io: Server);
    initializeGame(gameKey: string): Promise<void>;
    startRound(gameKey: string): void;
    registerPick(gameKey: string, teamId: string, slab: string, number: number): void;
    processPicks(gameKey: string): void;
    private nextAuctionPhase;
    handleAccept(gameKey: string, teamId: string, isForced?: boolean): void;
    handleChallengeBid(gameKey: string, challengerId: string, originalId: string, bidAmount: number): void;
    handleReject(gameKey: string, teamId: string): void;
    private allocatePlayer;
    private endRound;
}
//# sourceMappingURL=gameEngine.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// In-memory state for active games (to avoid constant DB hits for live bidding loops)
const activeGames = {};
class GameEngine {
    io;
    constructor(io) {
        this.io = io;
    }
    /**
     * Initializes a game instance into memory and notifies the lobby.
     */
    async initializeGame(gameKey) {
        const game = await prisma.game.findUnique({
            where: { gameKey },
            include: { teams: true, draftPool: true }
        });
        if (!game)
            return;
        activeGames[gameKey] = {
            currentRound: 1,
            currentSection: 'A',
            teams: game.teams,
            availablePlayers: game.draftPool,
            turnState: 'WAITING_FOR_PICKS'
        };
        this.io.to(gameKey).emit('gameStateUpdate', activeGames[gameKey]);
        this.startRound(gameKey);
    }
    /**
     * Triggers the start of a new round and requests selections from teams.
     */
    startRound(gameKey) {
        const state = activeGames[gameKey];
        if (!state)
            return;
        state.turnState = 'WAITING_FOR_PICKS';
        // Notify players to make their secret selections
        this.io.to(gameKey).emit('requestPicks', {
            round: state.currentRound,
            section: state.currentSection,
            timerMs: 15000 // 15 seconds
        });
        // Timer to auto-process picks if time runs out
        setTimeout(() => {
            this.processPicks(gameKey);
        }, 15000);
    }
    /**
     * Calculates priority list based off all selections and begins the auction phase.
     */
    processPicks(gameKey) {
        const state = activeGames[gameKey];
        if (!state)
            return;
        state.turnState = 'AUCTION_PHASE';
        // In a full implementation, we'd pull picks submitted by clients here
        // and do the Exact Match / Priority math from `index.html`
        this.io.to(gameKey).emit('auctionStarted', {
            message: 'Auction for Player X has started!',
            priorityList: [] // Mock list
        });
    }
    /**
     * Handles live bids during the auction sequence.
     */
    handleBid(gameKey, teamId, amount) {
        const state = activeGames[gameKey];
        if (!state || state.turnState !== 'AUCTION_PHASE')
            return;
        // Verify team has enough purse and update current bid
        this.io.to(gameKey).emit('bidUpdate', {
            teamId,
            amount,
            message: `Team ${teamId} bids $${amount}M`
        });
    }
}
exports.GameEngine = GameEngine;
//# sourceMappingURL=gameEngine.js.map
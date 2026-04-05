import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Memory store for active lobbies
const activeGames: Record<string, GameState> = {};

interface Pick {
    teamId: string;
    slab: string;
    number: number;
}

interface GameState {
    currentRound: number;
    currentSection: string; // 'A' or 'B'
    teams: any[];
    draftPool: any[];
    
    turnState: 'WAITING_FOR_PICKS' | 'AUCTION_DECISION' | 'ROUND_END';
    
    // Pick Collection
    currentPicks: Record<string, Pick>;
    
    // Auction Logic
    rejectionCounters: Record<string, number>;
    auctionDetails?: {
        targetPlayer: any;
        priorityList: string[]; // array of teamIds
        exactMatchWinner: string | null;
        currentPriorityIndex: number;
        currentBid: number;
        latestBidder: string | null;
        forcedPicksTracker: Record<string, boolean>;
    };
}

export class GameEngine {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    public async initializeGame(gameKey: string) {
        const game = await prisma.game.findUnique({
            where: { gameKey },
            include: { teams: true, draftPool: true }
        });

        if (!game) return;

        const rejectionCounters: Record<string, number> = {};
        game.teams.forEach(t => rejectionCounters[t.id] = 0);

        activeGames[gameKey] = {
            currentRound: 1,
            currentSection: 'A',
            teams: game.teams,
            draftPool: game.draftPool,
            turnState: 'WAITING_FOR_PICKS',
            currentPicks: {},
            rejectionCounters
        };

        this.io.to(gameKey).emit('gameStateUpdate', activeGames[gameKey]);
        this.startRound(gameKey);
    }

    public startRound(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state) return;

        state.turnState = 'WAITING_FOR_PICKS';
        state.currentPicks = {};
        
        // Emulate CPU Picks instantly if there are CPU teams in the current section
        state.teams.filter(t => t.isCPU && t.section === state.currentSection).forEach(cpuTeam => {
             // CPU AI (Random Number Strategist)
             const slabs = ['Gold', 'Silver', 'Bronze'];
             const chosenSlab = slabs[Math.floor(Math.random() * slabs.length)];
             const maxNum = state.draftPool.filter(p => p.slab === chosenSlab && !p.teamId).length || 10;
             const chosenNum = crypto.randomInt(1, maxNum + 1);
             
             state.currentPicks[cpuTeam.id] = { teamId: cpuTeam.id, slab: chosenSlab, number: chosenNum };
        });

        this.io.to(gameKey).emit('requestPicks', {
            round: state.currentRound,
            section: state.currentSection,
            timerMs: 15000 
        });
        
        // Auto-process after 15s (grace period)
        setTimeout(() => this.processPicks(gameKey), 16000);
    }

    public registerPick(gameKey: string, teamId: string, slab: string, number: number) {
        const state = activeGames[gameKey];
        if (!state || state.turnState !== 'WAITING_FOR_PICKS') return;
        
        state.currentPicks[teamId] = { teamId, slab, number };
        
        // If all human teams in section have picked, process immediately
        const sectionHumanTeams = state.teams.filter(t => t.section === state.currentSection && !t.isCPU);
        const hasAllPicks = sectionHumanTeams.every(t => state.currentPicks[t.id]);
        
        if (hasAllPicks) {
            this.processPicks(gameKey);
        }
    }

    public processPicks(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state || state.turnState !== 'WAITING_FOR_PICKS') return;
        
        state.turnState = 'AUCTION_DECISION';
        
        const picks = Object.values(state.currentPicks);
        if (picks.length === 0) {
            // No one picked anything. End round.
            return this.endRound(gameKey);
        }

        // Slab Priority: Gold > Silver > Bronze
        const slabOrder = ['Gold', 'Silver', 'Bronze'];
        let highestSlab = 'Bronze';
        
        for (const s of slabOrder) {
            if (picks.some(p => p.slab === s)) {
                highestSlab = s;
                break;
            }
        }

        const validPicks = picks.filter(p => p.slab === highestSlab);
        const slabPlayers = state.draftPool.filter(p => p.slab === highestSlab && !p.teamId);
        
        if (slabPlayers.length === 0) return this.endRound(gameKey);

        // SECURE RANDOM NUMBER GENERATION (PRD 3.2.3)
        const randgen = crypto.randomInt(1, slabPlayers.length + 1);
        const selectedPlayer = slabPlayers[randgen - 1];

        // Exact Match Logic (PRD 3.2.5)
        const exactMatches = validPicks.filter(p => p.number === randgen);
        if (exactMatches.length > 0) {
             // If multiple matched exact, pick randomly among them (or first)
             const winner = exactMatches[0];
             this.allocatePlayer(gameKey, winner.teamId, selectedPlayer.id, 0, "Exact Match");
             return this.endRound(gameKey);
        }

        // Priority List Logic (PRD 3.2.3)
        const sorted = validPicks.sort((a, b) => Math.abs(a.number - randgen) - Math.abs(b.number - randgen));
        const priorityList = sorted.slice(0, 3).map(p => p.teamId);
        
        state.auctionDetails = {
             targetPlayer: selectedPlayer,
             priorityList,
             exactMatchWinner: null,
             currentPriorityIndex: 0,
             currentBid: 0,
             latestBidder: null,
             forcedPicksTracker: {}
        };
        
        this.nextAuctionPhase(gameKey);
    }

    private nextAuctionPhase(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state || !state.auctionDetails) return;

        const ad = state.auctionDetails;
        if (ad.currentPriorityIndex >= ad.priorityList.length) {
             // Everyone passed, end round
             return this.endRound(gameKey);
        }

        const activeTeamId = ad.priorityList[ad.currentPriorityIndex];
        const teamObj = state.teams.find(t => t.id === activeTeamId);
        
        // Forced Pick Injection (PRD 3.2.5)
        if (state.rejectionCounters[activeTeamId] >= 2 && !ad.forcedPicksTracker[activeTeamId]) {
            ad.forcedPicksTracker[activeTeamId] = true;
            this.io.to(gameKey).emit('auctionEvent', `Team ${teamObj?.name} triggered FORCED PICK on consecutive rejections.`);
            this.handleAccept(gameKey, activeTeamId, true); // Forced auto-accept
            return;
        }

        this.io.to(gameKey).emit('requestAction', {
             ...ad,
             activeTeamId,
             instructions: ad.latestBidder ? "Match Challenge Bid or Reject?" : "Accept Player for Free?"
        });

        // Simulating CPU Decisions
        if (teamObj?.isCPU) {
            setTimeout(() => {
                if (!ad.latestBidder) {
                    // Start of phase. CPU chooses.
                    if (Math.random() > 0.5) this.handleAccept(gameKey, activeTeamId);
                    else this.handleReject(gameKey, activeTeamId);
                } else {
                    // CPU matching a bid (rarely happens unless forced)
                    if (Math.random() > 0.7) this.handleAccept(gameKey, activeTeamId);
                    else this.handleReject(gameKey, activeTeamId);
                }
            }, 3000);
        }
    }

    public handleAccept(gameKey: string, teamId: string, isForced = false) {
        const state = activeGames[gameKey];
        if (!state || !state.auctionDetails) return;
        const ad = state.auctionDetails;

        if (ad.priorityList[ad.currentPriorityIndex] !== teamId) return;

        // Reset rejection counter since they accepted a player
        state.rejectionCounters[teamId] = 0;

        if (ad.latestBidder) {
             // Team is matching a challenge bid
             this.allocatePlayer(gameKey, teamId, ad.targetPlayer.id, ad.currentBid, "Matched Bid");
             return this.endRound(gameKey);
        } else {
             // Free Accept phase. Now we must ask next priority teams if they want to challenge!
             const challengers = ad.priorityList.slice(ad.currentPriorityIndex + 1);
             if (challengers.length > 0) {
                 this.io.to(gameKey).emit('requestChallenge', {
                     targetPlayer: ad.targetPlayer,
                     currentOwnerId: teamId,
                     challengerId: challengers[0] // Simplify: only next in line can challenge
                 });
                 // Handle CPU challenger
                 const chalTeam = state.teams.find(t => t.id === challengers[0]);
                 if (chalTeam?.isCPU) {
                     setTimeout(() => {
                         if (Math.random() > 0.6) this.handleChallengeBid(gameKey, challengers[0], teamId, 5);
                         else this.handleReject(gameKey, challengers[0]); // Pass on challenge
                     }, 3000);
                 }
             } else {
                 this.allocatePlayer(gameKey, teamId, ad.targetPlayer.id, 0, isForced ? "Forced Pick" : "Accepted Free");
                 return this.endRound(gameKey);
             }
        }
    }

    public handleChallengeBid(gameKey: string, challengerId: string, originalId: string, bidAmount: number) {
        const state = activeGames[gameKey];
        if (!state || !state.auctionDetails) return;
        const ad = state.auctionDetails;

        // Challenge accepted
        ad.currentBid = bidAmount;
        ad.latestBidder = challengerId;
        
        // Loop back to original team to see if they match
        this.nextAuctionPhase(gameKey); 
    }

    public handleReject(gameKey: string, teamId: string) {
        const state = activeGames[gameKey];
        if (!state || !state.auctionDetails) return;
        const ad = state.auctionDetails;

        if (ad.latestBidder) {
             // Team rejected matching the challenge bid. So the challenger wins.
             this.allocatePlayer(gameKey, ad.latestBidder, ad.targetPlayer.id, ad.currentBid, "Won Challenge");
             return this.endRound(gameKey);
        } else {
             // Free Accept rejected.
             state.rejectionCounters[teamId] += 1;
             ad.currentPriorityIndex++;
             this.nextAuctionPhase(gameKey);
        }
    }

    private allocatePlayer(gameKey: string, teamId: string, playerId: string, price: number, reason: string) {
       this.io.to(gameKey).emit('playerAllocated', { teamId, playerId, price, reason });
       // Note: In reality, we'd update `state.draftPool` and `state.teams` locally, and enqueue a Prisma update.
    }

    private endRound(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state) return;
        
        state.currentRound++;
        state.currentSection = state.currentSection === 'A' ? 'B' : 'A';
        this.startRound(gameKey);
    }
}

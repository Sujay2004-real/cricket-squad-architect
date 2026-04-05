import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const activeGames: Record<string, GameState> = {};

interface Pick {
    teamId: string;
    slab: string;
    number: number;
}

interface GameState {
    currentRound: number;
    currentSection: string;
    teams: any[];
    draftPool: any[];
    slotsPerTeam: number;
    isTutorialMode: boolean;
    turnState: 'WAITING_FOR_PICKS' | 'AUCTION_DECISION' | 'ROUND_END';
    auctionQueue: string[];
    currentPicks: Record<string, Pick>;
    rejectionCounters: Record<string, number>;
    auctionDetails?: {
        targetPlayer: any;
        priorityList: string[];
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

    public hasGame(gameKey: string): boolean {
        return !!activeGames[gameKey];
    }

    public async initializeGame(gameKey: string, isTutorialMode = false) {
        if (activeGames[gameKey]) return; // Idempotent

        const game = await prisma.game.findUnique({
            where: { gameKey },
            include: { teams: true, draftPool: true }
        });
        if (!game) return;

        const rejectionCounters: Record<string, number> = {};
        game.teams.forEach((t: any) => (rejectionCounters[t.id] = 0));

        activeGames[gameKey] = {
            currentRound: 1,
            currentSection: 'A',
            teams: game.teams,
            draftPool: game.draftPool,
            slotsPerTeam: game.slotsPerTeam,
            isTutorialMode,
            turnState: 'WAITING_FOR_PICKS',
            currentPicks: {},
            auctionQueue: [],
            rejectionCounters,
        };

        this.io.to(gameKey).emit('gameStateUpdate', activeGames[gameKey]);
        this.startRound(gameKey);
    }

    public startRound(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state) return;

        state.turnState = 'WAITING_FOR_PICKS';
        state.currentPicks = {};

        // CPU picks for teams in the current section
        state.teams
            .filter((t: any) => t.isCPU && t.section === state.currentSection)
            .forEach((cpuTeam: any) => {
                const pick = this.generateCpuPick(state, cpuTeam);
                if (cpuTeam.id) state.currentPicks[cpuTeam.id] = pick;
            });

        this.io.to(gameKey).emit('requestPicks', {
            round: state.currentRound,
            section: state.currentSection,
            timerMs: 15000,
        });

        const humanTeamsInSection = state.teams.filter(
            (t: any) => !t.isCPU && t.section === state.currentSection
        );
        const totalHumans = state.teams.filter((t: any) => !t.isCPU).length;

        // Timer logic:
        // - Multi-player: always auto-process after 15s
        // - Single-player: always enforce 15s EXCEPT tutorial round 1 (so player can read/learn)
        const isTutorialRound1 = state.isTutorialMode && state.currentRound === 1;
        const shouldAutoProcess =
            totalHumans > 1 || humanTeamsInSection.length === 0 || !isTutorialRound1;

        if (shouldAutoProcess) {
            setTimeout(() => this.processPicks(gameKey), 16000);
        }
    }

    // ── CPU AI: State Machine (Easy / Medium / Hard) ────────────────────────
    private generateCpuPick(state: GameState, cpuTeam: any): Pick {
        const difficulty: string = cpuTeam.aiDifficulty || 'easy';
        const purse: number = cpuTeam.purse ?? 100;
        const available = state.draftPool.filter((p: any) => !p.teamId);

        // Slab selection by difficulty
        let chosenSlab = 'Bronze';
        if (difficulty === 'easy') {
            const slabs = ['Gold', 'Silver', 'Bronze'].filter(s =>
                available.some((p: any) => p.slab === s)
            );
            chosenSlab = slabs[Math.floor(Math.random() * slabs.length)] || 'Bronze';
        } else if (difficulty === 'medium') {
            if (purse > 60 && available.some((p: any) => p.slab === 'Gold')) {
                chosenSlab = Math.random() < 0.6 ? 'Gold' : 'Silver';
            } else if (purse > 30 && available.some((p: any) => p.slab === 'Silver')) {
                chosenSlab = Math.random() < 0.5 ? 'Silver' : 'Bronze';
            } else {
                chosenSlab = 'Bronze';
            }
        } else {
            // Hard: target gold while budget allows, strategically pick silver/bronze
            if (purse > 40 && available.some((p: any) => p.slab === 'Gold')) {
                chosenSlab = 'Gold';
            } else if (purse > 20 && available.some((p: any) => p.slab === 'Silver')) {
                chosenSlab = 'Silver';
            } else {
                chosenSlab = 'Bronze';
            }
        }

        const slabPool = available.filter((p: any) => p.slab === chosenSlab);
        const maxNum = slabPool.length || 10;

        // Number selection by difficulty
        let chosenNum: number;
        if (difficulty === 'hard') {
            // Hard AI clusters near the middle to maximise priority chances
            const mid = Math.ceil(maxNum / 2);
            const offset = crypto.randomInt(0, 4) - 2;
            chosenNum = Math.max(1, Math.min(maxNum, mid + offset));
        } else {
            chosenNum = crypto.randomInt(1, maxNum + 1);
        }

        return { teamId: cpuTeam.id, slab: chosenSlab, number: chosenNum };
    }

    // ── Pick Registration ────────────────────────────────────────────────────
    public registerPick(gameKey: string, teamId: string, slab: string, number: number) {
        const state = activeGames[gameKey];
        if (!state || state.turnState !== 'WAITING_FOR_PICKS') return;

        state.currentPicks[teamId] = { teamId, slab, number };

        const sectionHumans = state.teams.filter(
            (t: any) => t.section === state.currentSection && !t.isCPU
        );
        const allIn = sectionHumans.every((t: any) => state.currentPicks[t.id]);
        if (allIn) this.processPicks(gameKey);
    }

    public processPicks(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state || state.turnState !== 'WAITING_FOR_PICKS') return;

        state.turnState = 'AUCTION_DECISION';
        const picks = Object.values(state.currentPicks);
        if (picks.length === 0) return this.endRound(gameKey);

        const activeSlabs = Array.from(new Set(picks.map(p => p.slab)));
        state.auctionQueue = ['Gold', 'Silver', 'Bronze'].filter(s => activeSlabs.includes(s));
        this.processNextSlab(gameKey);
    }

    // ── Slab-by-Slab Auction ─────────────────────────────────────────────────
    private processNextSlab(gameKey: string): void {
        const state = activeGames[gameKey];
        if (!state) return;

        if (!state.auctionQueue?.length) return this.endRound(gameKey);

        const currentSlab = state.auctionQueue.shift()!;
        const picks = Object.values(state.currentPicks).filter(p => p.slab === currentSlab);
        const slabPlayers = state.draftPool.filter(
            (p: any) => p.slab === currentSlab && !p.teamId
        );
        if (slabPlayers.length === 0) return this.processNextSlab(gameKey);

        // Cryptographically secure random (PRD §3.2.3)
        const randgen = crypto.randomInt(1, slabPlayers.length + 1);
        const selectedPlayer = slabPlayers[randgen - 1];

        // Exact Match rule (PRD §3.2.5)
        const exactMatches = picks.filter(p => p.number === randgen);
        if (exactMatches.length > 0) {
            this.allocatePlayer(gameKey, exactMatches[0]!.teamId, selectedPlayer.id, 0, 'Exact Match');
            return this.processNextSlab(gameKey);
        }

        // Priority list — top 3 closest (PRD §3.2.3)
        const sorted = [...picks].sort(
            (a, b) => Math.abs(a.number - randgen) - Math.abs(b.number - randgen)
        );
        const priorityList = sorted.slice(0, 3).map(p => p.teamId);

        state.auctionDetails = {
            targetPlayer: selectedPlayer,
            priorityList,
            exactMatchWinner: null,
            currentPriorityIndex: 0,
            currentBid: 0,
            latestBidder: null,
            forcedPicksTracker: {},
        };

        this.nextAuctionPhase(gameKey);
    }

    private nextAuctionPhase(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state?.auctionDetails) return;
        const ad = state.auctionDetails;

        if (ad.currentPriorityIndex >= ad.priorityList.length) {
            return this.processNextSlab(gameKey);
        }

        const activeTeamId = ad.priorityList[ad.currentPriorityIndex];
        if (!activeTeamId) return this.processNextSlab(gameKey);

        const teamObj = state.teams.find((t: any) => t.id === activeTeamId);
        const rejections = state.rejectionCounters[activeTeamId] || 0;

        // Forced Pick — ONLY on free-acceptance step, never during bid matching (PRD §3.2.5)
        if (rejections >= 2 && !ad.forcedPicksTracker[activeTeamId] && !ad.latestBidder) {
            ad.forcedPicksTracker[activeTeamId] = true;
            state.rejectionCounters[activeTeamId] = 0;
            this.io.to(gameKey).emit(
                'auctionEvent',
                `⚡ FORCED PICK: ${teamObj?.name} must take the player!`
            );
            // Allocate directly — NO challenge phase per PRD §3.2.5
            this.allocatePlayer(gameKey, activeTeamId, ad.targetPlayer.id, 0, 'Forced Pick');
            return this.processNextSlab(gameKey);
        }

        this.io.to(gameKey).emit('requestAction', {
            ...ad,
            activeTeamId,
            instructions: ad.latestBidder
                ? `Match the $${ad.currentBid}M challenge bid or Reject?`
                : 'Accept player for free?',
        });

        if (teamObj?.isCPU) {
            const delay = 2000 + Math.random() * 1500;
            setTimeout(() => this.makeCpuAuctionDecision(gameKey, activeTeamId, teamObj), delay);
        }
    }

    // ── CPU Auction Decision (State Machine) ─────────────────────────────────
    private makeCpuAuctionDecision(gameKey: string, teamId: string, teamObj: any) {
        const state = activeGames[gameKey];
        if (!state?.auctionDetails) return;
        const ad = state.auctionDetails;
        const difficulty: string = teamObj.aiDifficulty || 'easy';
        const purse: number = teamObj.purse ?? 100;
        const slab: string = ad.targetPlayer?.slab || 'Bronze';

        if (ad.latestBidder) {
            // Matching an existing bid
            const match =
                difficulty === 'hard'
                    ? slab === 'Gold' && purse > ad.currentBid * 1.5
                    : difficulty === 'medium'
                    ? purse > ad.currentBid * 2 && Math.random() > 0.4
                    : Math.random() > 0.5;
            match ? this.handleAccept(gameKey, teamId) : this.handleReject(gameKey, teamId);
        } else {
            // Free acceptance
            const accept =
                difficulty === 'hard'
                    ? slab === 'Gold' || Math.random() > 0.15
                    : difficulty === 'medium'
                    ? slab === 'Gold'
                        ? Math.random() > 0.2
                        : Math.random() > 0.4
                    : Math.random() > 0.5;
            accept ? this.handleAccept(gameKey, teamId) : this.handleReject(gameKey, teamId);
        }
    }

    // ── Accept ───────────────────────────────────────────────────────────────
    public handleAccept(gameKey: string, teamId: string) {
        const state = activeGames[gameKey];
        if (!state?.auctionDetails) return;
        const ad = state.auctionDetails;
        if (ad.priorityList[ad.currentPriorityIndex] !== teamId) return;

        state.rejectionCounters[teamId] = 0;

        if (ad.latestBidder) {
            // Team matches the challenge bid — pays current bid amount
            this.allocatePlayer(gameKey, teamId, ad.targetPlayer.id, ad.currentBid, 'Matched Bid');
            return this.processNextSlab(gameKey);
        }

        // Free accept: ask next priority team if they want to challenge
        const challengerId = ad.priorityList[ad.currentPriorityIndex + 1] ?? null;
        if (challengerId) {
            this.io.to(gameKey).emit('requestChallenge', {
                targetPlayer: ad.targetPlayer,
                currentOwnerId: teamId,
                challengerId,
            });
            const challenger = state.teams.find((t: any) => t.id === challengerId);
            if (challenger?.isCPU) {
                setTimeout(
                    () => this.makeCpuChallengeDecision(gameKey, challengerId, challenger, teamId),
                    2000 + Math.random() * 1500
                );
            }
        } else {
            this.allocatePlayer(gameKey, teamId, ad.targetPlayer.id, 0, 'Accepted Free');
            return this.processNextSlab(gameKey);
        }
    }

    // ── CPU Challenge Decision ───────────────────────────────────────────────
    private makeCpuChallengeDecision(
        gameKey: string,
        challengerId: string,
        chalTeam: any,
        currentOwnerId: string
    ) {
        const state = activeGames[gameKey];
        if (!state?.auctionDetails) return;
        const ad = state.auctionDetails;
        const difficulty: string = chalTeam.aiDifficulty || 'easy';
        const purse: number = chalTeam.purse ?? 100;
        const slab: string = ad.targetPlayer?.slab || 'Bronze';

        const shouldChallenge =
            difficulty === 'hard'
                ? (slab === 'Gold' && purse > 15 && Math.random() > 0.2) ||
                  (slab === 'Silver' && purse > 10 && Math.random() > 0.5)
                : difficulty === 'medium'
                ? slab === 'Gold' && purse > 10 && Math.random() > 0.4
                : false; // Easy AI never challenges

        if (shouldChallenge) {
            const max = difficulty === 'hard' ? 30 : 15;
            const bid = Math.min(purse - 5, 5 + Math.floor(Math.random() * max));
            if (bid > 0) this.handleChallengeBid(gameKey, challengerId, currentOwnerId, bid);
            else this.handleReject(gameKey, challengerId);
        } else {
            this.handleReject(gameKey, challengerId);
        }
    }

    // ── Challenge Bid ────────────────────────────────────────────────────────
    public handleChallengeBid(
        gameKey: string,
        challengerId: string,
        _originalId: string,
        bidAmount: number
    ) {
        const state = activeGames[gameKey];
        if (!state?.auctionDetails) return;
        state.auctionDetails.currentBid = bidAmount;
        state.auctionDetails.latestBidder = challengerId;
        this.nextAuctionPhase(gameKey);
    }

    // ── Reject ───────────────────────────────────────────────────────────────
    public handleReject(gameKey: string, teamId: string) {
        const state = activeGames[gameKey];
        if (!state?.auctionDetails) return;
        const ad = state.auctionDetails;

        if (ad.latestBidder) {
            // Rejected matching bid → challenger wins, pays their bid (PRD §3.2.4)
            this.allocatePlayer(
                gameKey,
                ad.latestBidder,
                ad.targetPlayer.id,
                ad.currentBid,
                'Won Challenge'
            );
            return this.processNextSlab(gameKey);
        }

        // Rejected free offer → increment rejection counter, move to next priority team
        state.rejectionCounters[teamId] = (state.rejectionCounters[teamId] || 0) + 1;
        ad.currentPriorityIndex++;
        this.nextAuctionPhase(gameKey);
    }

    // ── Allocate Player (with purse deduction) ──────────────────────────────
    private allocatePlayer(
        gameKey: string,
        teamId: string,
        playerId: string,
        price: number,
        reason: string
    ) {
        const state = activeGames[gameKey];
        if (state) {
            const pi = state.draftPool.findIndex((p: any) => p.id === playerId);
            if (pi !== -1) {
                state.draftPool[pi].teamId = teamId;
                state.draftPool[pi].draftPrice = price;
            }
            // Deduct bid price from winning team's purse (PRD §3.2.4 / §3.2.5)
            if (price > 0) {
                const ti = state.teams.findIndex((t: any) => t.id === teamId);
                if (ti !== -1) {
                    state.teams[ti].purse = Math.max(
                        0,
                        (state.teams[ti].purse ?? 100) - price
                    );
                }
            }
        }
        this.io.to(gameKey).emit('playerAllocated', { teamId, playerId, price, reason });
        if (state) this.io.to(gameKey).emit('gameStateUpdate', state);
    }

    // ── End Round / Game Termination ─────────────────────────────────────────
    private endRound(gameKey: string) {
        const state = activeGames[gameKey];
        if (!state) return;

        const allocated = state.draftPool.filter((p: any) => p.teamId).length;
        const totalRequired = state.slotsPerTeam * state.teams.length;
        const remaining = state.draftPool.filter((p: any) => !p.teamId).length;

        // Game over when all slots filled OR pool exhausted (PRD §3.2.2)
        if (allocated >= totalRequired || remaining === 0) {
            state.turnState = 'ROUND_END';
            this.io.to(gameKey).emit('gameOver', {
                teams: state.teams,
                draftPool: state.draftPool,
                totalRounds: state.currentRound,
            });
            delete activeGames[gameKey];
            return;
        }

        state.currentRound++;
        state.currentSection = state.currentSection === 'A' ? 'B' : 'A';
        this.startRound(gameKey);
    }
}

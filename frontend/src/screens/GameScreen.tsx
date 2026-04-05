import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../services/socket';
import { useTutorial } from '../store/useTutorial';
import TutorialOverlay from '../components/TutorialOverlay';

const PICK_TIMER_SECONDS = 15;

export default function GameScreen() {
    const { gameKey } = useParams();
    const navigate = useNavigate();
    const {
        round, currentSection, updateGameState, userId,
        isTutorialMode, setTutorialMode, draftPool, getMyPurse, setGameResult,
    } = useGameStore();

    const {
        isActive: isTutorialActive, step: tutorialStep,
        startTutorial, advanceStep, setStep, skipTutorial,
        neverShowAgain, setNeverShowAgain,
    } = useTutorial();

    const [selectedSlab, setSelectedSlab] = useState('Gold');
    const [selectedNumber, setSelectedNumber] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [auctionRequest, setAuctionRequest] = useState<any>(null);
    const [challengeRequest, setChallengeRequest] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);

    // Countdown timer
    const [pickSecondsLeft, setPickSecondsLeft] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Tutorial spotlight refs
    const draftPoolRef      = useRef<HTMLDivElement>(null);
    const slabSelectorRef   = useRef<HTMLDivElement>(null);
    const numberInputRef    = useRef<HTMLDivElement>(null);
    const transmitRef       = useRef<HTMLDivElement>(null);
    const auctionPanelRef   = useRef<HTMLDivElement>(null);
    const challengePanelRef = useRef<HTMLDivElement>(null);

    const defaultMyTeamId = userId || 'team-1';
    const myPurse = getMyPurse();

    // Show timer only when tutorial is not active OR step >= 4 (Transmit step)
    const timerVisible = !isTutorialActive || tutorialStep >= 4;

    const clearPickTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setPickSecondsLeft(null);
    }, []);

    const startPickTimer = useCallback(() => {
        if (!timerVisible) return;
        clearPickTimer();
        setPickSecondsLeft(PICK_TIMER_SECONDS);
        timerRef.current = setInterval(() => {
            setPickSecondsLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearPickTimer();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    }, [timerVisible, clearPickTimer]);

    // Boot tutorial on mount
    useEffect(() => {
        if (isTutorialMode && !neverShowAgain) startTutorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Socket setup
    useEffect(() => {
        if (gameKey) {
            socket.emit('joinLobby', { gameKey, isTutorialMode });
            setLogs(prev => [`[System] Connected to Draft Server: ${gameKey}`, ...prev]);
        }

        socket.on('requestPicks', () => startPickTimer());

        socket.on('gameStateUpdate', (state) => {
            updateGameState(state);
            if (state.turnState === 'WAITING_FOR_PICKS') {
                setAuctionRequest(null);
                setChallengeRequest(null);
            }
        });

        socket.on('requestAction', (data) => {
            if (data.activeTeamId === defaultMyTeamId) {
                clearPickTimer();
                setAuctionRequest(data);
            } else {
                setLogs(prev => [`[Auction] Waiting for ${data.activeTeamId} to respond...`, ...prev]);
            }
        });

        socket.on('requestChallenge', (data) => {
            if (data.challengerId === defaultMyTeamId) setChallengeRequest(data);
        });

        socket.on('playerAllocated', (data) => {
            setLogs(prev => [
                `[Transfer] ${data.teamId === defaultMyTeamId ? '✅ You' : `Team ${data.teamId}`} acquired a player for $${data.price}M via ${data.reason}`,
                ...prev,
            ]);
            setAuctionRequest(null);
            setChallengeRequest(null);
        });

        socket.on('auctionEvent', (msg: string) => {
            setLogs(prev => [`[⚡ Engine] ${msg}`, ...prev]);
        });

        socket.on('gameOver', (data) => {
            clearPickTimer();
            setGameResult(data);
            navigate(`/results/${gameKey}`);
        });

        return () => {
            socket.off('requestPicks');
            socket.off('gameStateUpdate');
            socket.off('requestAction');
            socket.off('requestChallenge');
            socket.off('playerAllocated');
            socket.off('auctionEvent');
            socket.off('gameOver');
            clearPickTimer();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameKey, defaultMyTeamId]);

    // Tutorial: advance to Auction step when auctionRequest arrives
    useEffect(() => {
        if (isTutorialActive && auctionRequest && tutorialStep < 5) setStep(5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionRequest]);

    // Tutorial: advance to Challenge step when challengeRequest arrives
    useEffect(() => {
        if (isTutorialActive && challengeRequest && tutorialStep < 6) setStep(6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [challengeRequest]);

    // Map tutorial step → spotlight ref
    const getTutorialRef = (s: number): React.RefObject<HTMLElement | null> | undefined => {
        const map: Record<number, React.RefObject<HTMLElement | null>> = {
            1: draftPoolRef as React.RefObject<HTMLElement | null>,
            2: slabSelectorRef as React.RefObject<HTMLElement | null>,
            3: numberInputRef as React.RefObject<HTMLElement | null>,
            4: transmitRef as React.RefObject<HTMLElement | null>,
            5: auctionPanelRef as React.RefObject<HTMLElement | null>,
            6: challengePanelRef as React.RefObject<HTMLElement | null>,
        };
        return map[s];
    };

    // Game handlers
    const submitPick = () => {
        socket.emit('submitPick', { gameKey, teamId: defaultMyTeamId, slab: selectedSlab, number: Number(selectedNumber) });
        setLogs(prev => [`[You] Pick transmitted: ${selectedSlab} #${selectedNumber}`, ...prev]);
        clearPickTimer();
        if (isTutorialActive && tutorialStep === 4) advanceStep();
    };

    const handleAccept = () => {
        socket.emit('actionAccept', { gameKey, teamId: defaultMyTeamId });
        setAuctionRequest(null);
        if (isTutorialActive && tutorialStep === 5) setStep(7);
    };

    const handleReject = () => {
        socket.emit('actionReject', { gameKey, teamId: defaultMyTeamId });
        setAuctionRequest(null);
        setChallengeRequest(null);
        if (isTutorialActive && (tutorialStep === 5 || tutorialStep === 6)) setStep(7);
    };

    const handleSendChallenge = () => {
        socket.emit('actionChallenge', { gameKey, teamId: defaultMyTeamId, originalId: challengeRequest.currentOwnerId, bidAmount });
        setChallengeRequest(null);
        setLogs(prev => [`[You] Challenge bid of $${bidAmount}M placed!`, ...prev]);
        if (isTutorialActive && tutorialStep === 6) setStep(7);
    };

    const handleSkipTutorial = () => { skipTutorial(); setTutorialMode(false); };
    const handleFinishTutorial = () => { skipTutorial(); setTutorialMode(false); };

    // Timer color
    const timerColor = pickSecondsLeft !== null
        ? pickSecondsLeft > 10 ? 'text-emerald-400' : pickSecondsLeft > 5 ? 'text-amber-400' : 'text-red-400'
        : 'text-emerald-400';

    return (
        <div className="flex flex-col h-screen fade-in">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-700/80 p-4 flex justify-between items-center shadow-lg z-10 sticky top-0">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 uppercase tracking-widest px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        Round {round}
                    </h2>
                </div>

                <div className="flex-1 flex justify-center items-center gap-6">
                    <div className="glass-panel px-8 py-2 rounded-full border border-blue-500/30 flex items-center gap-4 bg-slate-900/80">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        <p className="text-xl font-bold text-white uppercase tracking-widest">
                            <span className="text-blue-400 mr-2">Section {currentSection}</span> Live
                        </p>
                    </div>
                    {/* Countdown Timer */}
                    {timerVisible && pickSecondsLeft !== null && (
                        <div className={`flex items-center gap-2 font-mono font-black text-2xl ${timerColor} bg-slate-900/80 px-4 py-1 rounded-xl border border-slate-700`}>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pick in</span>
                            <span>{pickSecondsLeft}s</span>
                        </div>
                    )}
                </div>

                <div className="text-right glass-panel px-6 py-2 rounded-xl flex items-center gap-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Purse</h3>
                    <p className="text-green-400 font-mono text-2xl font-black">${myPurse}M</p>
                </div>
            </header>

            {/* Main Draft Area */}
            <main className="flex flex-col lg:flex-row p-6 gap-6 flex-grow overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">

                {/* Left: Draft Pool */}
                <div ref={draftPoolRef} className="w-full lg:w-1/4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[85vh]">
                    {(['Gold', 'Silver', 'Bronze'] as const).map(slab => {
                        const borderColor = slab === 'Gold' ? 'border-amber-500/50' : slab === 'Silver' ? 'border-slate-400/50' : 'border-orange-700/50';
                        const titleColor = slab === 'Gold' ? 'text-amber-400' : slab === 'Silver' ? 'text-slate-300' : 'text-orange-500';
                        const icon = slab === 'Gold' ? '🥇' : slab === 'Silver' ? '🥈' : '🥉';
                        return (
                            <div key={slab} className={`p-5 rounded-xl border bg-slate-900/80 ${borderColor}`}>
                                <h3 className={`text-lg font-black ${titleColor} mb-3 border-b border-slate-700/30 pb-2 uppercase tracking-widest sticky top-0 bg-slate-900 z-10`}>{icon} {slab} Tier</h3>
                                <div className="space-y-2 flex flex-col">
                                    {draftPool.filter(p => p.slab === slab).map((p: any) => (
                                        <div key={p.id} className={`flex justify-between items-center p-2 rounded border transition-colors ${p.teamId ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800/80 border-slate-600'}`}>
                                            <span className={`font-medium text-sm ${p.teamId ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                {p.premium && !p.teamId && <span className="text-amber-400 mr-1">⭐</span>}
                                                {p.name}
                                            </span>
                                            {p.teamId && <span className="text-xs text-red-500 font-bold uppercase">Sold</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Center: Mission Control */}
                <div className="w-full lg:w-2/4 flex flex-col gap-6">
                    <div className="glass-card flex-grow relative p-8 flex flex-col justify-center">
                        <div className="relative w-full max-w-md mx-auto">
                            <h3 className="text-2xl font-black text-center text-white mb-8 uppercase tracking-widest glow-text">Mission Control</h3>

                            {/* Standard Pick Mode */}
                            {!auctionRequest && !challengeRequest && (
                                <>
                                    {/* Timer bar */}
                                    {timerVisible && pickSecondsLeft !== null && (
                                        <div className="w-full bg-slate-950 rounded-full h-2 mb-6 border border-slate-700 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${(pickSecondsLeft / PICK_TIMER_SECONDS) * 100}%`,
                                                    background: pickSecondsLeft > 10 ? '#34d399' : pickSecondsLeft > 5 ? '#fbbf24' : '#ef4444',
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        {/* Slab selector */}
                                        <div ref={slabSelectorRef} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 transition-all">
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Priority Slab</label>
                                            <select
                                                className="w-full bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
                                                value={selectedSlab}
                                                onChange={(e) => {
                                                    setSelectedSlab(e.target.value);
                                                    if (isTutorialActive && tutorialStep === 2) advanceStep();
                                                }}
                                            >
                                                <option value="Gold" className="bg-slate-800">🥇 Gold</option>
                                                <option value="Silver" className="bg-slate-800">🥈 Silver</option>
                                                <option value="Bronze" className="bg-slate-800">🥉 Bronze</option>
                                            </select>
                                        </div>

                                        {/* Number input */}
                                        <div ref={numberInputRef} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 transition-all">
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Secret Number (1–20)</label>
                                            <input
                                                type="number" min="1" max="20"
                                                className="w-full bg-transparent text-white font-mono font-bold text-xl outline-none"
                                                value={selectedNumber}
                                                onChange={(e) => {
                                                    setSelectedNumber(e.target.value);
                                                    if (isTutorialActive && tutorialStep === 3 && e.target.value.length > 0) advanceStep();
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Transmit */}
                                    <div ref={transmitRef}>
                                        <button
                                            onClick={submitPick}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all uppercase tracking-widest text-xl"
                                        >
                                            Transmit Pick
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Auction Panel */}
                            {auctionRequest && (
                                <div ref={auctionPanelRef} className="bg-slate-900/90 border border-blue-500/50 p-6 rounded-2xl shadow-2xl pulse-border slide-up text-center">
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded inline-block mb-3 uppercase tracking-widest animate-pulse">Action Required</span>

                                    {/* Player Card */}
                                    {auctionRequest.targetPlayer && (
                                        <div className="bg-slate-950/60 rounded-xl p-4 mb-4 border border-slate-700/50 text-left">
                                            <div className="flex items-center gap-2 mb-1">
                                                {auctionRequest.targetPlayer.premium && (
                                                    <span className="bg-amber-500/20 text-amber-400 text-xs font-black px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-wider">⭐ Premium</span>
                                                )}
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                    {auctionRequest.targetPlayer.slab} Slab
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-white">{auctionRequest.targetPlayer.name}</h4>
                                            {auctionRequest.targetPlayer.accomplishments && (
                                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{auctionRequest.targetPlayer.accomplishments}</p>
                                            )}
                                            <p className="text-blue-300 text-xs mt-2 font-medium">🎯 {auctionRequest.targetPlayer.perk}</p>
                                        </div>
                                    )}

                                    <p className="text-slate-400 mb-4 text-sm font-medium">{auctionRequest.instructions}</p>

                                    {auctionRequest.currentBid > 0 && (
                                        <div className="bg-slate-950 p-3 rounded-xl mb-4 border border-red-500/30">
                                            <p className="text-slate-400 text-xs">Challenger Bid</p>
                                            <p className="text-red-400 font-mono text-3xl font-black">${auctionRequest.currentBid}M</p>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button onClick={handleReject} className="flex-1 bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500 text-slate-300 font-bold py-3 rounded-lg transition-all">Reject</button>
                                        <button onClick={handleAccept} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                                            {auctionRequest.currentBid > 0 ? 'Match Bid' : 'Accept (Free)'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Challenge Panel */}
                            {challengeRequest && (
                                <div ref={challengePanelRef} className="bg-slate-900/90 border border-emerald-500/50 p-6 rounded-2xl shadow-2xl pulse-bg slide-up text-center">
                                    <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded inline-block mb-3 uppercase tracking-widest">Challenge Phase</span>
                                    {challengeRequest.targetPlayer && (
                                        <p className="text-white font-bold mb-1">{challengeRequest.targetPlayer.name}</p>
                                    )}
                                    <h4 className="text-slate-300 text-sm mb-4">An opponent accepted this player. Place a challenge bid?</h4>

                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="text-emerald-400 text-2xl font-bold">$</span>
                                        <input
                                            type="number" value={bidAmount}
                                            onChange={(e) => setBidAmount(Number(e.target.value))}
                                            className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-xl text-center focus:border-emerald-500 focus:outline-none"
                                        />
                                        <span className="text-emerald-400 text-2xl font-bold">M</span>
                                    </div>
                                    <p className="text-slate-500 text-xs mb-4">Your purse: ${myPurse}M remaining</p>

                                    <div className="flex gap-4">
                                        <button onClick={handleReject} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-all">Pass</button>
                                        <button onClick={handleSendChallenge} disabled={bidAmount <= 0 || bidAmount > myPurse}
                                            className="flex-1 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all"
                                        >
                                            Submit Bid
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Terminal */}
                <div className="w-full lg:w-1/4 glass-panel rounded-xl flex flex-col p-0 overflow-hidden border-t-4 border-t-indigo-500">
                    <div className="bg-slate-900 px-5 py-3 border-b border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Server Terminal</h3>
                    </div>
                    <div className="flex-grow p-5 overflow-y-auto space-y-3 font-mono text-xs">
                        {logs.map((log, i) => (
                            <div key={i} className={`p-2 rounded ${log.includes('You') || log.includes('✅') ? 'bg-blue-900/30 text-blue-300 border-l-2 border-blue-500' : log.includes('⚡') ? 'bg-red-900/20 text-red-300 border-l-2 border-red-500' : 'text-slate-400 border-l-2 border-slate-700/50'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Tutorial Overlay */}
            <TutorialOverlay
                step={tutorialStep}
                isActive={isTutorialActive}
                targetRef={getTutorialRef(tutorialStep)}
                onNext={advanceStep}
                onSkip={handleSkipTutorial}
                onFinish={handleFinishTutorial}
                neverShowAgain={neverShowAgain}
                onNeverShowAgainChange={setNeverShowAgain}
            />
        </div>
    );
}

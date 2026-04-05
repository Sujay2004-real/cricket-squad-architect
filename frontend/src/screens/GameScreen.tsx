import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../services/socket';

export default function GameScreen() {
    const { gameKey } = useParams();
    const navigate = useNavigate();
    const { round, currentSection, updateGameState, userId, isTutorialMode, draftPool } = useGameStore();

    const [selectedSlab, setSelectedSlab] = useState('Gold');
    const [selectedNumber, setSelectedNumber] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    
    // Custom PRD States
    const [auctionRequest, setAuctionRequest] = useState<any>(null);
    const [challengeRequest, setChallengeRequest] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);

    // Provide a default team ID since the user might not have one hardcoded locally in this mockup
    const defaultMyTeamId = userId || 'team-1';

    useEffect(() => {
        if (gameKey) {
            socket.emit('joinLobby', gameKey);
            setLogs(prev => [`[System] Secure connection established to Draft Server: ${gameKey}`, ...prev]);
        }

        socket.on('gameStateUpdate', (state) => {
             updateGameState(state);
             if (state.turnState === 'WAITING_FOR_PICKS') {
                 setAuctionRequest(null);
                 setChallengeRequest(null);
             }
        });
        
        socket.on('requestAction', (data) => {
             // Example data: { activeTeamId, instructions, targetPlayer, currentBid }
             if (data.activeTeamId === defaultMyTeamId) {
                 setAuctionRequest(data);
             } else {
                 setLogs(prev => [`[Auction] Waiting for Team ${data.activeTeamId} to respond...`, ...prev]);
             }
        });

        socket.on('requestChallenge', (data) => {
             // Example data: { targetPlayer, challengerId, currentOwnerId }
             if (data.challengerId === defaultMyTeamId) {
                 setChallengeRequest(data);
             }
        });

        socket.on('playerAllocated', (data) => {
            setLogs(prev => [`[Transfer] Team ${data.teamId} acquired Player ID ${data.playerId} for $${data.price}M via ${data.reason}`, ...prev]);
             setAuctionRequest(null);
             setChallengeRequest(null);
        });

        return () => {
             socket.off('gameStateUpdate');
             socket.off('requestAction');
             socket.off('requestChallenge');
             socket.off('playerAllocated');
        };
    }, [gameKey, updateGameState, defaultMyTeamId]);

    const submitPick = () => {
        socket.emit('submitPick', { gameKey, teamId: defaultMyTeamId, slab: selectedSlab, number: Number(selectedNumber) });
        setLogs(prev => [`[You] Pick transmitted: ${selectedSlab} #${selectedNumber}`, ...prev]);
    };

    const handleAccept = () => {
        socket.emit('actionAccept', { gameKey, teamId: defaultMyTeamId });
        setAuctionRequest(null);
    };

    const handleReject = () => {
        socket.emit('actionReject', { gameKey, teamId: defaultMyTeamId });
        setAuctionRequest(null);
        setChallengeRequest(null);
    };

    const handleSendChallenge = () => {
        socket.emit('actionChallenge', { gameKey, teamId: defaultMyTeamId, originalId: challengeRequest.currentOwnerId, bidAmount });
        setChallengeRequest(null);
        setLogs(prev => [`[You] Placed a challenge bid of $${bidAmount}M!`, ...prev]);
    };

    return (
        <div className="flex flex-col h-screen fade-in">
            {/* Top Dashboard Header */}
            <header className="bg-slate-900 border-b border-slate-700/80 p-4 flex justify-between items-center shadow-lg z-10 sticky top-0">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 uppercase tracking-widest px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        Round {round}
                    </h2>
                </div>
                
                <div className="flex-1 flex justify-center">
                    <div className="glass-panel px-8 py-2 rounded-full border border-blue-500/30 flex items-center gap-4 bg-slate-900/80">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        <p className="text-xl font-bold text-white uppercase tracking-widest">
                            <span className="text-blue-400 mr-2">Section {currentSection}</span> Live
                        </p>
                    </div>
                </div>

                <div className="text-right glass-panel px-6 py-2 rounded-xl flex items-center gap-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Purse</h3>
                    <p className="text-green-400 font-mono text-2xl font-black">$100M</p>
                </div>
            </header>

            {/* Main Draft Area */}
            <main className="flex flex-col lg:flex-row p-6 gap-6 flex-grow overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                
                {/* Left Drawer (Draft Pool) */}
                <div className="w-full lg:w-1/4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[85vh]">
                    <div className="p-5 rounded-xl border bg-slate-900/80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <h3 className="text-lg font-black text-amber-400 mb-3 border-b border-amber-500/30 pb-2 uppercase tracking-widest sticky top-0 bg-slate-900 z-10">🥇 Gold Tier</h3>
                        <div className="space-y-2 flex flex-col">
                            {draftPool.filter(p => p.slab === 'Gold').map((p: any) => (
                                <div key={p.id} className={`flex justify-between items-center p-2 rounded border transition-colors ${p.teamId ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800/80 border-slate-600 hover:border-amber-500/50'}`}>
                                    <span className={`font-medium ${p.teamId ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{p.name}</span>
                                    {p.teamId && <span className="text-xs text-red-500 font-bold uppercase">Sold</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 rounded-xl border bg-slate-900/80 border-slate-400/50 shadow-[0_0_15px_rgba(148,163,184,0.15)]">
                        <h3 className="text-lg font-black text-slate-300 mb-3 border-b border-slate-400/30 pb-2 uppercase tracking-widest sticky top-0 bg-slate-900 z-10">🥈 Silver Tier</h3>
                        <div className="space-y-2 flex flex-col">
                            {draftPool.filter(p => p.slab === 'Silver').map((p: any) => (
                                <div key={p.id} className={`flex justify-between items-center p-2 rounded border transition-colors ${p.teamId ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800/80 border-slate-600 hover:border-slate-400/50'}`}>
                                    <span className={`font-medium ${p.teamId ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{p.name}</span>
                                    {p.teamId && <span className="text-xs text-red-500 font-bold uppercase">Sold</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 rounded-xl border bg-slate-900/80 border-orange-700/50 shadow-[0_0_15px_rgba(194,65,12,0.15)]">
                        <h3 className="text-lg font-black text-orange-500 mb-3 border-b border-orange-700/30 pb-2 uppercase tracking-widest sticky top-0 bg-slate-900 z-10">🥉 Bronze Tier</h3>
                        <div className="space-y-2 flex flex-col">
                            {draftPool.filter(p => p.slab === 'Bronze').map((p: any) => (
                                <div key={p.id} className={`flex justify-between items-center p-2 rounded border transition-colors ${p.teamId ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800/80 border-slate-600 hover:border-orange-700/50'}`}>
                                    <span className={`font-medium ${p.teamId ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{p.name}</span>
                                    {p.teamId && <span className="text-xs text-red-500 font-bold uppercase">Sold</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Console (Action & Timer) */}
                <div className="w-full lg:w-2/4 flex flex-col gap-6">
                    <div className="glass-card flex-grow relative overflow-hidden p-8 flex flex-col justify-center">
                        <div className="relative z-10 w-full max-w-md mx-auto">
                            <h3 className="text-2xl font-black text-center text-white mb-8 uppercase tracking-widest glow-text">Mission Control</h3>
                            
                            {/* Standard Draft Pick Mode */}
                            {!auctionRequest && !challengeRequest && (
                                <>
                                    <div className="w-full bg-slate-950 rounded-full h-3 mb-8 border border-slate-700 shadow-inner overflow-hidden">
                                        <div className="bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 h-full w-full rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 focus-within:border-blue-500 transition-colors">
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Priority Slab</label>
                                            <select 
                                                className="w-full bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
                                                value={selectedSlab}
                                                onChange={(e) => setSelectedSlab(e.target.value)}
                                            >
                                                <option value="Gold" className="bg-slate-800">🥇 Gold</option>
                                                <option value="Silver" className="bg-slate-800">🥈 Silver</option>
                                                <option value="Bronze" className="bg-slate-800">🥉 Bronze</option>
                                            </select>
                                        </div>
                                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 focus-within:border-blue-500 transition-colors">
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Player Digits</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="w-full bg-transparent text-white font-mono font-bold text-xl outline-none"
                                                value={selectedNumber}
                                                onChange={(e) => setSelectedNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={submitPick}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 focus:ring-4 focus:ring-indigo-500/50 text-white font-black py-5 px-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all uppercase tracking-widest text-xl group"
                                    >
                                        Transmit Pick
                                    </button>
                                </>
                            )}

                            {/* Auction Request Phase (Top Priority or Matching Bid) */}
                            {auctionRequest && (
                                <div className="bg-slate-900/90 border border-blue-500/50 p-6 rounded-2xl shadow-2xl pulse-border slide-up text-center">
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded inline-block mb-3 uppercase tracking-widest animate-pulse">Action Required</span>
                                    <h4 className="text-xl font-bold text-white mb-2">{auctionRequest.instructions}</h4>
                                    <p className="text-slate-400 mb-6 text-sm">Priority List Sequence</p>
                                    
                                    {auctionRequest.currentBid > 0 && (
                                        <div className="bg-slate-950 p-4 rounded-xl mb-6 border border-red-500/30">
                                            <p className="text-slate-400 text-sm">Challenger Bid</p>
                                            <p className="text-red-400 font-mono text-3xl font-black">${auctionRequest.currentBid}M</p>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button onClick={handleReject} className="flex-1 bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500 text-slate-300 font-bold py-3 rounded-lg transition-all">Reject</button>
                                        <button onClick={handleAccept} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                                            {auctionRequest.currentBid > 0 ? "Match Bid" : "Accept (Free)"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Challenge Phase (Option to steal) */}
                            {challengeRequest && (
                                <div className="bg-slate-900/90 border border-emerald-500/50 p-6 rounded-2xl shadow-2xl pulse-bg slide-up text-center">
                                    <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded inline-block mb-3 uppercase tracking-widest">Challenge Phase</span>
                                    <h4 className="text-lg font-bold text-white mb-4">An opponent accepted this player. Place a challenge bid?</h4>
                                    
                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        <span className="text-emerald-400 text-2xl font-bold">$</span>
                                        <input 
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(Number(e.target.value))}
                                            className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-xl text-center focus:border-emerald-500 focus:outline-none"
                                        />
                                        <span className="text-emerald-400 text-2xl font-bold">M</span>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={handleReject} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-all">Pass</button>
                                        <button 
                                            onClick={handleSendChallenge} 
                                            disabled={bidAmount <= 0}
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

                {/* Right Drawer (Terminal Logs) */}
                <div className="w-full lg:w-1/4 glass-panel rounded-xl flex flex-col p-0 overflow-hidden border-t-4 border-t-indigo-500">
                    <div className="bg-slate-900 px-5 py-3 border-b border-slate-700/50 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Sever Terminal</h3>
                    </div>
                    <div className="flex-grow p-5 overflow-y-auto space-y-3 font-mono text-xs">
                        {logs.map((log, i) => (
                            <div key={i} className={`p-2 rounded ${log.includes('You') ? 'bg-blue-900/30 text-blue-300 border-l-2 border-blue-500' : 'text-slate-400 border-l-2 border-slate-700/50'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* Interactive Tutorial Coach Overlay */}
            {isTutorialMode && (
                <div className="fixed bottom-12 right-12 z-50 drop-shadow-2xl fade-in slide-up hidden md:block">
                    <div className="bg-slate-900/90 backdrop-blur-md p-6 border-2 border-amber-500 rounded-3xl max-w-sm relative shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        <div className="absolute -top-8 -left-8 text-6xl drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">🤖</div>
                        <h3 className="text-amber-400 font-black uppercase tracking-widest mb-3 pl-8 border-b border-amber-500/30 pb-2">Draft Coach</h3>
                        <p className="text-white text-sm leading-relaxed font-medium">
                            {!auctionRequest && !challengeRequest && "Welcome Rookie! Pick a priority slab (Higher tier players are rarer) and guess a secret number. The closer your number is to the server's random draw, the higher your priority! Hit Transmit."}
                            {auctionRequest && !auctionRequest.currentBid && "Look at that! The server drew a player, and your number was closest! You can Accept them for free. (If you reject 3 times consecutively, the server forces you to pick!)"}
                            {auctionRequest && auctionRequest.currentBid > 0 && "High stakes! An opponent wants this player and placed a Challenge Bid! You must either Match the bid to keep them, or Reject and save your purse."}
                            {challengeRequest && "An opponent had higher priority and accepted this player for free. You have one chance to steal them by submitting a Challenge Bid!"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

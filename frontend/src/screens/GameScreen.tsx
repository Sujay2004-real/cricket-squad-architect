import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../services/socket';

export default function GameScreen() {
    const { gameKey } = useParams();
    const navigate = useNavigate();
    const { round, currentSection, updateGameState } = useGameStore();

    const [selectedSlab, setSelectedSlab] = useState('Gold');
    const [selectedNumber, setSelectedNumber] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    
    useEffect(() => {
        if (gameKey) {
            socket.emit('joinLobby', gameKey);
            setLogs(prev => [`[System] Secure connection established to Draft Server: ${gameKey}`, ...prev]);
        }

        socket.on('gameStateUpdate', (state) => {
             updateGameState(state);
             setLogs(prev => [`[System] Matrix synchronized.`, ...prev]);
        });
        
        socket.on('bidUpdate', (data) => {
             setLogs(prev => [`[Auction] ${data.message}`, ...prev]);
        });

        return () => {
            socket.off('gameStateUpdate');
            socket.off('bidUpdate');
        };
    }, [gameKey, updateGameState]);

    const submitPick = () => {
        socket.emit('submitPick', { gameKey, selectedSlab, selectedNumber });
        setLogs(prev => [`[You] Pick submitted: ${selectedSlab} #${selectedNumber}`, ...prev]);
    };

    return (
        <div className="flex flex-col h-screen fade-in">
            {/* Top Dashboard Header */}
            <header className="bg-slate-900 border-b border-slate-700/80 p-4 flex justify-between items-center shadow-lg z-10 sticky top-0">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 uppercase tracking-widest px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        Round {round}
                    </h2>
                    <button 
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-red-400 font-bold text-sm transition-colors uppercase tracking-widest flex items-center gap-2"
                    >
                        <span className="text-xl">⏻</span> Disconnect
                    </button>
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
                
                {/* Left Drawer (Sections) */}
                <div className="w-full lg:w-1/4 flex flex-col gap-4 overflow-y-auto pr-2">
                    <div className={`p-5 rounded-xl border transition-all duration-500 ${currentSection === 'A' ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] pulse-border' : 'bg-slate-900/60 border-slate-700/50'}`}>
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700/50 pb-2 uppercase tracking-wider flex items-center justify-between">
                            Section A 
                            {currentSection === 'A' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">ACTIVE</span>}
                        </h3>
                        <div className="space-y-3 h-32 flex items-center justify-center text-slate-500">
                            [Player Roster Data]
                        </div>
                    </div>
                    
                    <div className={`p-5 rounded-xl border transition-all duration-500 ${currentSection === 'B' ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] pulse-border' : 'bg-slate-900/60 border-slate-700/50'}`}>
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700/50 pb-2 uppercase tracking-wider flex items-center justify-between">
                            Section B
                            {currentSection === 'B' && <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">ACTIVE</span>}
                        </h3>
                        <div className="space-y-3 h-32 flex items-center justify-center text-slate-500">
                            [Player Roster Data]
                        </div>
                    </div>
                </div>

                {/* Center Console (Action & Timer) */}
                <div className="w-full lg:w-2/4 flex flex-col gap-6">
                    
                    <div className="glass-card flex-grow relative overflow-hidden p-8 flex flex-col justify-center">
                        {/* Huge background watermark */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-slate-800/10 z-0 pointer-events-none sel-none">
                            {currentSection}
                        </div>
                        
                        <div className="relative z-10 w-full max-w-md mx-auto">
                            <h3 className="text-2xl font-black text-center text-white mb-8 uppercase tracking-widest glow-text">Mission Control</h3>
                            
                            <div className="w-full bg-slate-950 rounded-full h-3 mb-8 border border-slate-700 shadow-inner overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 h-full w-full rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
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
                                        placeholder="0"
                                        className="w-full bg-transparent text-white font-mono font-bold text-xl outline-none"
                                        value={selectedNumber}
                                        onChange={(e) => setSelectedNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={submitPick}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-5 px-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-xl group"
                            >
                                <span className="text-blue-300 mr-2 group-hover:text-white transition-colors">↑</span>
                                Transmit Pick
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Drawer (Terminal Logs) */}
                <div className="w-full lg:w-1/4 glass-panel rounded-xl flex flex-col p-0 overflow-hidden border-t-4 border-t-indigo-500">
                    <div className="bg-slate-900 px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Sever Terminal</h3>
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>
                    </div>
                    <div className="flex-grow p-5 overflow-y-auto space-y-3 font-mono text-xs">
                        {logs.map((log, i) => (
                            <div key={i} className={`p-2 rounded ${log.includes('You') ? 'bg-blue-900/30 text-blue-300 border-l-2 border-blue-500' : 'text-slate-400'}`}>
                                <span className="font-bold mr-2 text-slate-500">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <p className="text-slate-600 text-center mt-10">Awaiting incoming transmissions...</p>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

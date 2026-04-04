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
            setLogs(prev => [...prev, `[System] Connected to game server room: ${gameKey}`]);
        }

        socket.on('gameStateUpdate', (state) => {
             updateGameState(state);
             setLogs(prev => [...prev, `[System] Game state synchronized.`]);
        });
        
        socket.on('bidUpdate', (data) => {
             setLogs(prev => [...prev, `[Auction] ${data.message}`]);
        });

        return () => {
            socket.off('gameStateUpdate');
            socket.off('bidUpdate');
        };
    }, [gameKey, updateGameState]);

    const submitPick = () => {
        socket.emit('submitPick', { gameKey, selectedSlab, selectedNumber });
        setLogs(prev => [...prev, `[You] Submitted pick for ${selectedSlab} ${selectedNumber}`]);
    };

    return (
        <div className="flex flex-col h-screen fade-in">
            <header className="bg-gray-800 p-3 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Round {round}</h2>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm transition duration-300"
                    >
                        Quit Game
                    </button>
                </div>
                <div className="text-center">
                    <p className="text-lg font-semibold">Section {currentSection}'s Turn</p>
                    <p className="text-sm text-gray-400">Waiting for picks...</p>
                </div>
                <div className="text-right">
                    <h3 className="text-lg font-semibold">Your Team</h3>
                    <p className="text-green-400 font-mono">Purse: $100M</p>
                </div>
            </header>

            <main className="flex flex-col lg:flex-row p-4 gap-4 flex-grow overflow-hidden">
                <div className="w-full lg:w-1/4 overflow-y-auto">
                    <div className={`mb-4 p-4 rounded-lg ${currentSection === 'A' ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-gray-800/50'}`}>
                        <h3 className="text-xl font-bold mb-2 border-b border-gray-700 pb-2">Section A</h3>
                        <div className="space-y-3">
                            {/* Render Section A Teams */}
                        </div>
                    </div>
                    <div className={`p-4 rounded-lg ${currentSection === 'B' ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-gray-800/50'}`}>
                        <h3 className="text-xl font-bold mb-2 border-b border-gray-700 pb-2">Section B</h3>
                        <div className="space-y-3">
                            {/* Render Section B Teams */}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex flex-col gap-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-center">Your Turn: Make Your Selection</h3>
                        
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                            <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Choose a Slab</label>
                                <select 
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedSlab}
                                    onChange={(e) => setSelectedSlab(e.target.value)}
                                >
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                    <option value="Bronze">Bronze</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Choose a Number</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedNumber}
                                    onChange={(e) => setSelectedNumber(e.target.value)}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={submitPick}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md mt-4 transition duration-300"
                        >
                            Submit Pick
                        </button>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow flex items-center justify-center text-center">
                        <p className="text-gray-400 text-lg">Waiting for selections...</p>
                    </div>
                </div>

                <div className="w-full lg:w-1/4 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col">
                    <h3 className="text-xl font-bold mb-2 border-b border-gray-700 pb-2">Game Log</h3>
                    <div className="flex-grow overflow-y-auto space-y-2 text-sm pr-2 text-gray-300">
                        {logs.map((log, i) => <p key={i}>{log}</p>)}
                    </div>
                </div>
            </main>
        </div>
    );
}

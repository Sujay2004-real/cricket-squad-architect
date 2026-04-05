import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import GameRulesModal from '../components/GameRulesModal';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const { userId } = useGameStore();

  const handleStartGame = () => {
    const lobbyId = Math.random().toString(36).substring(2, 7).toUpperCase();
    navigate(`/lobby/${lobbyId}`);
  };

  const suggestName = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/suggest-name', { method: 'POST' });
      const data = await response.json();
      if (data.suggestedName) {
         setTeamName(data.suggestedName);
      }
    } catch (e) {
      console.error(e);
      setTeamName("AI Suggested Strikers ✨");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 fade-in">
      <div className="text-center mb-10 slide-up">
        <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 mb-2 tracking-tight drop-shadow-2xl">
          CRICKET SQUAD
        </h1>
        <h1 className="text-5xl font-black text-white uppercase tracking-widest glow-text">ARCHITECT</h1>
        <p className="text-blue-200/70 mt-4 text-lg font-medium tracking-wide">The Ultimate Draft & Auction Challenge</p>
      </div>
      
      <div className="glass-panel p-10 w-full max-w-lg slide-up" style={{ animationDelay: '0.1s' }}>
        <label htmlFor="teamNameInput" className="block text-sm font-semibold text-blue-200/80 uppercase tracking-wider mb-2">
          Enter Your Team Name
        </label>
        <div className="flex gap-3">
          <input 
            type="text" 
            id="teamNameInput" 
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-600/50 rounded-lg px-5 py-3 text-white font-medium focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
            placeholder="e.g., Strategic Strikers"
          />
          <button 
            onClick={suggestName}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white p-3 rounded-lg transition-all flex-shrink-0 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-400 group" 
            title="Suggest a Name with AI"
          >
            <span className="group-hover:scale-110 inline-block transition-transform">✨</span>
          </button>
        </div>
        
        <div className="mt-10 space-y-4">
          <button 
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest"
          >
            Host New Game
          </button>
          
          <button 
            onClick={() => setIsRulesOpen(true)}
            className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-600 hover:border-blue-400 text-slate-200 font-bold py-4 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-sm"
          >
            Game Rules
          </button>
        </div>
      </div>
      
      <p className="text-xs text-slate-600 mt-8 font-mono tracking-widest uppercase">ID: <span>{userId || 'Loading...'}</span></p>

      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};

export default HomeScreen;

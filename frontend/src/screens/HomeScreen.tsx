import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import GameRulesModal from '../components/GameRulesModal';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [joinKey, setJoinKey] = useState('');
  const [showCpuModal, setShowCpuModal] = useState(false);
  const { userId, setTutorialMode, setUserId } = useGameStore();

  const handleStartGame = () => {
    // Usually host setup goes to HostSetupScreen... but we can just skip or go direct. Wait, the user wants CPU modes. HostSetupScreen allows config. Let's redirect to standard host setup.
    navigate('/host');
  };

  const handleJoinGame = () => {
    if (joinKey.trim()) {
      navigate(`/lobby/${joinKey.trim().toUpperCase()}`);
    }
  };

  const handleCpuGame = async (wantsTutorial: boolean) => {
    setTutorialMode(wantsTutorial);
    try {
        const HOST = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${HOST}/api/create-cpu-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, teamName })
        });
        const data = await response.json();
        if (data.gameKey) {
            navigate(`/game/${data.gameKey}`);
        }
    } catch (e) {
        console.error("Failed to boot CPU Game", e);
    }
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
          
          <div className="flex gap-2 mb-4">
               <input 
                  type="text" 
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value)}
                  placeholder="LOBBY KEY"
                  className="w-2/3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none uppercase font-mono tracking-widest"
               />
               <button 
                  onClick={handleJoinGame}
                  className="w-1/3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-2 rounded-xl transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)] uppercase text-sm tracking-wider"
               >
                  Join
               </button>
          </div>

          <div className="flex gap-4">
              <button 
                onClick={() => setShowCpuModal(true)}
                className="w-1/2 bg-amber-600/90 hover:bg-amber-500 border border-amber-500/50 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all uppercase tracking-widest text-xs"
              >
                Play VS AI
              </button>
              <button 
                onClick={() => setIsRulesOpen(true)}
                className="w-1/2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 hover:border-blue-400 text-slate-200 font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-xs"
              >
                Manual Rules
              </button>
          </div>
        </div>
      </div>
      
      {/* CPU / Tutorial Prompt Modal */}
      {showCpuModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 fade-in">
            <div className="glass-panel p-8 rounded-2xl max-w-sm w-full border border-blue-500/30 text-center slide-up">
                <div className="text-4xl mb-4">🎓</div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Interactive Tutorial?</h2>
                <p className="text-slate-400 mb-8 text-sm">Would you like the automated coach to guide you through your first match against the AI?</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => handleCpuGame(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg w-full transition-all tracking-wider">
                        Yes, Guide Me
                    </button>
                    <button onClick={() => handleCpuGame(false)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-3 rounded-lg w-full transition-all tracking-wider">
                        No, I know the rules
                    </button>
                </div>
                <button onClick={() => setShowCpuModal(false)} className="mt-6 text-slate-500 hover:text-white text-xs uppercase tracking-widest transition-colors font-bold">
                    Cancel
                </button>
            </div>
        </div>
      )}
      
      <p className="text-xs text-slate-600 mt-8 font-mono tracking-widest uppercase">ID: <span>{userId || 'Loading...'}</span></p>

      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};

export default HomeScreen;

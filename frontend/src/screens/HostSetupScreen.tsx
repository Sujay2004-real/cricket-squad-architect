import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HostSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [maxTeams, setMaxTeams] = useState(10);
  const [slotsPerTeam, setSlotsPerTeam] = useState(11);
  const [maxPurse, setMaxPurse] = useState(100);

  const [slabs, setSlabs] = useState<string[]>(['Gold', 'Silver', 'Bronze']);
  const [newSlabName, setNewSlabName] = useState('');

  const handleAddSlab = () => {
    if (newSlabName && !slabs.includes(newSlabName)) {
      setSlabs([...slabs, newSlabName]);
      setNewSlabName('');
    }
  };

  const createGame = () => {
    const gameKey = Math.random().toString(36).substring(2, 7).toUpperCase();
    navigate(`/lobby/${gameKey}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 fade-in">
      
      <div className="glass-panel w-full max-w-5xl rounded-2xl p-0 overflow-hidden slide-up flex flex-col md:flex-row">
        
        {/* Sidebar Info */}
        <div className="bg-slate-900/80 p-10 md:w-1/3 border-r border-slate-700/50 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 mb-2 leading-tight">
              Host Configuration
            </h1>
            <p className="text-slate-400 leading-relaxed text-sm">
              Set up the parameters for your draft engine. Adjust team sizes, purses, and add custom priority slabs.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="mt-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors font-medium text-sm w-max"
          >
            ← Back to Terminal
          </button>
        </div>

        {/* Main Config Area */}
        <div className="p-10 md:w-2/3">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
            <span className="bg-blue-500/20 text-blue-400 py-1 px-3 rounded-md text-sm border border-blue-500/30">1</span> 
            Economy Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Max Teams</label>
              <input 
                type="number" 
                value={maxTeams} 
                onChange={e => setMaxTeams(Number(e.target.value))}
                className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
              />
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Slots / Team</label>
              <input 
                type="number" 
                value={slotsPerTeam} 
                onChange={e => setSlotsPerTeam(Number(e.target.value))}
                className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
              />
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Purse (M)</label>
              <div className="flex items-center">
                <span className="text-green-400 text-2xl font-bold mr-1">$</span>
                <input 
                  type="number" 
                  value={maxPurse} 
                  onChange={e => setMaxPurse(Number(e.target.value))}
                  className="w-full bg-transparent text-2xl font-bold text-white outline-none text-green-400" 
                />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
            <span className="bg-blue-500/20 text-blue-400 py-1 px-3 rounded-md text-sm border border-blue-500/30">2</span> 
            Priority Slabs
          </h2>
          
          <div className="flex gap-3 mb-6">
            <input 
              type="text" 
              value={newSlabName}
              onChange={e => setNewSlabName(e.target.value)}
              placeholder="e.g., Uncapped" 
              className="flex-grow bg-slate-950/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
            <button 
              onClick={handleAddSlab}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-10">
              {slabs.map(slab => (
                  <span key={slab} className="bg-blue-900/30 text-blue-200 font-medium px-4 py-2 rounded-lg border border-blue-500/30 shadow-inner">
                    {slab}
                  </span>
              ))}
          </div>

          <button 
            onClick={createGame}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-5 px-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-lg"
          >
            Launch Server Instance
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostSetupScreen;

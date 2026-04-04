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
    // Generate a random game key
    const gameKey = Math.random().toString(36).substring(2, 7).toUpperCase();
    navigate(`/lobby/${gameKey}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 fade-in">
      <h1 className="text-4xl font-bold text-blue-400 my-6">Host a New Online Game</h1>
      
      <div className="w-full max-w-6xl mx-auto bg-gray-800 p-8 rounded-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-blue-300 border-b border-gray-700 pb-2">1. Game Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Teams</label>
            <input 
              type="number" 
              value={maxTeams} 
              onChange={e => setMaxTeams(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Player Slots per Team</label>
            <input 
              type="number" 
              value={slotsPerTeam} 
              onChange={e => setSlotsPerTeam(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Starting Purse (in Millions)</label>
            <input 
              type="number" 
              value={maxPurse} 
              onChange={e => setMaxPurse(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-blue-300 border-b border-gray-700 pb-2">2. Manage Player Slabs</h2>
        <div className="flex gap-4 items-end mb-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-300 mb-1">New Slab Name</label>
            <input 
              type="text" 
              value={newSlabName}
              onChange={e => setNewSlabName(e.target.value)}
              placeholder="e.g., Marquee, Uncapped" 
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <button 
            onClick={handleAddSlab}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md"
          >
            Add Slab
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-8">
            {slabs.map(slab => (
                <span key={slab} className="bg-gray-700 text-sm px-3 py-1 rounded-full border border-gray-600">{slab}</span>
            ))}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md"
          >
            Back to Menu
          </button>
          <button 
            onClick={createGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md"
          >
            Create Game & Go to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostSetupScreen;

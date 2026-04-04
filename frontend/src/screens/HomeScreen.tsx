import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const { userId } = useGameStore();

  const handleStartGame = () => {
    // Generate a random lobby ID
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
      <h1 className="text-5xl font-bold text-blue-400 mb-2">Cricket Squad Architect</h1>
      <p className="text-gray-400 mb-8">The Ultimate Draft & Auction Challenge</p>
      
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <label htmlFor="teamNameInput" className="block text-sm font-medium text-gray-300 mb-2">
          Enter Your Team Name
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            id="teamNameInput" 
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            placeholder="e.g., Strategic Strikers"
          />
          <button 
            onClick={suggestName}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-md transition duration-300 flex-shrink-0" 
            title="✨ Suggest a Name with AI"
          >
            ✨
          </button>
        </div>
        
        <button 
          onClick={handleStartGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md mt-6 transition duration-300"
        >
          Host New Game
        </button>
        
        <button 
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md mt-3 transition duration-300"
        >
          View Last Game Results
        </button>
        
        <button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md mt-3 transition duration-300"
        >
          Game Rules
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">User ID: <span>{userId || 'Loading...'}</span></p>
    </div>
  );
};

export default HomeScreen;

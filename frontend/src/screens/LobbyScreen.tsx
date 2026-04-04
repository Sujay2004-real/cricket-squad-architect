import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LobbyScreen: React.FC = () => {
    const { gameKey } = useParams();
    const navigate = useNavigate();

    return (
        <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center fade-in">
            <h1 className="text-4xl text-blue-400 font-bold mb-4">Lobby Screen</h1>
             <p className="text-game-key font-mono text-2xl bg-gray-800 p-4 rounded-lg my-4 border border-gray-600">{gameKey}</p>
            <p className="text-gray-400 mb-8">Waiting for players to join...</p>

            <button onClick={() => navigate(`/game/${gameKey}`)} className="bg-green-600 px-6 py-2 rounded font-bold hover:bg-green-500 transition">
                Start Game
            </button>
        </div>
    );
};

export default LobbyScreen;

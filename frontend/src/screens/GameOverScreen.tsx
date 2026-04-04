import React from 'react';

const GameOverScreen: React.FC = () => {
    return (
        <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-5xl text-blue-400 font-bold mb-4">Draft Complete!</h1>
            <p className="text-gray-400">Squad results will appear here.</p>
        </div>
    );
};

export default GameOverScreen;

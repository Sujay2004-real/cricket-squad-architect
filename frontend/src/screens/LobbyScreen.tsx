import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LobbyScreen: React.FC = () => {
    const { gameKey } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 fade-in">
            <div className="glass-panel p-12 rounded-3xl text-center max-w-xl w-full pulse-bg">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-400/30">
                    <span className="text-3xl">📡</span>
                </div>
                
                <h1 className="text-3xl font-extrabold text-white mb-2 uppercase tracking-widest">Waiting Room</h1>
                <p className="text-slate-400 mb-8 font-medium">Share this cryptographic key with your friend.</p>

                <div className="bg-slate-950 border border-slate-700 p-6 rounded-2xl mb-10 shadow-inner group cursor-copy transition-all hover:border-blue-500/50">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Lobby Access Key</p>
                    <p className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-widest">
                        {gameKey}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 text-slate-400 font-medium mb-10">
                    <div className="w-5 h-5 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin"></div>
                    Establishing connections...
                </div>

                <button 
                    onClick={() => navigate(`/game/${gameKey}`)} 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-5 px-6 rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.6)] transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-lg"
                >
                    Initialize Draft Engine
                </button>
            </div>
        </div>
    );
};

export default LobbyScreen;

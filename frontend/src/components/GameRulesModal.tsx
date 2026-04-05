import React from 'react';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div 
        className="glass-panel p-8 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto slide-up shadow-[0_0_50px_rgba(30,58,138,0.3)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 mb-6 uppercase tracking-tight">
          Game Rules & Logic
        </h2>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          
          <section className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-blue-400">1.</span> Draft Phase (Priority Tiers)
            </h3>
            <p>
              The game revolves around drafting exactly <strong>27 players</strong> into your squad. The player pool is split into three priority tiers based on talent and cost:
            </p>
            <ul className="list-disc ml-5 mt-3 space-y-1 text-sm">
              <li><strong className="text-yellow-400">Gold Slab:</strong> 9 Players. The absolute best in the world. High cost, high impact.</li>
              <li><strong className="text-slate-300">Silver Slab:</strong> 9 Players. Elite international talent and rising stars.</li>
              <li><strong className="text-amber-600">Bronze Slab:</strong> 9 Players. Quality domestic performers and valuable role players.</li>
            </ul>
          </section>

          <section className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-blue-400">2.</span> Bidding Mechanics
            </h3>
            <p>
              In each round, the Host and Guest will take turns nominating players from the pool. Both teams bid simultaneously on the nominated player out of their virtual purse.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-red-500/20">
                <strong className="text-red-400 block mb-1">Exact Match Rule</strong>
                If both players bid the exact same amount on a player, neither player gets them! The player goes unsold. Mind games matter.
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-green-500/20">
                <strong className="text-green-400 block mb-1">Forced Pick Rule</strong>
                If you bid 0 while the other player places a valid bid, the other player is forced to acquire them. Use this to drain their purse!
              </div>
            </div>
          </section>

          <section className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-blue-400">3.</span> Winning the Draft
            </h3>
            <p>
              The goal isn't just to spend your money, it involves squad balance. The winner is determined natively by squad composition quality, AI-analyzed tactical soundness, and remaining purse efficiency. 
              Run out of money too early, and you'll be forced to take defaults.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-indigo-500 transform hover:-translate-y-1 transition-all shadow-lg shadow-blue-900/50"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameRulesModal;

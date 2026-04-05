import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

const SLAB_ORDER = ['Gold', 'Silver', 'Bronze'];
const SLAB_STYLES: Record<string, { border: string; title: string; icon: string }> = {
    Gold:   { border: 'border-amber-500/50',  title: 'text-amber-400',  icon: '🥇' },
    Silver: { border: 'border-slate-400/50',  title: 'text-slate-300',  icon: '🥈' },
    Bronze: { border: 'border-orange-700/50', title: 'text-orange-500', icon: '🥉' },
};

const GameOverScreen: React.FC = () => {
    const navigate = useNavigate();
    const { gameResult, userId } = useGameStore();

    if (!gameResult) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 text-lg mb-6">No game result found.</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const { teams: resultTeams, draftPool, totalRounds } = gameResult;
    const myTeam = resultTeams.find(t => t.id === userId);
    const myPlayers = draftPool.filter(p => p.teamId === userId);
    // Sort: Gold → Silver → Bronze, then alphabetical
    const myPlayersSorted = [...myPlayers].sort((a, b) => {
        const si = SLAB_ORDER.indexOf(a.slab) - SLAB_ORDER.indexOf(b.slab);
        return si !== 0 ? si : a.name.localeCompare(b.name);
    });
    const totalSpent = myPlayers.reduce((sum, p) => sum + (p.draftPrice || 0), 0);

    return (
        <div className="min-h-screen p-6 fade-in">
            {/* Hero */}
            <div className="text-center mb-10 slide-up">
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 mb-2 tracking-tight">
                    Draft Complete!
                </h1>
                <p className="text-slate-400 text-lg">
                    {totalRounds} round{totalRounds !== 1 ? 's' : ''} played
                    {myTeam && ` · ${myTeam.name}`}
                </p>
            </div>

            <div className="max-w-5xl mx-auto space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 slide-up">
                    {[
                        { label: 'Players Drafted', value: myPlayers.length, color: 'text-blue-400' },
                        { label: 'Total Spent', value: `$${totalSpent}M`, color: 'text-red-400' },
                        { label: 'Purse Remaining', value: `$${myTeam?.purse ?? 0}M`, color: 'text-green-400' },
                        { label: 'Premium Players', value: myPlayers.filter(p => p.premium).length, color: 'text-amber-400' },
                    ].map(stat => (
                        <div key={stat.label} className="glass-panel rounded-xl p-5 text-center">
                            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-bold">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* My Squad */}
                <div className="glass-panel rounded-2xl p-6 slide-up">
                    <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="text-blue-400">🏏</span>
                        {myTeam?.name || 'Your Squad'}
                    </h2>
                    {SLAB_ORDER.map(slab => {
                        const slabPlayers = myPlayersSorted.filter(p => p.slab === slab);
                        if (slabPlayers.length === 0) return null;
                        const style = SLAB_STYLES[slab];
                        return (
                            <div key={slab} className={`mb-6 rounded-xl border ${style.border} bg-slate-900/50 p-4`}>
                                <h3 className={`text-sm font-black ${style.title} uppercase tracking-widest mb-3`}>
                                    {style.icon} {slab} Tier — {slabPlayers.length} player{slabPlayers.length !== 1 ? 's' : ''}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {slabPlayers.map(p => (
                                        <div key={p.id} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {p.premium && <span className="text-amber-400 text-xs font-black">⭐</span>}
                                                    <span className="font-bold text-white text-sm truncate">{p.name}</span>
                                                </div>
                                                {p.accomplishments && (
                                                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{p.accomplishments}</p>
                                                )}
                                                <p className="text-blue-300 text-xs mt-1">🎯 {p.perk}</p>
                                            </div>
                                            <div className="ml-3 flex-shrink-0 text-right">
                                                {(p.draftPrice ?? 0) > 0 ? (
                                                    <span className="text-red-400 font-mono font-bold text-sm">${p.draftPrice}M</span>
                                                ) : (
                                                    <span className="text-emerald-400 font-bold text-xs">Free</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {myPlayers.length === 0 && (
                        <p className="text-slate-400 text-center py-8">No players drafted this session.</p>
                    )}
                </div>

                {/* All Teams Summary */}
                <div className="glass-panel rounded-2xl p-6 slide-up">
                    <h2 className="text-xl font-extrabold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="text-slate-400">📊</span> All Teams
                    </h2>
                    <div className="space-y-2">
                        {[...resultTeams]
                            .map(t => ({
                                ...t,
                                playerCount: draftPool.filter(p => p.teamId === t.id).length,
                            }))
                            .sort((a, b) => b.playerCount - a.playerCount)
                            .map(t => (
                                <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${t.id === userId ? 'bg-blue-900/30 border-blue-500/40' : 'bg-slate-800/40 border-slate-700/30'}`}>
                                    <div className="flex items-center gap-3">
                                        {t.id === userId && <span className="text-blue-400 text-xs font-black uppercase tracking-wider">You</span>}
                                        <span className={`font-bold text-sm ${t.id === userId ? 'text-white' : 'text-slate-300'}`}>{t.name}</span>
                                        {t.isCPU && t.aiDifficulty && (
                                            <span className="text-xs text-slate-600 capitalize">({t.aiDifficulty})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6 text-right">
                                        <div>
                                            <p className="text-white font-bold text-sm">{t.playerCount}</p>
                                            <p className="text-slate-500 text-xs uppercase">players</p>
                                        </div>
                                        <div>
                                            <p className="text-green-400 font-mono font-bold text-sm">${t.purse}M</p>
                                            <p className="text-slate-500 text-xs uppercase">left</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center pb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 px-12 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-lg"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverScreen;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Trophy,
  Award,
  Flame,
  Crown,
  Heart,
  Clock,
  Sparkles,
  CheckCircle,
  Play,
  Zap,
  Edit2,
  Check,
  LogIn,
  LogOut,
  Coins,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { GAMES_CATALOG } from '../../data/games';

const AVATAR_OPTIONS = ['🎮', '👑', '⚡', '🐉', '🥷', '🚀', '💎', '🎲', '🦁', '🛸', '🎯', '🔥'];

export const ProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    closeProfile,
    profile,
    updateProfile,
    stats,
    achievements,
    setActiveGameId,
    openAuthModal,
    signOutUser,
    isAuthenticated,
    user,
  } = useGame();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.username);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');

  if (!isProfileOpen) return null;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const nextLevelXp = profile.level * 500;
  const currentLevelProgress = profile.xp % 500;
  const progressPercent = Math.min(100, Math.round((currentLevelProgress / 500) * 100));

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateProfile({ username: nameInput.trim() });
      setIsEditingName(false);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header & User Card */}
          <div className="p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-b border-slate-800 relative">
            <button
              id="close-profile-modal-btn"
              onClick={closeProfile}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              
              {/* Avatar Selector Dropdown / Grid */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl border-2 border-indigo-400/50">
                  {profile.avatar}
                </div>
                <div className="flex gap-1">
                  {AVATAR_OPTIONS.slice(0, 5).map(av => (
                    <button
                      key={av}
                      onClick={() => updateProfile({ avatar: av })}
                      className={`w-6 h-6 rounded text-xs flex items-center justify-center hover:scale-110 transition-transform ${
                        profile.avatar === av ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username, Rank, & XP Bar */}
              <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        className="px-2.5 py-1 bg-slate-950 border border-indigo-500 rounded-lg text-sm text-white focus:outline-none"
                        maxLength={16}
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold font-display text-white">
                        {profile.username}
                      </h2>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Edit Username"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    Level {profile.level}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <p className="text-xs text-slate-400">
                    Member since {profile.joinedDate} • Total XP: {profile.xp}
                  </p>
                  {user?.provider === 'google' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300">
                      <ShieldCheck className="w-3 h-3 text-blue-400" /> Google Verified ({user.email})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                      Guest Player
                    </span>
                  )}
                </div>

                {/* Balances */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{profile.coins || 250} Coins</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>${profile.cash || 0} Cash</span>
                  </div>

                  {!isAuthenticated ? (
                    <button
                      id="profile-signin-btn"
                      onClick={() => {
                        closeProfile();
                        openAuthModal();
                      }}
                      className="ml-auto px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In with Google
                    </button>
                  ) : (
                    <button
                      id="profile-signout-btn"
                      onClick={signOutUser}
                      className="ml-auto px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  )}
                </div>

                {/* Level Progress Bar */}
                <div className="w-full pt-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                    <span>Level {profile.level}</span>
                    <span>{currentLevelProgress} / 500 XP to Level {profile.level + 1}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
            {[
              { id: 'stats', label: 'Statistics', icon: <Trophy className="w-4 h-4" /> },
              { id: 'achievements', label: `Achievements (${unlockedCount}/${achievements.length})`, icon: <Award className="w-4 h-4" /> },
              { id: 'history', label: 'Recently Played', icon: <Clock className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
            
            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                
                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Games Played</span>
                    <p className="text-2xl font-bold font-display text-white mt-1">{stats.gamesPlayed}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Games Won</span>
                    <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{stats.gamesWon}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Win Rate</span>
                    <p className="text-2xl font-bold font-display text-indigo-300 mt-1">{winRate}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Achievements</span>
                    <p className="text-2xl font-bold font-display text-amber-400 mt-1">{unlockedCount}</p>
                  </div>
                </div>

                {/* Per-Game Breakdown */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3">
                    Game Records & High Scores
                  </h4>

                  {Object.keys(stats.gameStats).length > 0 ? (
                    <div className="divide-y divide-slate-800 rounded-xl bg-slate-950/40 border border-slate-800 overflow-hidden">
                      {Object.entries(stats.gameStats).map(([gameId, statValue]) => {
                        const gStat = statValue as { played: number; won: number; highScore: number };
                        const game = GAMES_CATALOG.find(g => g.id === gameId);
                        if (!game) return null;
                        return (
                          <div key={gameId} className="p-3.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-white">{game.name}</span>
                              <span className="text-[10px] uppercase text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                                {game.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400">
                              <span>Played: <strong className="text-slate-200">{gStat.played}</strong></span>
                              <span>Won: <strong className="text-emerald-400">{gStat.won}</strong></span>
                              {gStat.highScore > 0 && (
                                <span>High Score: <strong className="text-amber-400">{gStat.highScore}</strong></span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/30 rounded-xl border border-slate-800">
                      Play your first game to view personalized game records here!
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map(ach => (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      ach.unlocked
                        ? 'bg-gradient-to-r from-amber-950/30 to-slate-900 border-amber-500/40 text-amber-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ach.unlocked
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white truncate">{ach.title}</h4>
                        {ach.unlocked && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{ach.description}</p>
                      
                      {!ach.unlocked && (
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RECENT GAMES TAB */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {profile.recentGameIds.length > 0 ? (
                  profile.recentGameIds.map(gameId => {
                    const game = GAMES_CATALOG.find(g => g.id === gameId);
                    if (!game) return null;
                    return (
                      <div
                        key={gameId}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${game.accentGradient} flex items-center justify-center text-white font-bold text-xs`}>
                            {game.name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-white">{game.name}</h4>
                            <span className="text-[10px] text-slate-400 capitalize">{game.category} • {game.difficulty}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            closeProfile();
                            setActiveGameId(game.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Launch
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic p-6 text-center">
                    No recently played games yet. Pick a game from the hub to get started!
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
            <button
              onClick={closeProfile}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

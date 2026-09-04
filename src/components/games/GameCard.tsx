import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Play,
  Heart,
  Crown,
  Dice5,
  Layers,
  Sparkles,
  Search,
  Zap,
  Grid3X3,
  Bot,
  HelpCircle,
  Shuffle,
  Disc,
  CircleDot,
  ShieldCheck,
  Binary,
  Bomb,
  LayoutGrid,
  Activity,
  Swords,
  Coins,
  Eye,
  FileQuestion
} from 'lucide-react';
import { GameMetadata } from '../../types';
import { useGame } from '../../context/GameContext';

interface GameCardProps {
  game: GameMetadata;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const { setActiveGameId, toggleFavorite, profile, stats } = useGame();
  const isFavorite = profile.favorites.includes(game.id);
  const gameStats = stats.gameStats[game.id];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Dice5': return <Dice5 className="w-7 h-7" />;
      case 'Crown': return <Crown className="w-7 h-7" />;
      case 'Grid3X3': return <Grid3X3 className="w-7 h-7" />;
      case 'Layers': return <Layers className="w-7 h-7" />;
      case 'Sparkles': return <Sparkles className="w-7 h-7" />;
      case 'Coins': return <Coins className="w-7 h-7" />;
      case 'Eye': return <Eye className="w-7 h-7" />;
      case 'Swords': return <Swords className="w-7 h-7" />;
      case 'Search': return <Search className="w-7 h-7" />;
      case 'FileQuestion': return <FileQuestion className="w-7 h-7" />;
      case 'HelpCircle': return <HelpCircle className="w-7 h-7" />;
      case 'Shuffle': return <Shuffle className="w-7 h-7" />;
      case 'Disc': return <Disc className="w-7 h-7" />;
      case 'CircleDot': return <CircleDot className="w-7 h-7" />;
      case 'ShieldCheck': return <ShieldCheck className="w-7 h-7" />;
      case 'Binary': return <Binary className="w-7 h-7" />;
      case 'Bomb': return <Bomb className="w-7 h-7" />;
      case 'LayoutGrid': return <LayoutGrid className="w-7 h-7" />;
      case 'Activity': return <Activity className="w-7 h-7" />;
      default: return <Zap className="w-7 h-7" />;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      case 'Medium': return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'Hard':
      case 'Expert': return 'text-rose-400 bg-rose-950/60 border-rose-500/30';
      default: return 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 shadow-xl overflow-hidden flex flex-col justify-between group transition-colors"
    >
      {/* Top Banner & Visual Artwork Accent */}
      <div className={`h-28 sm:h-32 bg-gradient-to-br ${game.accentGradient} p-4 relative overflow-hidden flex items-start justify-between`}>
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
        
        {/* Category & Badge */}
        <div className="relative z-10 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white border border-white/20">
            {game.category}
          </span>
          {game.isNew && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-sm">
              New
            </span>
          )}
          {game.isPopular && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/90 text-slate-950 shadow-sm font-bold">
              Popular
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          id={`fav-btn-${game.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(game.id);
          }}
          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer ${
            isFavorite
              ? 'bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/30'
              : 'bg-black/30 border-white/20 text-white/70 hover:text-white hover:bg-black/50'
          }`}
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* Center Floating Icon Art */}
        <div className="absolute -bottom-3 left-4 w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-750 shadow-xl flex items-center justify-center text-white group-hover:scale-105 group-hover:border-indigo-400 transition-all z-10">
          <div className="text-indigo-400">
            {getIcon(game.icon)}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 pt-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
              {game.name}
            </h3>
          </div>
          
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {game.description}
          </p>

          {/* Quick Specs Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
              <Users className="w-3 h-3 text-slate-400" />
              {game.players}
            </span>
            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${getDifficultyColor(game.difficulty)}`}>
              {game.difficulty}
            </span>
            {game.hasAI && (
              <span className="flex items-center gap-1 text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-500/30">
                <Bot className="w-3 h-3" />
                AI Opponent
              </span>
            )}
          </div>

          {/* Past Play Record if available */}
          {gameStats && gameStats.played > 0 && (
            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
              <span>Played: <strong className="text-slate-200">{gameStats.played}x</strong></span>
              <span>•</span>
              <span>Wins: <strong className="text-emerald-400">{gameStats.won}</strong></span>
              {gameStats.highScore > 0 && (
                <>
                  <span>•</span>
                  <span>High Score: <strong className="text-amber-400">{gameStats.highScore}</strong></span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Play Now Action CTA */}
        <button
          id={`play-btn-${game.id}`}
          onClick={() => setActiveGameId(game.id)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          Play Game
        </button>
      </div>
    </motion.div>
  );
};

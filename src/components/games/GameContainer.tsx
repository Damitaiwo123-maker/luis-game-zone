import React, { ReactNode } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Maximize2,
  Heart,
  Trophy,
  Users,
  Shield,
  Bot
} from 'lucide-react';
import { GameMetadata } from '../../types';
import { useGame } from '../../context/GameContext';

interface GameContainerProps {
  game: GameMetadata;
  children: ReactNode;
  onRestart?: () => void;
  score?: number | string;
  scoreLabel?: string;
  highScore?: number | string;
  turnText?: string;
  turnColor?: string;
  customHeaderControls?: ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  game,
  children,
  onRestart,
  score,
  scoreLabel = 'Score',
  highScore,
  turnText,
  turnColor = 'text-indigo-400',
  customHeaderControls,
}) => {
  const { setActiveGameId, toggleSound, profile, toggleFavorite, openInstructions } = useGame();
  const isFavorite = profile.favorites.includes(game.id);

  const handleBack = () => {
    setActiveGameId(null);
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col">
      
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800">
        
        {/* Left: Back Button & Game Title */}
        <div className="flex items-center gap-3">
          <button
            id="game-back-btn"
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs font-semibold"
            title="Back to All Games"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-lg sm:text-2xl text-white tracking-tight">
                {game.name}
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                {game.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {game.tagline}
            </p>
          </div>
        </div>

        {/* Center / Right: Live Status & Game Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
          
          {/* Status Indicators (Scores / Turns) */}
          {turnText && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-inner">
              <span className="text-slate-400 text-[11px]">Turn:</span>
              <span className={`font-bold ${turnColor}`}>{turnText}</span>
            </div>
          )}

          {score !== undefined && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-inner">
              <span className="text-slate-400 text-[11px]">{scoreLabel}:</span>
              <span className="font-bold text-amber-400 font-mono text-sm">{score}</span>
            </div>
          )}

          {highScore !== undefined && (
            <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 text-[11px]">Best:</span>
              <span className="font-bold text-slate-200 font-mono text-sm">{highScore}</span>
            </div>
          )}

          {/* Custom Game Specific Controls */}
          {customHeaderControls}

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            
            {/* Restart Button */}
            {onRestart && (
              <button
                id="game-restart-btn"
                onClick={onRestart}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all cursor-pointer"
                title="Restart / New Game"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Favorite Button */}
            <button
              id="game-toggle-favorite-btn"
              onClick={() => toggleFavorite(game.id)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
            </button>

            {/* Sound Toggle */}
            <button
              id="game-sound-toggle-btn"
              onClick={toggleSound}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all cursor-pointer"
              title={profile.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Instructions Modal Trigger */}
            <button
              id="game-instructions-btn"
              onClick={openInstructions}
              className="p-2 sm:p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Game Screen Canvas / Stage Area */}
      <div className="flex-1 mt-4 sm:mt-6 flex flex-col items-center justify-center relative">
        <div className="w-full flex flex-col items-center">
          {children}
        </div>
      </div>

    </div>
  );
};

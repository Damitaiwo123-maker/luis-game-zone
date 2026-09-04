import React from 'react';
import { Gamepad2, Heart, Shield, Sparkles, Trophy, Users, HelpCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { GAMES_CATALOG } from '../../data/games';

export const Footer: React.FC = () => {
  const { setActiveCategory, setActiveGameId, openProfile } = useGame();

  const handleGameLink = (id: string) => {
    setActiveGameId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCatLink = (cat: any) => {
    setActiveCategory(cat);
    setActiveGameId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-850 mt-16 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-850">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="font-display font-extrabold text-xl text-white tracking-tight">
                Game<span className="text-indigo-400">Zone</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
              The premier casual and multiplayer gaming hub. Play classic tabletop board games, card showdowns, word puzzles, and casual arcade classics anytime, anywhere with responsive AI bots and local multiplayer.
            </p>
            <div className="flex items-center gap-4 text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                No Ads / Zero Installs
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Instant Play
              </span>
            </div>
          </div>

          {/* Board & Card Games */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">
              Board & Card
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => handleGameLink('ludo')} className="hover:text-indigo-300 transition-colors">Ludo Classic</button></li>
              <li><button onClick={() => handleGameLink('chess')} className="hover:text-indigo-300 transition-colors">Chess Grandmaster</button></li>
              <li><button onClick={() => handleGameLink('scrabble')} className="hover:text-indigo-300 transition-colors">Scrabble Crafter</button></li>
              <li><button onClick={() => handleGameLink('solitaire')} className="hover:text-indigo-300 transition-colors">Klondike Solitaire</button></li>
              <li><button onClick={() => handleGameLink('color_clash')} className="hover:text-indigo-300 transition-colors">Color Clash (Uno)</button></li>
              <li><button onClick={() => handleGameLink('blackjack')} className="hover:text-indigo-300 transition-colors">Blackjack 21</button></li>
            </ul>
          </div>

          {/* Word & Casual Games */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">
              Word & Puzzles
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => handleGameLink('word_guess')} className="hover:text-indigo-300 transition-colors">Word Guess (Wordle)</button></li>
              <li><button onClick={() => handleGameLink('word_search')} className="hover:text-indigo-300 transition-colors">Word Search Quest</button></li>
              <li><button onClick={() => handleGameLink('hangman')} className="hover:text-indigo-300 transition-colors">Hangman Classic</button></li>
              <li><button onClick={() => handleGameLink('tictactoe')} className="hover:text-indigo-300 transition-colors">Tic-Tac-Toe Pro</button></li>
              <li><button onClick={() => handleGameLink('connect_four')} className="hover:text-indigo-300 transition-colors">Connect Four</button></li>
              <li><button onClick={() => handleGameLink('game_2048')} className="hover:text-indigo-300 transition-colors">2048 Neon</button></li>
              <li><button onClick={() => handleGameLink('snake')} className="hover:text-indigo-300 transition-colors">Neon Snake</button></li>
            </ul>
          </div>

          {/* Quick Categories & Profile */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">
              Hub Categories
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => handleCatLink('all')} className="hover:text-indigo-300 transition-colors">All 21+ Games</button></li>
              <li><button onClick={() => handleCatLink('board')} className="hover:text-indigo-300 transition-colors">Board Games</button></li>
              <li><button onClick={() => handleCatLink('card')} className="hover:text-indigo-300 transition-colors">Card Games</button></li>
              <li><button onClick={() => handleCatLink('word')} className="hover:text-indigo-300 transition-colors">Word Games</button></li>
              <li><button onClick={() => handleCatLink('casual')} className="hover:text-indigo-300 transition-colors">Casual & Puzzles</button></li>
              <li><button onClick={() => handleCatLink('multiplayer')} className="hover:text-indigo-300 transition-colors">Multiplayer Hub</button></li>
              <li><button onClick={openProfile} className="hover:text-amber-300 transition-colors">Profile & Achievements</button></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} GameZone. Built with modern web standards.</p>
          <div className="flex items-center gap-4">
            <span>Powered by React & Tailwind</span>
            <span>•</span>
            <span>Local & AI Opponents</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

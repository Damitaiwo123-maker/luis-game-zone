import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, Grid, Compass, Heart, Users, Sparkles, Layers, Grid3X3, Flame } from 'lucide-react';
import { GameMetadata, GameCategory } from '../../types';
import { GAMES_CATALOG } from '../../data/games';
import { GameCard } from './GameCard';
import { useGame } from '../../context/GameContext';

type SortOption = 'popular' | 'newest' | 'alphabetical' | 'difficulty-easy' | 'difficulty-hard' | 'multiplayer';

export const GameGrid: React.FC = () => {
  const { activeCategory, setActiveCategory, searchQuery, setSearchQuery, profile } = useGame();
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [playerFilter, setPlayerFilter] = useState<'all' | 'single' | 'multi'>('all');

  const categories: { id: GameCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Games', icon: <Compass className="w-4 h-4" /> },
    { id: 'racing', label: 'Racing 3D', icon: <Flame className="w-4 h-4 text-pink-400" /> },
    { id: 'aim', label: 'Aim Trainer', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
    { id: 'fps', label: 'FPS 3D', icon: <Flame className="w-4 h-4 text-indigo-400" /> },
    { id: 'arcade', label: 'Arcade', icon: <Layers className="w-4 h-4 text-amber-400" /> },
    { id: 'action', label: 'Action', icon: <Grid className="w-4 h-4 text-emerald-400" /> },
    { id: 'board', label: 'Board Games', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'card', label: 'Card Games', icon: <Layers className="w-4 h-4" /> },
    { id: 'word', label: 'Word Games', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'casual', label: 'Casual & Puzzle', icon: <Flame className="w-4 h-4" /> },
    { id: 'multiplayer', label: 'Multiplayer', icon: <Users className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
  ];

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let list = [...GAMES_CATALOG];

    // Category filter
    if (activeCategory === 'racing') list = list.filter(g => g.category === 'racing');
    else if (activeCategory === 'aim') list = list.filter(g => g.category === 'aim');
    else if (activeCategory === 'fps') list = list.filter(g => g.category === 'fps');
    else if (activeCategory === 'arcade') list = list.filter(g => g.category === 'arcade');
    else if (activeCategory === 'action') list = list.filter(g => g.category === 'action');
    else if (activeCategory === 'board') list = list.filter(g => g.category === 'board');
    else if (activeCategory === 'card') list = list.filter(g => g.category === 'card');
    else if (activeCategory === 'word') list = list.filter(g => g.category === 'word');
    else if (activeCategory === 'casual') list = list.filter(g => g.category === 'casual');
    else if (activeCategory === 'multiplayer') list = list.filter(g => g.isMultiplayer);
    else if (activeCategory === 'favorites') list = list.filter(g => profile.favorites.includes(g.id));

    // Player filter
    if (playerFilter === 'single') list = list.filter(g => g.minPlayers === 1);
    else if (playerFilter === 'multi') list = list.filter(g => g.isMultiplayer);

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        g =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tagline.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'difficulty-easy') {
      const diffMap: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 };
      list.sort((a, b) => diffMap[a.difficulty] - diffMap[b.difficulty]);
    } else if (sortBy === 'difficulty-hard') {
      const diffMap: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 };
      list.sort((a, b) => diffMap[b.difficulty] - diffMap[a.difficulty]);
    } else if (sortBy === 'multiplayer') {
      list.sort((a, b) => (b.isMultiplayer ? 1 : 0) - (a.isMultiplayer ? 1 : 0));
    }

    return list;
  }, [activeCategory, playerFilter, searchQuery, sortBy, profile.favorites]);

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'racing': return '3D Arcade Racing';
      case 'aim': return 'Precision Aim Trainers';
      case 'fps': return '3D First-Person Arena Shooters';
      case 'arcade': return 'Arcade Classics';
      case 'action': return 'Action & Combat Games';
      case 'board': return 'Board Games';
      case 'card': return 'Card Games';
      case 'word': return 'Word & Vocabulary Games';
      case 'casual': return 'Casual & Puzzle Games';
      case 'multiplayer': return 'Multiplayer & AI Duel Games';
      case 'favorites': return 'Your Favorite Games';
      default: return 'All Playable Games';
    }
  };

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Category Pills Slider & Controls Header */}
      <div className="space-y-4 mb-8">
        
        {/* Horizontal Category Nav */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`grid-category-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5">
              <span>{getCategoryTitle()}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300">
                {filteredGames.length} Available
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-400">Sort by:</span>
              <select
                id="sort-games-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
                <option value="newest" className="bg-slate-900 text-white">Newest Games</option>
                <option value="alphabetical" className="bg-slate-900 text-white">A – Z Alphabetical</option>
                <option value="difficulty-easy" className="bg-slate-900 text-white">Difficulty: Easy first</option>
                <option value="difficulty-hard" className="bg-slate-900 text-white">Difficulty: Hard first</option>
                <option value="multiplayer" className="bg-slate-900 text-white">Multiplayer</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Games Cards Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">No Games Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? `No games matching "${searchQuery}". Try searching for Chess, Ludo, Solitaire, or 2048.`
              : 'You have not added any games to this category yet.'}
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="mt-5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-indigo-600/30"
          >
            Show All Games
          </button>
        </div>
      )}

    </section>
  );
};

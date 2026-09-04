import React, { useState } from 'react';
import {
  Gamepad2,
  Search,
  Volume2,
  VolumeX,
  User,
  Heart,
  Menu,
  X,
  Flame,
  Layers,
  Sparkles,
  Grid3X3,
  Users,
  Compass,
  LogIn,
  Coins,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { GameCategory } from '../../types';

export const Navbar: React.FC = () => {
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    profile,
    toggleSound,
    openProfile,
    openAuthModal,
    user,
    isAuthenticated,
    setActiveGameId,
    activeGameId,
  } = useGame();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navCategories: { id: GameCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Games', icon: <Compass className="w-4 h-4" /> },
    { id: 'racing', label: 'Racing 3D', icon: <Flame className="w-4 h-4 text-pink-400" /> },
    { id: 'aim', label: 'Aim Trainer', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
    { id: 'fps', label: 'FPS 3D', icon: <Flame className="w-4 h-4 text-indigo-400" /> },
    { id: 'arcade', label: 'Arcade', icon: <Layers className="w-4 h-4 text-amber-400" /> },
    { id: 'action', label: 'Action', icon: <Gamepad2 className="w-4 h-4 text-emerald-400" /> },
    { id: 'board', label: 'Board', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'card', label: 'Cards', icon: <Layers className="w-4 h-4" /> },
    { id: 'word', label: 'Words', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'casual', label: 'Casual', icon: <Flame className="w-4 h-4" /> },
    { id: 'multiplayer', label: 'Multiplayer', icon: <Users className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
  ];

  const handleCategoryClick = (catId: GameCategory) => {
    setActiveCategory(catId);
    if (activeGameId) {
      setActiveGameId(null);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setActiveGameId(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <button
            id="gamezone-logo-btn"
            onClick={handleLogoClick}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  Game<span className="text-indigo-400">Zone</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-500/40 text-indigo-300">
                  Hub
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-slate-400 tracking-wide">
                Classic & Casual Arcade
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-slate-800">
            {navCategories.map(cat => {
              const isActive = activeCategory === cat.id && !activeGameId;
              return (
                <button
                  key={cat.id}
                  id={`nav-category-${cat.id}`}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  {cat.id === 'favorites' && profile.favorites.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500/80 text-[10px] font-bold flex items-center justify-center text-white">
                      {profile.favorites.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Search Bar & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Input (Desktop) */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <input
                id="search-games-input"
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-750 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              id="mobile-search-toggle"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
              title="Search Games"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Sound Toggle */}
            <button
              id="toggle-sound-btn"
              onClick={toggleSound}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                profile.soundEnabled
                  ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40'
                  : 'bg-slate-900/50 border-slate-800/50 text-slate-500 hover:text-slate-400'
              }`}
              title={profile.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Coins Counter */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile.coins || 250}</span>
            </div>

            {/* Sign In Button (When not logged in) or User Profile Button */}
            {!isAuthenticated ? (
              <button
                id="navbar-signin-btn"
                onClick={openAuthModal}
                className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                id="open-profile-btn"
                onClick={openProfile}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm shadow-inner relative">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    profile.avatar
                  )}
                  {user?.provider === 'google' && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white leading-tight flex items-center gap-1">
                    {profile.username}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold leading-tight flex items-center gap-1">
                    ★ Lvl {profile.level} {user?.provider === 'google' && '• Google'}
                  </span>
                </div>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {isSearchOpen && (
          <div className="md:hidden py-3 border-t border-slate-800">
            <div className="relative">
              <input
                id="mobile-search-input"
                type="text"
                placeholder="Search all classic and casual games..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-1 shadow-2xl animate-in slide-in-from-top duration-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2">
            Categories
          </p>
          {navCategories.map(cat => {
            const isActive = activeCategory === cat.id && !activeGameId;
            return (
              <button
                key={cat.id}
                id={`mobile-nav-${cat.id}`}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {cat.icon}
                  {cat.label}
                </div>
                {cat.id === 'favorites' && profile.favorites.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-xs font-bold flex items-center justify-center text-white">
                    {profile.favorites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

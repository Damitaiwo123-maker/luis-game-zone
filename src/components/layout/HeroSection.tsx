import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Users, Trophy, Flame, Crown, Shield, Zap, Search } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { GAMES_CATALOG } from '../../data/games';

export const HeroSection: React.FC = () => {
  const { setActiveGameId, setActiveCategory, setSearchQuery } = useGame();

  const handlePlayNow = () => {
    // Launch primary featured game (Ludo or Chess)
    setActiveGameId('ludo');
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-10 sm:pt-10 sm:pb-14 border-b border-slate-850">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>30+ Full Action, 3D Racing, Aim Arena, Arcade & Board Games</span>
            </div>

            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white font-display leading-[1.15]">
              Play Instant <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-pink-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Action, Racing & Arcade
              </span> Games.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Drift through futuristic 3D circuits in Turbo Kart Rush, train tournament reflexes in Aim Arena Pro, storm cyber droids in Neon Strike FPS, or play classic Chess, Ludo, and Color Clash with friends!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                id="hero-play-now-btn"
                onClick={() => setActiveGameId('turbo_kart')}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-pink-600/30 hover:shadow-pink-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                Play Turbo Kart 3D
              </button>

              <button
                id="hero-explore-aim-btn"
                onClick={() => setActiveGameId('aim_arena')}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 hover:text-white font-semibold text-sm sm:text-base flex items-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                Aim Arena Pro
              </button>
            </div>

            {/* Popular Quick Tags */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 flex-wrap text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Trending:</span>
              {[
                { label: '🏎️ Turbo Kart', id: 'turbo_kart' },
                { label: '🎯 Aim Trainer', id: 'aim_arena' },
                { label: '🔫 Neon Strike FPS', id: 'neon_strike' },
                { label: '🚀 Galaxy Defender', id: 'galaxy_defender' },
                { label: '⚡ Cyber Sprint', id: 'cyber_sprint' },
                { label: '♟ Chess', id: 'chess' },
                { label: '🎲 Ludo', id: 'ludo' },
              ].map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setActiveGameId(tag.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-pink-500/50 hover:text-pink-300 transition-colors cursor-pointer"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Featured Game Cards Bento Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-4">
            
            {/* Card 1: Turbo Kart */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveGameId('turbo_kart')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-pink-950/70 to-slate-900/90 border border-pink-500/30 hover:border-pink-500/60 shadow-xl cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400">3D Racing</span>
              <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">Turbo Kart Rush</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">High-speed 3D kart racing with nitro drift boosts & AI rivals.</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-pink-400 font-semibold">
                Race Now →
              </div>
            </motion.div>

            {/* Card 2: Aim Arena Pro */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveGameId('aim_arena')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/60 shadow-xl cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Precision Skill</span>
              <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">Aim Arena Pro</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Microsecond reaction tests, flick shots & combo streaks.</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-cyan-400 font-semibold">
                Train Aim →
              </div>
            </motion.div>

            {/* Card 3: Neon Strike FPS */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveGameId('neon_strike')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/60 shadow-xl cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">3D Shooter</span>
              <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">Neon Strike Arena</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">First-person 3D sci-fi arena with multi-weapon loadouts.</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                Enter Arena →
              </div>
            </motion.div>

            {/* Card 4: Galaxy Defender */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setActiveGameId('galaxy_defender')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/70 to-slate-900/90 border border-purple-500/30 hover:border-purple-500/60 shadow-xl cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Space Arcade</span>
              <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">Galaxy Defender</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Blast alien armada formations & flagship bosses in space.</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-purple-400 font-semibold">
                Launch Ship →
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
};

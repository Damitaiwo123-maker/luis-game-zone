import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crosshair,
  Shield,
  Heart,
  RotateCcw,
  MousePointer,
  Target,
  Sparkles,
  HelpCircle,
  X,
  Play,
  Flame,
  Smartphone,
  Keyboard,
  Award,
} from 'lucide-react';
import { GameModeId, GAME_MODES, WeaponId, WEAPON_REGISTRY } from '../types';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy?: () => void;
  activeModeId: GameModeId;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  onDeploy,
  activeModeId,
}) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile' | 'tactics'>('desktop');
  const currentMode = GAME_MODES.find((m) => m.id === activeModeId) || GAME_MODES[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Bar Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                  TACTICAL FIELD MANUAL
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    How to Play
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Master movement, precision shooting, and combat tactics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Objective Banner */}
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-black text-amber-400 uppercase tracking-wider">Active Mission:</span>
              <span className="font-bold text-white">{currentMode.name}</span>
              <span className="hidden sm:inline text-slate-400">— {currentMode.description}</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-500/40">
              {currentMode.badge}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-5 gap-2 pt-2">
            <button
              onClick={() => setActiveTab('desktop')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'desktop'
                  ? 'border-cyan-400 text-cyan-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-4 h-4" /> Desktop Controls
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'mobile'
                  ? 'border-cyan-400 text-cyan-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile & Touch
            </button>
            <button
              onClick={() => setActiveTab('tactics')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'tactics'
                  ? 'border-cyan-400 text-cyan-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" /> Tactics & Pickups
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-300">
            {activeTab === 'desktop' && (
              <div className="space-y-4">
                {/* Movement Controls */}
                <div>
                  <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <Keyboard className="w-3.5 h-3.5" /> 1. Operative Movement
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-black text-xs border border-slate-700">W</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-black text-xs border border-slate-700">A</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-black text-xs border border-slate-700">S</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-black text-xs border border-slate-700">D</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold mt-1.5">Move Operative</p>
                      <p className="text-[10px] text-slate-500">Walk forward, backward, left, right</p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-black text-xs border border-slate-700">SHIFT</span>
                      <p className="text-[11px] text-slate-300 font-semibold mt-1.5">Tactical Sprint</p>
                      <p className="text-[10px] text-slate-500">Boost run speed for quick repositioning</p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-black text-xs border border-slate-700">SPACE</span>
                      <p className="text-[11px] text-slate-300 font-semibold mt-1.5">Jump</p>
                      <p className="text-[10px] text-slate-500">Vault over curbs, barriers, crates</p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-black text-xs border border-slate-700">C</span>
                      <p className="text-[11px] text-slate-300 font-semibold mt-1.5">Crouch</p>
                      <p className="text-[10px] text-slate-500">Take cover behind barriers and cars</p>
                    </div>
                  </div>
                </div>

                {/* Aiming & Shooting Controls */}
                <div>
                  <h4 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <Crosshair className="w-3.5 h-3.5" /> 2. Aiming & Weapon Combat
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                      <div className="flex items-center gap-1">
                        <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-black text-xs border border-slate-700">MOUSE</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold mt-1.5">Look & Turn</p>
                      <p className="text-[10px] text-slate-500">Rotate camera & line up targets</p>
                    </div>

                    <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-2.5">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-black text-xs border border-cyan-500/40">RIGHT CLICK</span>
                      <p className="text-[11px] text-cyan-200 font-semibold mt-1.5">Precision Aim (ADS)</p>
                      <p className="text-[10px] text-slate-400">Zooms in, stabilizes recoil & spread</p>
                    </div>

                    <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-2.5">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-black text-xs border border-red-500/40">LEFT CLICK</span>
                        <span className="text-[10px] text-slate-400">or</span>
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-black text-xs border border-red-500/40">Z</span>
                      </div>
                      <p className="text-[11px] text-red-200 font-semibold mt-1.5">Shoot Gun</p>
                      <p className="text-[10px] text-slate-400">Fires equipped weapon</p>
                    </div>

                    <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-black text-xs border border-amber-500/40">R</span>
                      <p className="text-[11px] text-amber-200 font-semibold mt-1.5">Reload Gun</p>
                      <p className="text-[10px] text-slate-400">Refill magazine from ammo reserve</p>
                    </div>
                  </div>
                </div>

                {/* Weapon Hotkeys 1-6 */}
                <div>
                  <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <Target className="w-3.5 h-3.5" /> 3. Weapon Arsenal Hotkeys (1 - 6)
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                      <span className="text-xs font-black text-purple-300">[1]</span>
                      <p className="text-[11px] font-bold text-white mt-0.5">Pistol</p>
                      <p className="text-[9px] text-slate-400">High mobility</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                      <span className="text-xs font-black text-purple-300">[2]</span>
                      <p className="text-[11px] font-bold text-white mt-0.5">Rifle</p>
                      <p className="text-[9px] text-slate-400">All-rounder</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                      <span className="text-xs font-black text-purple-300">[3]</span>
                      <p className="text-[11px] font-bold text-white mt-0.5">SMG</p>
                      <p className="text-[9px] text-slate-400">Rapid fire</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                      <span className="text-xs font-black text-purple-300">[4]</span>
                      <p className="text-[11px] font-bold text-white mt-0.5">Shotgun</p>
                      <p className="text-[9px] text-slate-400">Close range</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                      <span className="text-xs font-black text-purple-300">[5]</span>
                      <p className="text-[11px] font-bold text-white mt-0.5">Sniper</p>
                      <p className="text-[9px] text-slate-400">Long range</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                      <span className="text-xs font-black text-purple-300">[6]</span>
                      <p className="text-[11px] font-bold text-white mt-0.5">Bazooka</p>
                      <p className="text-[9px] text-slate-400">Explosive AoE</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <h4 className="font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" /> Touch Screen Layout
                  </h4>
                  <ul className="space-y-2 text-slate-300 text-[11px]">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                      <span><strong>Left Virtual Joystick:</strong> Drag anywhere on the lower left side of your screen to walk your human operative smoothly in 360 degrees.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                      <span><strong>Right Look Surface:</strong> Swipe freely on the upper/right side of the screen to rotate your view and track targets.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-950 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                      <span><strong>Right Action Buttons:</strong> Large red <strong>FIRE</strong> button to shoot, blue <strong>AIM</strong> button to toggle precision ADS zoom, plus Jump, Crouch, Sprint, and Reload buttons.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                      <span><strong>Weapon Wheel:</strong> Tap the circular weapon selector icon to switch firearms on the fly without needing a keyboard.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'tactics' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Combat Survival & Collectibles
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-300">Medkit (+40 HP)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Restores operative health when damaged by gunfire.</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-300">Armor Shield (+50 AP)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Absorbs 60% of incoming damage before health is hit.</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-300">Ammo Crate (+60 Rounds)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Replenishes reserve magazines for your guns.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <h5 className="text-xs font-black text-white uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> Tactical Cover & Critical Hits
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Headshots deliver a <strong>2.5x critical damage multiplier</strong> and gold hitmarker! 
                    Duck behind street barriers, park benches, and vehicles to break enemy line-of-sight and reload safely.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Close Manual
            </button>

            {onDeploy && (
              <button
                onClick={() => {
                  onClose();
                  onDeploy();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition"
              >
                <Play className="w-4 h-4 fill-black" /> Deploy Mission Now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

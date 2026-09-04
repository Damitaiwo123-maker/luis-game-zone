import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, Target, Zap, Flame, Eye, Sparkles, Shield, X } from 'lucide-react';
import { WeaponId, WEAPON_REGISTRY, WEAPON_ORDER } from '../types';

interface WeaponWheelModalProps {
  isOpen: boolean;
  activeWeaponId: WeaponId;
  onSelectWeapon: (weaponId: WeaponId) => void;
  onClose: () => void;
  opacity?: number;
}

const WEAPON_ICONS: Record<WeaponId, React.ElementType> = {
  pistol: Crosshair,
  rifle: Target,
  smg: Zap,
  shotgun: Flame,
  sniper: Eye,
  bazooka: Sparkles,
  machinegun: Shield,
};

export const WeaponWheelModal: React.FC<WeaponWheelModalProps> = ({
  isOpen,
  activeWeaponId,
  onSelectWeapon,
  onClose,
  opacity = 0.95,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="weapon-wheel-overlay"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto select-none"
      >
        <motion.div
          id="weapon-wheel-card"
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)]"
          style={{ opacity }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">Weapon Armory</h3>
              <p className="text-[11px] text-slate-400">Tap to equip instant armament</p>
            </div>
            <button
              id="close-weapon-wheel-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Weapon Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
            {WEAPON_ORDER.map((wId, index) => {
              const weapon = WEAPON_REGISTRY[wId];
              const IconComp = WEAPON_ICONS[wId] || Target;
              const isCurrent = wId === activeWeaponId;

              return (
                <button
                  key={wId}
                  id={`weapon-wheel-item-${wId}`}
                  onClick={() => {
                    onSelectWeapon(wId);
                    onClose();
                  }}
                  className={`relative flex flex-col items-start p-3 rounded-2xl border transition-all text-left ${
                    isCurrent
                      ? 'bg-gradient-to-br from-cyan-950/80 to-blue-900/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: `${weapon.color}25`, color: weapon.color }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">[{index + 1}]</span>
                  </div>

                  <span className="text-xs font-black text-white truncate w-full">{weapon.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-medium text-slate-400 truncate w-full">{weapon.category}</span>

                  <div className="flex items-center justify-between w-full mt-2 pt-1.5 border-t border-slate-700/50 text-[10px]">
                    <span className="text-slate-400">DMG: <strong className="text-red-400">{weapon.stats.damage}</strong></span>
                    <span className="text-slate-400">MAG: <strong className="text-cyan-400">{weapon.magSize}</strong></span>
                  </div>

                  {isCurrent && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

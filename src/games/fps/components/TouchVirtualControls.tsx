import React, { useRef, useState, useCallback } from 'react';
import { Crosshair, Eye, RotateCcw, ArrowUp, ArrowDown, Zap, Layers } from 'lucide-react';
import { WeaponId, WEAPON_REGISTRY } from '../types';
import { ControlSettings } from '../controlSettings';

interface TouchVirtualControlsProps {
  onJoystickMove: (vector: { x: number; y: number }) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onShootStart: () => void;
  onShootEnd: () => void;
  onAimToggle: () => void;
  onJump: () => void;
  onCrouchToggle: () => void;
  onSprintToggle: () => void;
  onReload: () => void;
  onOpenWeaponWheel: () => void;
  activeWeaponId: WeaponId;
  isAiming: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isReloading: boolean;
  settings: ControlSettings;
}

export const TouchVirtualControls: React.FC<TouchVirtualControlsProps> = ({
  onJoystickMove,
  onLookDelta,
  onShootStart,
  onShootEnd,
  onAimToggle,
  onJump,
  onCrouchToggle,
  onSprintToggle,
  onReload,
  onOpenWeaponWheel,
  activeWeaponId,
  isAiming,
  isCrouching,
  isSprinting,
  isReloading,
  settings,
}) => {
  // Joystick State
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  // Look Surface Touch Tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick Dimensions based on settings
  const joystickDimensions =
    settings.joystickSize === 'small'
      ? { baseSize: 104, maxRadius: 38, knobSize: 44 }
      : settings.joystickSize === 'large'
      ? { baseSize: 156, maxRadius: 62, knobSize: 62 }
      : { baseSize: 130, maxRadius: 50, knobSize: 52 };

  // Action Button Dimensions based on settings
  const isLargeButtons = settings.buttonSize === 'large';
  const shootBtnSize = isLargeButtons ? 'w-20 h-20' : 'w-16 h-16';
  const subBtnSize = isLargeButtons ? 'w-13 h-13' : 'w-11 h-11';

  // --- JOYSTICK TOUCH HANDLERS ---
  const handleJoystickTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (joystickTouchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      joystickTouchIdRef.current = touch.identifier;
      setIsJoystickActive(true);

      if (joystickBaseRef.current) {
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rawDx = touch.clientX - centerX;
        const rawDy = touch.clientY - centerY;
        const dist = Math.hypot(rawDx, rawDy);
        const maxR = joystickDimensions.maxRadius;
        const clampedDist = Math.min(dist, maxR);
        const angle = Math.atan2(rawDy, rawDx);

        const nx = Math.cos(angle) * (clampedDist / maxR);
        const ny = Math.sin(angle) * (clampedDist / maxR);

        setKnobPos({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        onJoystickMove({ x: nx, y: ny });
      }
    },
    [joystickDimensions.maxRadius, onJoystickMove]
  );

  const handleJoystickTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (joystickTouchIdRef.current === null || !joystickBaseRef.current) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchIdRef.current) {
          const rect = joystickBaseRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const rawDx = touch.clientX - centerX;
          const rawDy = touch.clientY - centerY;
          const dist = Math.hypot(rawDx, rawDy);
          const maxR = joystickDimensions.maxRadius;
          const clampedDist = Math.min(dist, maxR);
          const angle = Math.atan2(rawDy, rawDx);

          const nx = Math.cos(angle) * (clampedDist / maxR);
          const ny = Math.sin(angle) * (clampedDist / maxR);

          setKnobPos({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
          onJoystickMove({ x: nx, y: ny });
          break;
        }
      }
    },
    [joystickDimensions.maxRadius, onJoystickMove]
  );

  const handleJoystickTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (joystickTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          setIsJoystickActive(false);
          setKnobPos({ x: 0, y: 0 });
          onJoystickMove({ x: 0, y: 0 });
          break;
        }
      }
    },
    [onJoystickMove]
  );

  // --- LOOK SURFACE TOUCH HANDLERS ---
  const handleLookTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (lookTouchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === lookTouchIdRef.current) {
          const dx = touch.clientX - lastLookPosRef.current.x;
          const dy = touch.clientY - lastLookPosRef.current.y;
          lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };

          const sens = (isAiming ? settings.aimSensitivity : settings.cameraSensitivity) * 0.0035;
          onLookDelta(dx * sens, dy * sens);
          break;
        }
      }
    },
    [isAiming, onLookDelta, settings.aimSensitivity, settings.cameraSensitivity]
  );

  const handleLookTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  const activeWeapon = WEAPON_REGISTRY[activeWeaponId] || WEAPON_REGISTRY.rifle;

  return (
    <div
      id="touch-controls-layer"
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden"
      style={{ opacity: settings.buttonOpacity }}
    >
      {/* ========================================================= */}
      {/* 1. RIGHT-SIDE FULL TOUCH LOOK & AIM SURFACE */}
      {/* ========================================================= */}
      <div
        id="touch-look-surface"
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto z-10 touch-none"
      />

      {/* ========================================================= */}
      {/* 2. BOTTOM-LEFT MOVEMENT VIRTUAL JOYSTICK */}
      {/* ========================================================= */}
      <div
        id="touch-joystick-container"
        className="absolute bottom-6 left-6 pointer-events-auto z-20 flex flex-col items-center touch-none"
      >
        <div
          ref={joystickBaseRef}
          id="virtual-joystick-base"
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative rounded-full border-2 border-cyan-500/50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
          style={{
            width: `${joystickDimensions.baseSize}px`,
            height: `${joystickDimensions.baseSize}px`,
          }}
        >
          {/* Compass / Cross Axis Markers */}
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />
          <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/20" />

          {/* Directional Arrows */}
          <span className="absolute top-1 text-[8px] font-black text-cyan-400/60">▲</span>
          <span className="absolute bottom-1 text-[8px] font-black text-cyan-400/60">▼</span>
          <span className="absolute left-1 text-[8px] font-black text-cyan-400/60">◀</span>
          <span className="absolute right-1 text-[8px] font-black text-cyan-400/60">▶</span>

          {/* Inner Moveable Knob */}
          <div
            id="virtual-joystick-knob"
            className={`rounded-full shadow-lg transition-transform flex items-center justify-center ${
              isJoystickActive
                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 ring-2 ring-cyan-300 shadow-[0_0_15px_#38bdf8]'
                : 'bg-gradient-to-br from-cyan-600/80 to-blue-800/80 border border-cyan-400/50'
            }`}
            style={{
              width: `${joystickDimensions.knobSize}px`,
              height: `${joystickDimensions.knobSize}px`,
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white/60 shadow-inner" />
          </div>
        </div>

        <span className="mt-1.5 text-[9px] font-black tracking-wider text-cyan-400 uppercase drop-shadow">
          MOVE JOYSTICK
        </span>
      </div>

      {/* ========================================================= */}
      {/* 3. BOTTOM-RIGHT ACTION BUTTONS CLUSTER */}
      {/* ========================================================= */}
      <div
        id="touch-actions-cluster"
        className="absolute bottom-6 right-6 pointer-events-auto z-20 flex flex-col items-end gap-2.5 touch-none"
      >
        {/* Upper Row: Weapon Drawer Trigger & Sprint */}
        <div className="flex items-center gap-2">
          {/* Quick Weapon Wheel Button */}
          <button
            id="touch-weapon-wheel-btn"
            onTouchStart={(e) => {
              e.stopPropagation();
              onOpenWeaponWheel();
            }}
            onClick={onOpenWeaponWheel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-cyan-500/50 text-white shadow-lg active:scale-90 transition backdrop-blur-md"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-black">{activeWeapon.name.split(' ')[0]}</span>
          </button>

          {/* Sprint Button */}
          <button
            id="touch-sprint-btn"
            onTouchStart={(e) => {
              e.stopPropagation();
              onSprintToggle();
            }}
            className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all active:scale-90 shadow-lg ${
              isSprinting
                ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-[0_0_15px_#f59e0b]'
                : 'bg-slate-900/80 text-amber-400 border-amber-500/40'
            }`}
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>

        {/* Lower Row: Aim, Jump, Crouch, Reload, Shoot */}
        <div className="flex items-end gap-2.5">
          {/* Secondary Stack (Crouch, Jump, Reload) */}
          <div className="flex flex-col gap-2">
            {/* Crouch Button */}
            <button
              id="touch-crouch-btn"
              onTouchStart={(e) => {
                e.stopPropagation();
                onCrouchToggle();
              }}
              className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all active:scale-90 shadow-md ${
                isCrouching
                  ? 'bg-cyan-600 text-white border-cyan-400 ring-1 ring-cyan-300 shadow-[0_0_10px_#06b6d4]'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/80'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            {/* Jump Button */}
            <button
              id="touch-jump-btn"
              onTouchStart={(e) => {
                e.stopPropagation();
                onJump();
              }}
              className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-cyan-400 backdrop-blur-md shadow-md active:scale-90 transition"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Reload Button */}
            <button
              id="touch-reload-btn"
              onTouchStart={(e) => {
                e.stopPropagation();
                onReload();
              }}
              className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all active:scale-90 shadow-md ${
                isReloading
                  ? 'bg-amber-600 text-white border-amber-400 animate-spin'
                  : 'bg-slate-900/80 text-amber-400 border-amber-500/40'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Aim (ADS) Button */}
          <button
            id="touch-aim-btn"
            onTouchStart={(e) => {
              e.stopPropagation();
              onAimToggle();
            }}
            className={`rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center gap-1 transition-all active:scale-90 shadow-lg ${
              subBtnSize
            } ${
              isAiming
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_20px_#38bdf8]'
                : 'bg-slate-900/85 text-cyan-400 border-cyan-500/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-tight">AIM</span>
          </button>

          {/* Primary SHOOT Button */}
          <button
            id="touch-shoot-btn"
            onTouchStart={(e) => {
              e.stopPropagation();
              onShootStart();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onShootEnd();
            }}
            onTouchCancel={(e) => {
              e.stopPropagation();
              onShootEnd();
            }}
            className={`rounded-3xl border-2 border-red-400 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white flex flex-col items-center justify-center gap-1 shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-90 transition-all active:shadow-[0_0_35px_rgba(239,68,68,0.8)] ${
              shootBtnSize
            }`}
          >
            <Crosshair className="w-6 h-6 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">SHOOT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

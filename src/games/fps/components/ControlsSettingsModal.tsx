import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Volume2, VolumeX, RotateCcw, Smartphone, Check } from 'lucide-react';
import { ControlSettings, DEFAULT_CONTROL_SETTINGS } from '../controlSettings';

interface ControlsSettingsModalProps {
  isOpen: boolean;
  settings: ControlSettings;
  onUpdateSettings?: (newSettings: ControlSettings) => void;
  onSaveSettings?: (newSettings: ControlSettings) => void;
  onClose: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const ControlsSettingsModal: React.FC<ControlsSettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onSaveSettings,
  onClose,
  isMuted = false,
  onToggleMute,
}) => {
  if (!isOpen) return null;

  const update = (newSettings: ControlSettings) => {
    if (onUpdateSettings) onUpdateSettings(newSettings);
    else if (onSaveSettings) onSaveSettings(newSettings);
  };

  const handleReset = () => {
    update({ ...DEFAULT_CONTROL_SETTINGS });
  };

  return (
    <AnimatePresence>
      <div
        id="controls-settings-overlay"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto select-none"
      >
        <motion.div
          id="controls-settings-card"
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white">Controls & Gameplay Settings</h3>
                <p className="text-xs text-slate-400">Tune on-screen controls, sensitivity, and audio</p>
              </div>
            </div>
            <button
              id="close-controls-settings-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="space-y-5 mt-5">
            {/* 1. Mobile Joystick Size */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" /> Virtual Joystick Size
                </span>
                <span className="text-[11px] font-bold text-cyan-400 uppercase">{settings.joystickSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    id={`joystick-size-btn-${size}`}
                    onClick={() => update({ ...settings, joystickSize: size })}
                    className={`py-2 px-3 rounded-xl text-xs font-black capitalize transition border ${
                      settings.joystickSize === size
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Action Buttons Size & Opacity */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200">Action Buttons Size</span>
                <div className="flex gap-2">
                  {(['normal', 'large'] as const).map((bSize) => (
                    <button
                      key={bSize}
                      id={`button-size-btn-${bSize}`}
                      onClick={() => update({ ...settings, buttonSize: bSize })}
                      className={`py-1.5 px-3 rounded-xl text-xs font-black capitalize transition border ${
                        settings.buttonSize === bSize
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {bSize}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>Controls Opacity</span>
                  <span className="text-cyan-400 font-mono">{Math.round(settings.buttonOpacity * 100)}%</span>
                </div>
                <input
                  id="controls-opacity-slider"
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={settings.buttonOpacity}
                  onChange={(e) => update({ ...settings, buttonOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Sensitivities */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>Camera Look Sensitivity</span>
                  <span className="text-cyan-400 font-mono">{settings.cameraSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  id="camera-sensitivity-slider"
                  type="range"
                  min="0.4"
                  max="2.6"
                  step="0.1"
                  value={settings.cameraSensitivity}
                  onChange={(e) => update({ ...settings, cameraSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>ADS Aiming Sensitivity</span>
                  <span className="text-cyan-400 font-mono">{settings.aimSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  id="aim-sensitivity-slider"
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={settings.aimSensitivity}
                  onChange={(e) => update({ ...settings, aimSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Audio & Mute */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Audio & Sound FX</h4>
                  <p className="text-[11px] text-slate-400">{isMuted ? 'All sounds muted' : '3D Spatial audio enabled'}</p>
                </div>
              </div>
              <button
                id="toggle-audio-mute-btn"
                onClick={onToggleMute}
                className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md'
                }`}
              >
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
            <button
              id="reset-controls-settings-btn"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button
              id="save-controls-settings-btn"
              onClick={onClose}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition shadow-lg shadow-cyan-500/30"
            >
              <Check className="w-4 h-4" /> Apply & Resume
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

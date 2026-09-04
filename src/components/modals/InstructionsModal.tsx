import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, CheckCircle2, MousePointer, Lightbulb } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const InstructionsModal: React.FC = () => {
  const { activeGame, isInstructionsOpen, closeInstructions } = useGame();

  if (!isInstructionsOpen || !activeGame) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  How to Play: {activeGame.name}
                </h3>
                <span className="text-xs text-slate-400">
                  Official Rules & Controls
                </span>
              </div>
            </div>

            <button
              id="close-instructions-modal-btn"
              onClick={closeInstructions}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
            
            {/* Overview */}
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 mb-2">
                Overview
              </h4>
              <p className="leading-relaxed text-slate-200">
                {activeGame.instructions.overview}
              </p>
            </div>

            {/* Rules List */}
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 mb-2.5">
                Game Rules
              </h4>
              <ul className="space-y-2">
                {activeGame.instructions.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Controls */}
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 mb-2.5">
                Controls & Navigation
              </h4>
              <ul className="space-y-2">
                {activeGame.instructions.controls.map((control, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <MousePointer className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{control}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategy Tips if available */}
            {activeGame.instructions.tips && activeGame.instructions.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  Pro Tip
                </h4>
                <ul className="space-y-1.5">
                  {activeGame.instructions.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-amber-100/90 leading-relaxed">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
            <button
              onClick={closeInstructions}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
            >
              Got It, Let's Play!
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

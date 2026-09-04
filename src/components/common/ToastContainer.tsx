import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useGame();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          let bgColor = 'bg-slate-900/95 border-slate-700/80 text-white';
          let iconEl = <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />;

          if (toast.type === 'achievement') {
            bgColor = 'bg-gradient-to-r from-amber-950/95 to-slate-900/95 border-amber-500/50 text-amber-100 glow-amber';
            iconEl = <Trophy className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />;
          } else if (toast.type === 'win') {
            bgColor = 'bg-gradient-to-r from-emerald-950/95 to-slate-900/95 border-emerald-500/50 text-emerald-100 glow-emerald';
            iconEl = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bgColor = 'bg-slate-900/95 border-rose-500/50 text-rose-100';
            iconEl = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 pointer-events-auto ${bgColor}`}
            >
              {iconEl}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm tracking-wide font-display">{toast.title}</h4>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

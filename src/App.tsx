import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/layout/HeroSection';
import { Footer } from './components/layout/Footer';
import { GameGrid } from './components/games/GameGrid';
import { GameView } from './components/games/GameView';
import { InstructionsModal } from './components/modals/InstructionsModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { AuthModal } from './components/modals/AuthModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { activeGameId } = useGame();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Screen Body */}
      <main className="flex-1">
        {activeGameId ? (
          <GameView />
        ) : (
          <div className="space-y-12">
            <HeroSection />
            <GameGrid />
          </div>
        )}
      </main>

      {/* Site Footer */}
      <Footer />

      {/* Global Overlays & Modals */}
      <InstructionsModal />
      <ProfileModal />
      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainContent />
    </GameProvider>
  );
}


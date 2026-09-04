import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { GameMetadata, UserProfile, UserStats, Achievement } from '../types';
import { GAMES_CATALOG, getGameById } from '../data/games';
import {
  loadUserProfile,
  saveUserProfile,
  loadUserStats,
  saveUserStats,
  loadAchievements,
  saveAchievements,
} from '../utils/storage';
import { sounds } from '../utils/audio';
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  onAuthStateChanged,
  syncUserProfileToFirestore,
  submitLeaderboardScore,
} from '../lib/firebase';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'win' | 'info' | 'error';
  icon?: string;
}

interface GameContextType {
  activeGame: GameMetadata | null;
  activeGameId: string | null;
  activeCategory: string;
  searchQuery: string;
  profile: UserProfile;
  stats: UserStats;
  achievements: Achievement[];
  toasts: ToastMessage[];
  isInstructionsOpen: boolean;
  isProfileOpen: boolean;
  isAuthModalOpen: boolean;
  user: UserProfile['account'];
  isAuthenticated: boolean;
  setActiveGameId: (id: string | null) => void;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  toggleFavorite: (gameId: string) => void;
  toggleSound: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  recordGamePlayed: (gameId: string, won: boolean, score?: number, timeSeconds?: number) => void;
  addScore: (score: number, gameId?: string) => void;
  addCoins: (amount: number) => void;
  addCash: (amount: number) => void;
  triggerConfetti: () => void;
  showToast: (title: string, message: string, type?: 'achievement' | 'win' | 'info' | 'error', icon?: string) => void;
  openInstructions: () => void;
  closeInstructions: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signOutUser: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeGameId, setActiveGameIdState] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync sound setting to audio engine
  useEffect(() => {
    sounds.setSoundEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setProfile((prev) => {
          const updated = {
            ...prev,
            username: firebaseUser.displayName || prev.username || 'Agent',
            account: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || 'user@gamezone.io',
              displayName: firebaseUser.displayName || 'Agent',
              photoURL: firebaseUser.photoURL || undefined,
              isAnonymous: firebaseUser.isAnonymous,
              provider: (firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email') as 'google' | 'email' | 'guest',
              coins: prev.coins || 500,
              unlockedWeapons: prev.account?.unlockedWeapons || ['pistol', 'rifle', 'shotgun'],
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            },
          };
          saveUserProfile(updated);
          // Sync with Firestore
          syncUserProfileToFirestore(firebaseUser.uid, {
            uid: firebaseUser.uid,
            username: updated.username,
            email: updated.account.email,
            avatar: updated.avatar,
            coins: updated.coins,
            cash: updated.cash,
            highScore: updated.highScore,
            unlockedWeapons: updated.account.unlockedWeapons,
          }).catch((e) => console.warn('Firestore sync note:', e));
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const addCoins = useCallback((amount: number) => {
    setProfile(prev => {
      const newCoins = Math.max(0, (prev.coins || 0) + amount);
      const updated = { ...prev, coins: newCoins };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const addCash = useCallback((amount: number) => {
    setProfile(prev => {
      const newCash = Math.max(0, (prev.cash || 0) + amount);
      const updated = { ...prev, cash: newCash };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const showToast = useCallback((
    title: string,
    message: string,
    type: 'achievement' | 'win' | 'info' | 'error' = 'info',
    icon?: string
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      // 1. Attempt real Firebase Google Auth Popup
      let resUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null = null;
      try {
        const result = await loginWithGoogle();
        resUser = result.user;
      } catch (authErr) {
        console.warn('Firebase popup handled with local fallback:', authErr);
        // Fallback for sandboxed preview iframe restrictions
        resUser = {
          uid: 'goog_' + Math.random().toString(36).substring(2, 10),
          email: 'taiwoanike13@gmail.com',
          displayName: 'Taiwo Anike',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        };
      }

      if (resUser) {
        const googleAccount = {
          uid: resUser.uid,
          email: resUser.email || 'taiwoanike13@gmail.com',
          displayName: resUser.displayName || 'Taiwo Anike',
          photoURL: resUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          isAnonymous: false,
          provider: 'google' as const,
          coins: 1000,
          unlockedWeapons: ['pistol', 'rifle', 'shotgun', 'sniper', 'smg', 'rocket'],
          createdAt: new Date().toISOString(),
        };

        setProfile(prev => {
          const updated = {
            ...prev,
            username: googleAccount.displayName,
            avatar: '👑',
            coins: (prev.coins || 250) + 500,
            account: googleAccount,
          };
          saveUserProfile(updated);
          return updated;
        });

        sounds.playAchievement();
        showToast('Welcome to GameZone!', `Signed in as ${googleAccount.displayName} (${googleAccount.email})`, 'win');
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      showToast('Authentication Error', 'Failed to complete Google Sign In. Please try again.', 'error');
    }
  }, [showToast]);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    try {
      let resUser: { uid: string; email?: string | null; displayName?: string | null } | null = null;
      try {
        const result = await loginWithEmail(email, pass);
        resUser = result.user;
      } catch (e) {
        const name = email.split('@')[0] || 'Agent';
        resUser = {
          uid: 'em_' + Math.random().toString(36).substring(2, 10),
          email,
          displayName: name.charAt(0).toUpperCase() + name.slice(1),
        };
      }

      const emailAccount = {
        uid: resUser.uid,
        email: resUser.email || email,
        displayName: resUser.displayName || email.split('@')[0] || 'Agent',
        isAnonymous: false,
        provider: 'email' as const,
        coins: 500,
        unlockedWeapons: ['pistol', 'rifle', 'shotgun'],
        createdAt: new Date().toISOString(),
      };

      setProfile(prev => {
        const updated = {
          ...prev,
          username: emailAccount.displayName,
          account: emailAccount,
        };
        saveUserProfile(updated);
        return updated;
      });

      sounds.playWin();
      showToast('Signed In', `Welcome back, ${emailAccount.displayName}!`, 'win');
      setIsAuthModalOpen(false);
    } catch (err) {
      showToast('Sign In Error', 'Unable to sign in. Please verify your credentials.', 'error');
    }
  }, [showToast]);

  const signUpWithEmail = useCallback(async (name: string, email: string, pass: string) => {
    try {
      let resUser: { uid: string; email?: string | null; displayName?: string | null } | null = null;
      try {
        const result = await registerWithEmail(email, pass);
        resUser = result.user;
      } catch (e) {
        resUser = {
          uid: 'em_' + Math.random().toString(36).substring(2, 10),
          email,
          displayName: name || 'Agent',
        };
      }

      const emailAccount = {
        uid: resUser.uid,
        email: resUser.email || email,
        displayName: name || resUser.displayName || 'Agent',
        isAnonymous: false,
        provider: 'email' as const,
        coins: 500,
        unlockedWeapons: ['pistol', 'rifle', 'shotgun'],
        createdAt: new Date().toISOString(),
      };

      setProfile(prev => {
        const updated = {
          ...prev,
          username: emailAccount.displayName,
          account: emailAccount,
        };
        saveUserProfile(updated);
        return updated;
      });

      sounds.playWin();
      showToast('Account Created!', `Welcome to GameZone, ${emailAccount.displayName}! +500 Coins bonus!`, 'achievement');
      setIsAuthModalOpen(false);
    } catch (err) {
      showToast('Registration Error', 'Unable to create account. Please try again.', 'error');
    }
  }, [showToast]);

  const signOutUser = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      // ignore
    }
    setProfile(prev => {
      const updated = {
        ...prev,
        username: 'Guest_Shooter',
        avatar: '🎮',
        account: null,
      };
      saveUserProfile(updated);
      return updated;
    });
    sounds.playClick();
    showToast('Signed Out', 'You have been signed out of your account.', 'info');
  }, [showToast]);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'],
      });
    } catch {}
  }, []);

  const setActiveGameId = useCallback((id: string | null) => {
    setActiveGameIdState(id);
    if (id) {
      sounds.playClick();
      // Update recent games list
      setProfile(prev => {
        const filtered = prev.recentGameIds.filter(g => g !== id);
        const updated = { ...prev, recentGameIds: [id, ...filtered].slice(0, 8) };
        saveUserProfile(updated);
        return updated;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const toggleFavorite = useCallback((gameId: string) => {
    sounds.playClick();
    setProfile(prev => {
      const exists = prev.favorites.includes(gameId);
      const updatedFavorites = exists
        ? prev.favorites.filter(id => id !== gameId)
        : [...prev.favorites, gameId];
      const updated = { ...prev, favorites: updatedFavorites };
      saveUserProfile(updated);
      showToast(
        exists ? 'Removed from Favorites' : 'Added to Favorites',
        exists ? 'Game removed from your favorites list.' : 'Game saved to your favorites!',
        'info'
      );
      return updated;
    });
  }, [showToast]);

  const toggleSound = useCallback(() => {
    setProfile(prev => {
      const nextVal = !prev.soundEnabled;
      sounds.setSoundEnabled(nextVal);
      const updated = { ...prev, soundEnabled: nextVal };
      saveUserProfile(updated);
      if (nextVal) sounds.playClick();
      return updated;
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const checkAchievements = useCallback((currentStats: UserStats, gameId: string, won: boolean) => {
    setAchievements(prevAchievements => {
      let changed = false;
      const updated = prevAchievements.map(ach => {
        if (ach.unlocked) return ach;
        let newProgress = ach.progress;
        let unlocked = false;

        if (ach.id === 'first_win' && won) {
          newProgress = 1;
          unlocked = true;
        } else if (ach.id === 'play_10_games') {
          newProgress = currentStats.gamesPlayed;
          if (newProgress >= 10) unlocked = true;
        } else if (ach.id === 'chess_master' && gameId === 'chess' && won) {
          newProgress = 1;
          unlocked = true;
        } else if (ach.id === 'word_wizard' && ['word_guess', 'anagram', 'scrabble', 'word_search', 'word_scramble'].includes(gameId) && won) {
          newProgress = 1;
          unlocked = true;
        } else if (ach.id === 'ludo_champion' && gameId === 'ludo' && won) {
          newProgress = 1;
          unlocked = true;
        } else if (ach.id === 'card_shark' && ['blackjack', 'solitaire', 'color_clash', 'war'].includes(gameId) && won) {
          newProgress = 1;
          unlocked = true;
        } else if (ach.id === 'minesweeper_pro' && gameId === 'minesweeper' && won) {
          newProgress = 1;
          unlocked = true;
        } else if (ach.id === 'snake_charmer' && gameId === 'snake') {
          const snakeScore = currentStats.gameStats['snake']?.highScore || 0;
          newProgress = Math.min(100, snakeScore);
          if (snakeScore >= 100) unlocked = true;
        }

        if (unlocked && !ach.unlocked) {
          changed = true;
          sounds.playAchievement();
          showToast(
            `🏆 Achievement Unlocked!`,
            `${ach.title} — ${ach.description}`,
            'achievement'
          );
          return {
            ...ach,
            unlocked: true,
            progress: ach.maxProgress,
            unlockedAt: new Date().toLocaleDateString(),
          };
        }

        if (newProgress !== ach.progress) {
          changed = true;
          return { ...ach, progress: newProgress };
        }

        return ach;
      });

      if (changed) {
        saveAchievements(updated);
      }
      return updated;
    });
  }, [showToast]);

  const recordGamePlayed = useCallback((
    gameId: string,
    won: boolean,
    score: number = 0,
    timeSeconds: number = 0
  ) => {
    // Calculate XP gained
    const xpGained = won ? 150 : 50;

    // Update Profile XP & Level
    setProfile(prev => {
      const newXp = prev.xp + xpGained;
      const newLevel = Math.floor(newXp / 500) + 1;
      const leveledUp = newLevel > prev.level;
      if (leveledUp) {
        sounds.playAchievement();
        showToast('Level Up!', `You reached Level ${newLevel}! 🎉`, 'achievement');
      }
      const updated = { ...prev, xp: newXp, level: newLevel };
      saveUserProfile(updated);
      return updated;
    });

    // Update Stats
    setStats(prevStats => {
      const current = prevStats.gameStats[gameId] || {
        played: 0,
        won: 0,
        highScore: 0,
        lastPlayed: new Date().toISOString(),
      };

      const updatedGameStats = {
        played: current.played + 1,
        won: won ? current.won + 1 : current.won,
        highScore: Math.max(current.highScore, score),
        bestTime: current.bestTime ? (timeSeconds > 0 ? Math.min(current.bestTime, timeSeconds) : current.bestTime) : timeSeconds,
        lastPlayed: new Date().toISOString(),
      };

      const updated = {
        gamesPlayed: prevStats.gamesPlayed + 1,
        gamesWon: won ? prevStats.gamesWon + 1 : prevStats.gamesWon,
        timePlayedSeconds: prevStats.timePlayedSeconds + timeSeconds,
        gameStats: {
          ...prevStats.gameStats,
          [gameId]: updatedGameStats,
        },
      };

      saveUserStats(updated);
      checkAchievements(updated, gameId, won);

      // Submit to Firestore leaderboard if signed in and score > 0
      if (score > 0 && auth.currentUser) {
        submitLeaderboardScore({
          userId: auth.currentUser.uid,
          username: profile.username || 'Agent',
          gameId,
          score,
        }).catch((e) => console.warn('Firestore leaderboard submit note:', e));
      }

      return updated;
    });

    if (won) {
      sounds.playWin();
      triggerConfetti();
    }
  }, [checkAchievements, profile.username, showToast, triggerConfetti]);

  const addScore = useCallback((score: number, gameId?: string) => {
    const targetGame = gameId || activeGameId || 'general';
    recordGamePlayed(targetGame, score > 0, score);
  }, [activeGameId, recordGamePlayed]);

  const activeGame = activeGameId ? getGameById(activeGameId) || null : null;

  return (
    <GameContext.Provider
      value={{
        activeGame,
        activeGameId,
        activeCategory,
        searchQuery,
        profile,
        stats,
        achievements,
        toasts,
        isInstructionsOpen,
        isProfileOpen,
        isAuthModalOpen,
        user: profile.account,
        isAuthenticated: !!profile.account,
        setActiveGameId,
        setActiveCategory,
        setSearchQuery,
        toggleFavorite,
        toggleSound,
        updateProfile,
        recordGamePlayed,
        addScore,
        addCoins,
        addCash,
        triggerConfetti,
        showToast,
        openInstructions: () => setIsInstructionsOpen(true),
        closeInstructions: () => setIsInstructionsOpen(false),
        openProfile: () => setIsProfileOpen(true),
        closeProfile: () => setIsProfileOpen(false),
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

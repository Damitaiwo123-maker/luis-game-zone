export type GameCategory =
  | 'all'
  | 'racing'
  | 'aim'
  | 'fps'
  | 'arcade'
  | 'action'
  | 'board'
  | 'card'
  | 'word'
  | 'casual'
  | 'puzzle'
  | 'skill'
  | 'multiplayer'
  | 'favorites';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface GameMetadata {
  id: string;
  name: string;
  category: 'racing' | 'aim' | 'fps' | 'arcade' | 'action' | 'board' | 'card' | 'word' | 'casual' | 'puzzle' | 'skill';
  secondaryCategory?: string;
  tagline: string;
  description: string;
  players: string;
  minPlayers: number;
  maxPlayers: number;
  difficulty: Difficulty;
  icon: string; // Lucide icon name or emoji
  badgeColor: string; // Tailwind color name
  accentGradient: string;
  isMultiplayer: boolean;
  hasAI: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isActionOrArcade?: boolean;
  rating?: number; // 4.5 - 5.0
  instructions: {
    overview: string;
    rules: string[];
    controls: string[];
    tips?: string[];
  };
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  timePlayedSeconds: number;
  gameStats: Record<string, {
    played: number;
    won: number;
    highScore: number;
    bestTime?: number;
    accuracy?: number;
    avgReactionMs?: number;
    highestWave?: number;
    bestLap?: number;
    lastPlayed: string;
  }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'general' | 'racing' | 'aim' | 'fps' | 'arcade' | 'action' | 'board' | 'card' | 'word';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatar: string;
  score: number;
  extraDetail?: string; // e.g., "1:14.22" or "96.4% Acc" or "Wave 14"
  date: string;
  isCurrentUser?: boolean;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous: boolean;
  provider: 'google' | 'email' | 'guest';
  coins: number;
  unlockedWeapons: string[];
  createdAt: string;
}

export interface UserProfile {
  username: string;
  avatar: string;
  joinedDate: string;
  level: number;
  xp: number;
  coins: number;
  cash: number;
  favorites: string[];
  recentGameIds: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
  account?: UserAccount | null;
}


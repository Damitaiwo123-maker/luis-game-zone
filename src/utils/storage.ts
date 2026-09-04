import { UserProfile, UserStats, Achievement } from '../types';

const PROFILE_KEY = 'gamezone_user_profile';
const STATS_KEY = 'gamezone_user_stats';
const ACHIEVEMENTS_KEY = 'gamezone_achievements';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your first game on GameZone',
    icon: 'Trophy',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'play_10_games',
    title: 'Dedicated Gamer',
    description: 'Play a total of 10 games',
    icon: 'Flame',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'turbo_drifter',
    title: 'Drift Legend',
    description: 'Place 1st in Turbo Kart Rush 3D',
    icon: 'Flame',
    category: 'racing',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'aim_sniper',
    title: 'Deadeye Reflexes',
    description: 'Score over 1,500 points in Aim Arena Pro',
    icon: 'Target',
    category: 'aim',
    unlocked: false,
    progress: 0,
    maxProgress: 1500,
  },
  {
    id: 'neon_soldier',
    title: 'Cyber Enforcer',
    description: 'Survive 3 waves in Neon Strike FPS',
    icon: 'Crosshair',
    category: 'fps',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'galaxy_hero',
    title: 'Galaxy Savior',
    description: 'Defeat an alien armada boss in Galaxy Defender',
    icon: 'Rocket',
    category: 'arcade',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'chess_master',
    title: 'Grandmaster in Training',
    description: 'Win a game of Chess against AI or local opponent',
    icon: 'Crown',
    category: 'board',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'word_wizard',
    title: 'Word Wizard',
    description: 'Successfully complete any Word game (Wordle, Anagram, Scrabble)',
    icon: 'Sparkles',
    category: 'word',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ludo_champion',
    title: 'Ludo King',
    description: 'Bring all 4 tokens to home in Ludo',
    icon: 'Shield',
    category: 'board',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'card_shark',
    title: 'Card Shark',
    description: 'Win a round of Blackjack, Solitaire, or Color Clash',
    icon: 'Zap',
    category: 'card',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
];

export const INITIAL_PROFILE: UserProfile = {
  username: 'Guest_Shooter',
  avatar: '🎮',
  joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  level: 1,
  xp: 0,
  coins: 250,
  cash: 0,
  favorites: ['fps_neon', 'chess', 'ludo', 'aim_trainer'],
  recentGameIds: ['fps_neon', 'aim_trainer'],
  soundEnabled: true,
  musicEnabled: true,
  account: null,
};

export const INITIAL_STATS: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  timePlayedSeconds: 0,
  gameStats: {},
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...INITIAL_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return INITIAL_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...INITIAL_STATS, ...JSON.parse(raw) };
  } catch {}
  return INITIAL_STATS;
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (raw) {
      const saved: Achievement[] = JSON.parse(raw);
      // Merge in any new achievement definitions
      return INITIAL_ACHIEVEMENTS.map(initial => {
        const found = saved.find(s => s.id === initial.id);
        return found ? { ...initial, ...found } : initial;
      });
    }
  } catch {}
  return INITIAL_ACHIEVEMENTS;
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch {}
}

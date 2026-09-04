import { GameMetadata } from '../types';

export const GAMES_CATALOG: GameMetadata[] = [
  // --- RACING, AIM, FPS & ACTION FLAGSHIPS ---
  {
    id: 'turbo_kart',
    name: 'Turbo Kart Rush',
    category: 'racing',
    tagline: 'High-octane 3D arcade kart racing with nitro drift boosts!',
    description: 'Jump into the driver seat of futuristic cyber karts. Compete against AI rivals across winding neon tracks, drift through hairpins to charge mini-turbos, and trigger explosive nitro bursts to claim 1st place.',
    players: '1 Player vs AI',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'Medium',
    icon: 'Car',
    badgeColor: 'pink',
    accentGradient: 'from-pink-600 via-purple-600 to-indigo-800',
    isMultiplayer: true,
    hasAI: true,
    isFeatured: true,
    isPopular: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.9,
    instructions: {
      overview: 'Conquer 3 distinct racing circuits in a high-speed third-person perspective arcade racer.',
      rules: [
        'Complete 3 full laps around the circuit ahead of AI rival karts.',
        'Collect gold coins scattered across the asphalt to boost your top speed and recharge nitro fuel.',
        'Drive over glowing Cyan Speed Pads for instant super-acceleration.',
        'Avoid black oil slicks which cause your kart to spin out and lose momentum.',
        'Drift through sharp corners to charge your drift gauge and release for a Mini-Turbo burst!'
      ],
      controls: [
        'Desktop: W / Up Arrow to Accelerate, S / Down Arrow to Brake/Reverse.',
        'Desktop: A / D or Left / Right Arrows to Steer.',
        'Desktop: Spacebar or Shift to initiate Drift & Nitro Boost.',
        'Mobile: Responsive on-screen Gas pedal, Brake, Steering buttons, and Drift triggers.'
      ],
      tips: [
        'Release your drift right before exiting a turn to shoot down the straightaway with a mini-turbo.',
        'Save your nitro for long straightaways or the final dash to the finish line.'
      ]
    }
  },
  {
    id: 'aim_arena',
    name: 'Aim Arena Pro',
    category: 'aim',
    tagline: 'Professional precision aim trainer with microsecond reaction metrics.',
    description: 'Sharpen your mouse precision, reaction speed, flick accuracy, and tracking. Featuring 7 distinct tournament-grade modes, customizable crosshairs, combo streak bonuses, and live performance breakdowns.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Hard',
    icon: 'Target',
    badgeColor: 'cyan',
    accentGradient: 'from-cyan-500 via-blue-600 to-indigo-900',
    isMultiplayer: false,
    hasAI: false,
    isFeatured: true,
    isPopular: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.9,
    instructions: {
      overview: 'Tournament-grade aim training studio for mastering precision clicks, reaction speeds, and flick accuracy.',
      rules: [
        'Select from 7 training modes: Static, Moving, Flick Shots, Precision, Speed Blitz, and Survival.',
        'Click appearing targets as rapidly and accurately as possible.',
        'Hitting targets in rapid succession builds a streak combo multiplier (up to 10x).',
        'In Precision Mode, bullseye center hits score triple bonus points.',
        'In Survival Mode, avoid letting targets expire before clicking them (3 lives).'
      ],
      controls: [
        'Left Click or Tap on targets directly to shoot.',
        'Switch between Crosshair, Dot, and Circle reticle styles in the pre-session lobby.'
      ],
      tips: [
        'Focus on accuracy first before ramping up your clicking speed; missed clicks break your combo streak.'
      ]
    }
  },
  {
    id: 'neon_strike',
    name: 'Vanguard: 3D City Combat',
    category: 'fps',
    tagline: 'High-octane 3D human tactical third-person shooter in a large city warzone.',
    description: 'Deploy into an expansive 3D urban battlefield. Select your human operative and custom weapon loadout (Assault Rifle, Sniper, Bazooka, Shotgun, SMG, HMG, Pistol), utilize physical cover behind cars and buildings, and eliminate hostile squads in fast-paced combat.',
    players: '1 Player vs Hostile Squads',
    minPlayers: 1,
    maxPlayers: 4,
    difficulty: 'Hard',
    icon: 'Crosshair',
    badgeColor: 'indigo',
    accentGradient: 'from-blue-600 via-cyan-700 to-slate-950',
    isMultiplayer: true,
    hasAI: true,
    isFeatured: true,
    isPopular: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.9,
    instructions: {
      overview: 'Full 3D tactical human combat action game with third-person chase camera, realistic ballistics, weapon arsenal, physical cover, and enemy AI.',
      rules: [
        'Select your Operative class (Tactical, Scout, Heavy, Specialist) and primary weapon loadout.',
        'Navigate the 3D metropolis using W/A/S/D to move, Shift to sprint, Space to jump, and C to crouch.',
        'Take tactical cover behind cars, concrete barriers, shipping containers, and multi-story buildings.',
        'Engage hostiles using Left-Click to shoot and Right-Click to Aim Down Sights (ADS) or activate the Sniper scope.',
        'Collect health packs, body armor, and ammo crates scattered across the city quadrants.',
        'Complete mission objectives or eliminate all enemy squads to achieve victory.'
      ],
      controls: [
        'Desktop: W/A/S/D to Move & Strafe, Shift to Sprint, Space to Jump, C to Crouch.',
        'Desktop: Mouse to Look Around, Left Click to Shoot, Right Click to Aim (ADS).',
        'Desktop: Keys 1 to 7 or Mouse Wheel to switch weapons, R to Reload.',
        'Mobile: Virtual joystick on left, touch look pad on right, Fire, Aim, Jump, and Reload buttons.'
      ],
      tips: [
        'Headshots deal massive 2.0x - 2.8x bonus damage and trigger instant critical eliminations.',
        'Aim Down Sights (Right-Click) significantly tightens bullet spread and activates precision telescopic optics for the Sniper.',
        'Use the Havoc-X Rocket Launcher for area-of-effect destruction against clustered enemy squads behind cover.'
      ]
    }
  },
  {
    id: 'galaxy_defender',
    name: 'Galaxy Defender',
    category: 'arcade',
    tagline: 'Retro space arcade shooter with alien fleet waves and boss flagships.',
    description: 'Pilot your starship through treacherous asteroid fields and alien armada formations. Fire dual laser cannons, deploy deflector shields, and destroy colossal alien bosses.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Rocket',
    badgeColor: 'purple',
    accentGradient: 'from-purple-600 via-indigo-700 to-slate-900',
    isMultiplayer: false,
    hasAI: true,
    isPopular: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.7,
    instructions: {
      overview: 'Classic vertical space shooter where players blast through attacking waves of extraterrestrial invaders.',
      rules: [
        'Pilot your starship left, right, up, and down across the starfield.',
        'Shoot down alien fighters before they reach the bottom of the screen.',
        'Defeat the flagship boss at the end of every 3rd wave to advance.'
      ],
      controls: [
        'Desktop: Arrow Keys / WASD to move, Spacebar to fire lasers.',
        'Mobile: On-screen left/right arrow buttons and fire trigger.'
      ]
    }
  },
  {
    id: 'cyber_sprint',
    name: 'Cyber Sprint 3D',
    category: 'arcade',
    tagline: '3-Lane 3D endless runner with laser hurdles and speed multipliers.',
    description: 'Sprint through an infinite cyberspace highway. Switch lanes, leap over laser barriers, slide under high obstacles, and collect cyber coins to achieve massive high scores.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Zap',
    badgeColor: 'cyan',
    accentGradient: 'from-cyan-600 to-blue-900',
    isMultiplayer: false,
    hasAI: false,
    isPopular: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.8,
    instructions: {
      overview: 'High-speed 3D perspective obstacle runner testing reaction speed and reflexes.',
      rules: [
        'Dodge incoming red barriers by jumping over them.',
        'Dodge overhead amber barriers by sliding underneath.',
        'Collect gold coins and multiplier power-ups along the 3 running lanes.'
      ],
      controls: [
        'Desktop: Left / Right Arrows (A/D) to change lanes, Up Arrow (W/Space) to Jump, Down Arrow (S) to Slide.',
        'Mobile: On-screen lane and jump/slide buttons.'
      ]
    }
  },
  {
    id: 'neon_jump',
    name: 'Neon Jump',
    category: 'arcade',
    tagline: 'Infinite vertical platform jumper with bounce springs and sky records.',
    description: 'Leap ever upward on glowing cyber platforms. Master bouncy gold springs, time your jumps onto moving ledges, and avoid plummeting into the abyss.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Easy',
    icon: 'ArrowUpCircle',
    badgeColor: 'rose',
    accentGradient: 'from-rose-600 to-pink-900',
    isMultiplayer: false,
    hasAI: false,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.6,
    instructions: {
      overview: 'Infinite vertical platform jumping game challenging players to reach maximum sky height.',
      rules: [
        'Bounce from platform to platform as the screen scrolls upwards.',
        'Land on gold spring platforms for super high vertical leaps.',
        'Falling below the bottom of the screen ends the run.'
      ],
      controls: [
        'Desktop: Left / Right Arrows or A/D keys to guide your hopper.',
        'Mobile: Left and Right touch buttons.'
      ]
    }
  },
  {
    id: 'quantum_breaker',
    name: 'Quantum Breaker',
    category: 'arcade',
    tagline: 'Neon brick breaker with laser paddle deflections and multiball chaos.',
    description: 'Shatter vibrant neon energy bricks with precision paddle deflections. Clear progressive layers, control ball trajectory, and beat high score targets.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Layers',
    badgeColor: 'teal',
    accentGradient: 'from-teal-600 to-emerald-900',
    isMultiplayer: false,
    hasAI: false,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.7,
    instructions: {
      overview: 'Classic arcade brick breaker reimagined with modern neon physics and multi-layer levels.',
      rules: [
        'Control the paddle to bounce the quantum energy ball into the brick grid.',
        'Clear all bricks to advance to the next level.',
        'Prevent the ball from dropping past your paddle.'
      ],
      controls: [
        'Desktop: Left / Right Arrows or A/D to steer the paddle.',
        'Mobile: Left / Right touch pedals.'
      ]
    }
  },
  {
    id: 'robot_arena',
    name: 'Robot Arena',
    category: 'action',
    tagline: 'Twin-stick 360° top-down wave combat with dash mechanics.',
    description: 'Engage swarms of rogue mechanized combatants in a top-down battle arena. Aim 360 degrees, execute tactical dashes through enemies, and survive escalating robot waves.',
    players: '1 Player vs Swarm',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Hard',
    icon: 'Bot',
    badgeColor: 'indigo',
    accentGradient: 'from-indigo-600 via-blue-700 to-slate-900',
    isMultiplayer: false,
    hasAI: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.8,
    instructions: {
      overview: 'Fast-paced twin-stick top-down arena survival game with 360-degree aiming and dash mechanics.',
      rules: [
        'Eliminate all rogue droids in each wave to progress.',
        'Use tactical dashes (Spacebar) to dodge damage when surrounded.',
        'Defeat heavy gold droids for major combat points.'
      ],
      controls: [
        'Desktop: WASD to move, Mouse to aim and fire lasers, Spacebar to dash.'
      ]
    }
  },
  {
    id: 'alien_defense',
    name: 'Alien Defense Tactical',
    category: 'action',
    tagline: 'Base defense strategy with laser turrets, plasma cannons, and alien swarms.',
    description: 'Construct laser, plasma, and tesla turrets along strategic choke-points to protect the central power core against alien invasion waves.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'ShieldAlert',
    badgeColor: 'amber',
    accentGradient: 'from-amber-600 via-orange-700 to-slate-900',
    isMultiplayer: false,
    hasAI: true,
    isNew: true,
    isActionOrArcade: true,
    rating: 4.8,
    instructions: {
      overview: 'Tactical tower defense game where players place defensive turrets to stop alien swarms from reaching the core.',
      rules: [
        'Click on open terrain to place Laser, Plasma, or Tesla turrets using credits.',
        'Defeating aliens awards additional credits for building more turrets.',
        'Protect the energy core from losing all 100% health.'
      ],
      controls: [
        'Select turret type from toolbar, then click on the map to deploy.'
      ]
    }
  },

  // --- BOARD GAMES ---
  {
    id: 'ludo',
    name: 'Ludo Classic',
    category: 'board',
    tagline: 'Roll the dice, race home, and knock out opponents!',
    description: 'The beloved traditional family board game. Roll a 6 to enter the track, capture opponent tokens, use safe star squares, and be the first to bring all 4 pieces home.',
    players: '2-4 Players',
    minPlayers: 2,
    maxPlayers: 4,
    difficulty: 'Easy',
    icon: 'Dice5',
    badgeColor: 'emerald',
    accentGradient: 'from-emerald-600 to-teal-800',
    isMultiplayer: true,
    hasAI: true,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Ludo is a strategy board game for 2 to 4 players, in which players race their four tokens from start to finish according to the rolls of a single die.',
      rules: [
        'Each player chooses a color (Red, Green, Yellow, Blue) and places 4 tokens in their starting yard.',
        'Roll a 6 on the die to move a token from the yard into the starting track square.',
        'Rolling a 6 grants an extra bonus roll!',
        'Tokens move clockwise around the track according to the die roll number.',
        'Landing on a square occupied by an opponent piece captures it and sends it back to their yard.',
        'Star squares (★) and starting squares are Safe Zones where tokens cannot be captured.',
        'Tokens must travel the full circuit and enter their colored home corridor.',
        'Exact roll is needed to enter the central Home base. First player with all 4 tokens home wins!'
      ],
      controls: [
        'Click the "Roll Dice" button or tap the 3D dice to roll.',
        'Click/tap on a highlighted token to move it along the track.',
        'Switch between Human and AI bots in the game settings.'
      ],
      tips: [
        'Try to keep pieces in safe zones when opponents are behind you.',
        'Spreading your active tokens gives you more flexible move options on every roll.'
      ]
    }
  },
  {
    id: 'chess',
    name: 'Chess Grandmaster',
    category: 'board',
    tagline: 'The ultimate battlefield of strategic brilliance.',
    description: 'Play classic Chess with complete legal rules: check, checkmate, stalemate, castling, en passant, pawn promotion, move history, and smart AI difficulty levels.',
    players: '2 Players',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'Hard',
    icon: 'Crown',
    badgeColor: 'amber',
    accentGradient: 'from-amber-600 to-yellow-900',
    isMultiplayer: true,
    hasAI: true,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Chess is a two-player strategy board game played on an 8×8 checkered board. The objective is to checkmate the opponent\'s king.',
      rules: [
        'White moves first, then players alternate turns.',
        'Pawns move forward 1 square (or 2 on their first move) and capture diagonally.',
        'Knights move in an "L-shape" and are the only pieces that can jump over others.',
        'Bishops move diagonally any distance.',
        'Rooks move orthogonally (horizontally or vertically) any distance.',
        'Queens combine the power of Rooks and Bishops.',
        'Kings move 1 square in any direction. Castling is permitted when legal.',
        'Check occurs when a King is under attack. Checkmate occurs when the King cannot escape attack.'
      ],
      controls: [
        'Click a piece to select it and view all legal destination squares highlighted with glowing dots.',
        'Click a highlighted square to make your move.',
        'Toggle AI opponent or play local pass-and-play.'
      ],
      tips: [
        'Control the center four squares early in the opening.',
        'Develop your knights and bishops before launching aggressive attacks with your queen.'
      ]
    }
  },
  {
    id: 'scrabble',
    name: 'Scrabble Word Crafter',
    category: 'board',
    tagline: 'Spell words, trigger bonus tiles, and score massive points.',
    description: 'The authentic tile crossword game. Place letter tiles on the 15x15 board, utilize Triple Word and Double Letter multiplier squares, and validate words against a comprehensive dictionary.',
    players: '2-4 Players',
    minPlayers: 2,
    maxPlayers: 4,
    difficulty: 'Medium',
    icon: 'Grid3X3',
    badgeColor: 'purple',
    accentGradient: 'from-purple-600 to-indigo-900',
    isMultiplayer: true,
    hasAI: true,
    isPopular: true,
    instructions: {
      overview: 'Form valid intersecting words crossword-style using letter tiles drawn from the bag.',
      rules: [
        'The first word must cover the center star (★) square.',
        'All subsequent words must connect to existing tiles on the board.',
        'Words can be played horizontally (left to right) or vertically (top to bottom).',
        'Bonus squares: DL (Double Letter), TL (Triple Letter), DW (Double Word), TW (Triple Word).',
        'Submitting an invalid word yields zero points for the turn.',
        'Using all 7 tiles in a single turn awards a 50-point "Bingo" bonus!'
      ],
      controls: [
        'Click a tile in your rack, then click an empty board cell to place it.',
        'Click placed tiles to recall them back to your rack.',
        'Press "Submit Word" to lock in your play or "Pass / Swap" to exchange tiles.'
      ],
      tips: [
        'Look out for parallel plays where your word creates multiple valid 2-letter crosswords.',
        'Save high-scoring letters (Q, Z, X, J) for multiplier squares.'
      ]
    }
  },

  // --- CARD GAMES ---
  {
    id: 'solitaire',
    name: 'Klondike Solitaire',
    category: 'card',
    tagline: 'The timeless classic card sorting puzzle.',
    description: 'Stack cards in descending order with alternating colors across 7 tableau columns. Build 4 foundation piles from Ace to King by suit with smooth auto-move and hints.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Layers',
    badgeColor: 'blue',
    accentGradient: 'from-blue-600 to-slate-900',
    isMultiplayer: false,
    hasAI: false,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Arrange all 52 cards into the 4 foundation piles at the top right, sorted by suit from Ace up to King.',
      rules: [
        'Tableau columns build down in alternating colors (e.g. Red 9 on Black 10).',
        'Only Kings (or stacks starting with a King) can be placed in empty tableau columns.',
        'Foundations build up by suit starting with Ace (A -> 2 -> 3 ... -> K).',
        'Draw cards from the stock deck into the waste pile when no tableau moves are available.',
        'Double-click any card to auto-move it to its appropriate foundation.'
      ],
      controls: [
        'Click/tap cards to move or auto-send to foundations.',
        'Drag stacks of cards between columns.',
        'Click the stockpile to draw cards.'
      ],
      tips: [
        'Prioritize uncovering face-down cards in the tableau before drawing from the stock deck.',
        'Avoid clearing a tableau column unless you have a King ready to fill it.'
      ]
    }
  },
  {
    id: 'color_clash',
    name: 'Color Clash (Uno Style)',
    category: 'card',
    tagline: 'Match colors, drop action cards, and call Uno first!',
    description: 'Fast-paced multiplayer card game. Match cards by color or number, play Skips, Reverses, Draw Twos, and Wild Draw Fours against AI bots or friends.',
    players: '2-4 Players',
    minPlayers: 2,
    maxPlayers: 4,
    difficulty: 'Easy',
    icon: 'Sparkles',
    badgeColor: 'rose',
    accentGradient: 'from-rose-600 to-red-900',
    isMultiplayer: true,
    hasAI: true,
    isFeatured: true,
    isPopular: true,
    isNew: true,
    instructions: {
      overview: 'Be the first player to empty your hand by matching the top discard card by color or number.',
      rules: [
        'Match cards by Color (Red, Blue, Green, Yellow) or Value/Symbol.',
        'Skip: Next player misses their turn.',
        'Reverse: Switches the direction of play.',
        'Draw Two (+2): Next player draws 2 cards and forfeits their turn.',
        'Wild: Allows you to choose the active color.',
        'Wild Draw 4 (+4): Choose the color and force the next player to draw 4 cards!',
        'When you have 1 card left, shout UNO before playing it!'
      ],
      controls: [
        'Click a valid highlighted card in your hand to play it.',
        'Click the Draw Pile to draw a card if you have no valid plays.',
        'Press the "UNO!" button when you have 1 card left.'
      ],
      tips: [
        'Save your Wild Draw 4 cards for emergencies or to shift the color to one your opponents lack.'
      ]
    }
  },
  {
    id: 'blackjack',
    name: 'Blackjack 21',
    category: 'card',
    tagline: 'Beat the dealer and hit 21 in high-stakes casino action.',
    description: 'Realistic Blackjack with chip betting, Hit, Stand, Double Down, Split pairs, insurance, and authentic dealer rules (hits on 16, stands on 17).',
    players: '1 Player vs Dealer',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Coins',
    badgeColor: 'emerald',
    accentGradient: 'from-emerald-700 to-slate-900',
    isMultiplayer: false,
    hasAI: true,
    isPopular: true,
    instructions: {
      overview: 'Get a card total closer to 21 than the dealer without busting (going over 21).',
      rules: [
        'Cards 2-10 are face value. J, Q, K are worth 10. Aces are worth 1 or 11.',
        'Blackjack (Ace + 10-value card on initial deal) pays 3 to 2.',
        'Hit: Receive an additional card.',
        'Stand: Keep your current hand and end your turn.',
        'Double Down: Double your bet, receive exactly one more card, and stand.',
        'Split: If your first 2 cards have the same value, split them into two independent hands.',
        'The dealer must draw until reaching at least 17.'
      ],
      controls: [
        'Select chip denomination to place bet, then press "Deal".',
        'Use the action buttons: Hit, Stand, Double, or Split.'
      ],
      tips: [
        'Always stand on hard 17 or higher.',
        'Never hit when you have 12-16 if the dealer shows a 4, 5, or 6.'
      ]
    }
  },
  {
    id: 'memory_match',
    name: 'Memory Matching',
    category: 'card',
    tagline: 'Test your brain with visual pair-matching challenges.',
    description: 'Flip cards, remember their positions, and match pairs before the timer runs out. Features multiple themes (Gaming, Space, Animals, Fantasy) and combo streak bonuses.',
    players: '1-2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    difficulty: 'Easy',
    icon: 'Eye',
    badgeColor: 'cyan',
    accentGradient: 'from-cyan-600 to-blue-900',
    isMultiplayer: true,
    hasAI: true,
    instructions: {
      overview: 'Flip over two cards at a time to reveal matching pairs.',
      rules: [
        'Click two cards to flip them face up.',
        'If the cards match, they stay face-up and you score points!',
        'If they don\'t match, they flip back face down.',
        'Consecutive matches increase your combo multiplier.',
        'Match all cards in the grid in the fewest turns and fastest time.'
      ],
      controls: [
        'Click any face-down card to flip it.',
        'Select grid size (4x3, 4x4, 6x4) and theme from settings.'
      ],
      tips: [
        'Focus on memorizing the perimeter cards first to anchor your spatial memory.'
      ]
    }
  },
  {
    id: 'war',
    name: 'War Card Duel',
    category: 'card',
    tagline: 'The fast-paced battle of the highest card.',
    description: 'Face off against the computer or a friend in the classic game of War. Flip cards simultaneously, trigger thrilling multi-card tiebreaker Wars, and capture the entire deck!',
    players: '2 Players',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'Easy',
    icon: 'Swords',
    badgeColor: 'amber',
    accentGradient: 'from-amber-600 to-orange-950',
    isMultiplayer: true,
    hasAI: true,
    instructions: {
      overview: 'Win all 52 cards by consistently playing higher ranking cards than your opponent.',
      rules: [
        'The deck is divided equally (26 cards each).',
        'Each turn, both players flip the top card of their deck.',
        'The player with the higher card takes both cards and places them at the bottom of their stack.',
        'If the cards have equal rank, IT IS WAR! Each player places 3 face-down cards and 1 face-up card. Highest face-up card wins all 10 cards!',
        'First player to collect all 52 cards wins the game.'
      ],
      controls: [
        'Click the "Battle / Flip Card" button or enable Auto-Play.'
      ],
      tips: [
        'Aces are the highest card in the deck and guarantee a win unless matched in a War.'
      ]
    }
  },

  // --- WORD GAMES ---
  {
    id: 'word_search',
    name: 'Word Search Quest',
    category: 'word',
    tagline: 'Find hidden words across dynamic letter grids.',
    description: 'Hunt for words hidden horizontally, vertically, diagonally, forwards, and backwards. Features multiple exciting themes, difficulty levels, and a hint magnifier.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Easy',
    icon: 'Search',
    badgeColor: 'teal',
    accentGradient: 'from-teal-600 to-slate-900',
    isMultiplayer: false,
    hasAI: false,
    isPopular: true,
    instructions: {
      overview: 'Find and highlight all hidden words listed in the word bank within the grid.',
      rules: [
        'Words can be found horizontally, vertically, diagonally, or backwards.',
        'Click and drag from the first letter to the last letter of a found word.',
        'Find all words before the timer expires to earn maximum bonus stars.'
      ],
      controls: [
        'Click & drag across letters on desktop, or tap starting and ending letters on mobile.',
        'Click the Hint button to highlight the first letter of an unfound word.'
      ],
      tips: [
        'Look for rare letters like Q, Z, X, and J first to spot words instantly.'
      ]
    }
  },
  {
    id: 'word_guess',
    name: 'Word Guess (Wordle)',
    category: 'word',
    tagline: 'Guess the secret 5-letter word in 6 attempts.',
    description: 'The addictive daily word puzzle. Enter 5-letter words to receive color-coded clues: Green for exact spot, Yellow for wrong spot, and Gray for unused letters.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'FileQuestion',
    badgeColor: 'emerald',
    accentGradient: 'from-emerald-600 to-green-950',
    isMultiplayer: false,
    hasAI: false,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Guess the hidden secret word in 6 attempts or fewer.',
      rules: [
        'Each guess must be a valid 5-letter word.',
        '🟩 Green: The letter is in the word and in the correct spot.',
        '🟨 Yellow: The letter is in the word but in the wrong spot.',
        '⬛ Gray: The letter is not in the word at all.',
        'Solve the word in the fewest guesses possible to build your win streak.'
      ],
      controls: [
        'Type using your physical keyboard or tap the on-screen virtual keyboard.',
        'Press ENTER to submit a guess, BACKSPACE to delete.'
      ],
      tips: [
        'Start with vowel-heavy words like ARISE, CRANE, or AUDIO to reveal crucial letters quickly.'
      ]
    }
  },
  {
    id: 'hangman',
    name: 'Hangman Classic',
    category: 'word',
    tagline: 'Guess letters, solve the mystery word, and save the hero!',
    description: 'Classic Hangman featuring animated SVG scaffold, categorized mystery words (Movies, Animals, Science, Video Games), helpful clue hints, and lives counter.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Easy',
    icon: 'HelpCircle',
    badgeColor: 'rose',
    accentGradient: 'from-rose-600 to-purple-950',
    isMultiplayer: false,
    hasAI: false,
    instructions: {
      overview: 'Guess the mystery word one letter at a time before you run out of lives.',
      rules: [
        'You have 6 incorrect guesses before the hangman drawing is complete.',
        'Each correct guess fills in all occurrences of that letter.',
        'Use category hints to narrow down the word.',
        'Guess all letters correctly to win the round!'
      ],
      controls: [
        'Click any letter on the virtual keyboard or type on your keyboard.',
        'Press the Hint button for a helpful category or synonym clue.'
      ],
      tips: [
        'Common English vowels (E, A, O, I, U) and consonants (T, N, S, R) should be your first picks.'
      ]
    }
  },
  {
    id: 'anagram',
    name: 'Anagram Crafter',
    category: 'word',
    tagline: 'Rearrange scrambled letters to discover all valid words.',
    description: 'Unscramble letters to find the master 6-letter or 7-letter word, plus bonus sub-words of varying lengths. Beat the clock and climb the leaderboards!',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Shuffle',
    badgeColor: 'indigo',
    accentGradient: 'from-indigo-600 to-blue-950',
    isMultiplayer: false,
    hasAI: false,
    instructions: {
      overview: 'Find as many valid words as possible using the provided scrambled letters.',
      rules: [
        'Each word must use only the letters currently provided.',
        'Find the master word that uses all letters to unlock bonus points.',
        'Earn points for each 3, 4, 5, and 6+ letter word discovered.',
        'Complete the word list before time runs out.'
      ],
      controls: [
        'Click letters to spell words, or type them on your keyboard.',
        'Click Shuffle to rearrange the letter order and see new patterns.',
        'Click Submit or press Enter to validate your word.'
      ],
      tips: [
        'Look for common prefixes (UN, RE) and suffixes (ING, ED, ES, LY).'
      ]
    }
  },
  {
    id: 'word_scramble',
    name: 'Word Scramble Sprint',
    category: 'word',
    tagline: 'Speed unscrambler: solve rapid-fire words against the clock!',
    description: 'Fast-paced 60-second word unscramble sprint. Solve as many scrambled words as possible, build up combo multipliers, and earn bonus time for streaks.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Zap',
    badgeColor: 'amber',
    accentGradient: 'from-amber-500 to-red-900',
    isMultiplayer: false,
    hasAI: false,
    isNew: true,
    instructions: {
      overview: 'Unscramble as many words as you can in 60 seconds.',
      rules: [
        'A scrambled word is presented with a clue.',
        'Type the correct unscrambled word and press Enter.',
        'Correct answers add +3 seconds to your timer and increase your score multiplier.',
        'Skip anytime if you get stuck.'
      ],
      controls: [
        'Type your guess into the input field and press Enter.',
        'Click "Shuffle" or "Skip" as needed.'
      ],
      tips: [
        'Read the clue to quickly identify the word category.'
      ]
    }
  },
  {
    id: 'word_connect',
    name: 'Word Connect Dial',
    category: 'word',
    tagline: 'Connect letter wheels to fill the crossword grid.',
    description: 'Swipe or click through letter wheels to form valid words and fill a crossword puzzle grid. Unlock new levels and collect bonus coins for finding extra words.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Easy',
    icon: 'Disc',
    badgeColor: 'violet',
    accentGradient: 'from-violet-600 to-indigo-950',
    isMultiplayer: false,
    hasAI: false,
    instructions: {
      overview: 'Connect letters on the circular wheel to fill in all the blank crossword slots.',
      rules: [
        'Connect letters in sequence by dragging or clicking.',
        'If the formed word matches a crossword slot, it fills in automatically.',
        'Discovering extra valid words gives bonus points.',
        'Fill all crossword slots to clear the level.'
      ],
      controls: [
        'Drag your mouse/finger across the circular letters or click them in order.'
      ],
      tips: [
        'Start with shorter 3-letter words to give yourself visual momentum on the board.'
      ]
    }
  },

  // --- CASUAL / PUZZLE GAMES ---
  {
    id: 'tictactoe',
    name: 'Tic-Tac-Toe Pro',
    category: 'casual',
    tagline: 'The timeless grid game with unbeatable Minimax AI.',
    description: 'Play 3x3 Tic-Tac-Toe with glowing neon styling, multiple AI difficulties (Easy, Medium, Unbeatable Hard Minimax), and local 2-player pass-and-play.',
    players: '2 Players',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'Easy',
    icon: 'Grid',
    badgeColor: 'cyan',
    accentGradient: 'from-cyan-500 to-blue-900',
    isMultiplayer: true,
    hasAI: true,
    isPopular: true,
    instructions: {
      overview: 'Place three of your marks in a horizontal, vertical, or diagonal row to win.',
      rules: [
        'Player 1 is "X" and Player 2/AI is "O".',
        'Players alternate placing their mark in an empty 3x3 square.',
        'First to align 3 consecutive marks wins.',
        'If all 9 squares are filled with no winner, it is a Draw.'
      ],
      controls: [
        'Click any empty grid cell to place your mark.'
      ],
      tips: [
        'Taking the center square or corners gives you the strongest tactical advantage.'
      ]
    }
  },
  {
    id: 'connect_four',
    name: 'Connect Four',
    category: 'casual',
    tagline: 'Drop tokens, build connections, and claim 4-in-a-row.',
    description: 'The vertical checkers classic. Drop colored discs into a 7x6 grid, strategize offensive combos, and block your opponent to connect 4 in any direction.',
    players: '2 Players',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'Medium',
    icon: 'CircleDot',
    badgeColor: 'rose',
    accentGradient: 'from-rose-600 to-indigo-950',
    isMultiplayer: true,
    hasAI: true,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Connect four of your colored discs horizontally, vertically, or diagonally before your opponent.',
      rules: [
        'Players alternate dropping discs into one of 7 columns.',
        'Discs fall to the lowest available space in the chosen column.',
        'First player to connect 4 tokens in a row wins!',
        'Play against AI with smart lookahead or against a friend locally.'
      ],
      controls: [
        'Click on any column to drop a disc into it.'
      ],
      tips: [
        'Center column control is crucial because it participates in the highest number of 4-in-a-row combinations.'
      ]
    }
  },
  {
    id: 'checkers',
    name: 'Checkers Royale',
    category: 'casual',
    tagline: 'Jump over opponents, crown your kings, and dominate.',
    description: 'Standard 8x8 Checkers (Draughts) with diagonal movement, jumping captures, king crowning, multi-jump combos, and AI opponent.',
    players: '2 Players',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'Medium',
    icon: 'ShieldCheck',
    badgeColor: 'red',
    accentGradient: 'from-red-600 to-stone-900',
    isMultiplayer: true,
    hasAI: true,
    isPopular: true,
    instructions: {
      overview: 'Capture all opponent pieces or block them so they have no legal moves.',
      rules: [
        'Pieces move diagonally forward 1 square onto dark squares.',
        'Jumping over an opponent piece captures and removes it from the board.',
        'Multiple jumps in a single turn must be completed if available.',
        'Reaching the opponent\'s back row crowns your piece as a King.',
        'Kings can move and jump both forwards and backwards diagonally.'
      ],
      controls: [
        'Click a piece to select it, then click the highlighted landing square to move.'
      ],
      tips: [
        'Keep your back row intact for as long as possible to prevent opponent pieces from becoming Kings.'
      ]
    }
  },
  {
    id: 'sudoku',
    name: 'Sudoku Master',
    category: 'casual',
    tagline: 'Fill the 9x9 grid with numbers 1 to 9 with pure logic.',
    description: 'Crisp, responsive Sudoku featuring pencil notes mode, difficulty settings (Easy, Medium, Hard, Expert), mistake checker, hints, and elapsed timer.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Binary',
    badgeColor: 'sky',
    accentGradient: 'from-sky-600 to-indigo-950',
    isMultiplayer: false,
    hasAI: false,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Fill every row, column, and 3x3 subgrid with numbers 1 to 9 without repeating any digits.',
      rules: [
        'Each row must contain numbers 1-9 with no duplicates.',
        'Each column must contain numbers 1-9 with no duplicates.',
        'Each of the nine 3x3 subgrids must contain numbers 1-9.',
        'Toggle Notes mode to jot down candidate pencil marks in cells.'
      ],
      controls: [
        'Click a cell to select it, then click a number from the keypad (or press 1-9 on keyboard).',
        'Toggle Pencil/Notes icon to add candidate numbers.',
        'Use Erase or Undo to correct errors.'
      ],
      tips: [
        'Look for rows, columns, or 3x3 boxes that already have 6 or 7 numbers filled in.'
      ]
    }
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper Retro',
    category: 'casual',
    tagline: 'Flag dangerous mines and clear the grid safely.',
    description: 'The definitive Minesweeper experience. Safe first click, flag placement, chord clicking, digital timer & mine counter, and Beginner, Intermediate, & Expert boards.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'Bomb',
    badgeColor: 'amber',
    accentGradient: 'from-amber-600 to-slate-900',
    isMultiplayer: false,
    hasAI: false,
    isPopular: true,
    instructions: {
      overview: 'Uncover all safe squares without detonating any hidden mines.',
      rules: [
        'Numbers indicate how many mines are adjacent to that cell (horizontally, vertically, diagonally).',
        'Uncover all non-mine cells to win.',
        'Clicking on a mine results in an immediate game over!',
        'Right-click or toggle Flag mode to mark suspected mine locations.'
      ],
      controls: [
        'Left click (or tap) to reveal a tile.',
        'Right click (or long-press/toggle Flag button) to place/remove a Flag.',
        'Double-click a revealed number (Chord) to open surrounding non-flagged cells.'
      ],
      tips: [
        'A "1" on a corner always has its mine on the single diagonal neighbor.'
      ]
    }
  },
  {
    id: 'game_2048',
    name: '2048 Neon',
    category: 'casual',
    tagline: 'Slide and merge numbered tiles to reach the legendary 2048!',
    description: 'Smooth sliding tiles, animated merges, undo functionality, score multipliers, keyboard arrow & swipe gestures, and keep-playing mode past 2048.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Medium',
    icon: 'LayoutGrid',
    badgeColor: 'yellow',
    accentGradient: 'from-yellow-600 to-amber-900',
    isMultiplayer: false,
    hasAI: false,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Slide tiles across the 4x4 grid. When two tiles with the same number touch, they merge into one with double the value!',
      rules: [
        'Slide tiles Up, Down, Left, or Right.',
        'Matching tiles collide and merge (2+2=4, 4+4=8, 8+8=16 ... 1024+1024=2048).',
        'A new tile (2 or 4) spawns after every valid move.',
        'Create a 2048 tile to achieve victory, and keep playing for record high scores!'
      ],
      controls: [
        'Use Arrow Keys (or WASD) on keyboard.',
        'Swipe on touchscreen or use the on-screen directional buttons.',
        'Press "Undo" to step back one move.'
      ],
      tips: [
        'Keep your highest value tile anchored in one corner (e.g. bottom-right) and build descending chains.'
      ]
    }
  },
  {
    id: 'snake',
    name: 'Neon Snake',
    category: 'casual',
    tagline: 'Eat glowing orbs, grow longer, and beat high score records!',
    description: 'A glowing retro-arcade Snake game with smooth 60fps movement, bonus fruits, customizable game speeds, solid/pass-through walls, and high score leaderboards.',
    players: '1 Player',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Easy',
    icon: 'Activity',
    badgeColor: 'emerald',
    accentGradient: 'from-emerald-500 to-cyan-950',
    isMultiplayer: false,
    hasAI: false,
    isFeatured: true,
    isPopular: true,
    instructions: {
      overview: 'Guide the snake to consume food, growing longer with every bite without crashing into yourself or walls.',
      rules: [
        'Eat normal food items to earn +10 points and increase length by 1.',
        'Golden bonus orbs appear periodically for bonus points.',
        'Crashing into your own snake body ends the game.',
        'Toggle "Wrap Walls" in settings if you want the snake to wrap around screen edges.'
      ],
      controls: [
        'Use Arrow Keys or WASD on keyboard.',
        'Use on-screen D-pad on mobile / touch devices.'
      ],
      tips: [
        'Move in zigzag paths along the grid perimeter when your snake becomes very long to preserve open turning room.'
      ]
    }
  }
];

export function getGameById(id: string): GameMetadata | undefined {
  return GAMES_CATALOG.find(g => g.id === id);
}

export function getGamesByCategory(category: string): GameMetadata[] {
  if (category === 'all') return GAMES_CATALOG;
  if (category === 'multiplayer') return GAMES_CATALOG.filter(g => g.isMultiplayer);
  return GAMES_CATALOG.filter(g => g.category === category);
}

// Comprehensive English Word Bank for Scrabble, Wordle, Hangman, Anagrams, and Word Search

export const COMMON_WORDS_5: string[] = [
  'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'CHAIR', 'CHEST', 'CLOUD', 'DANCE', 'DREAM', 'EARTH',
  'FLAME', 'FRUIT', 'GHOST', 'GRAPE', 'HEART', 'HOUSE', 'JUICE', 'LIGHT', 'MONEY', 'MUSIC',
  'NIGHT', 'OCEAN', 'PAINT', 'PLANT', 'QUEEN', 'RIVER', 'SHINE', 'SMILE', 'SPACE', 'STORM',
  'SUGAR', 'TIGER', 'TRAIN', 'WATER', 'WORLD', 'ZEBRA', 'ALERT', 'BLOOM', 'CHARM', 'CRANE',
  'DRIVE', 'EAGLE', 'FROST', 'GIANT', 'HONEY', 'IVORY', 'KNIFE', 'LEMON', 'MAGIC', 'NOBLE',
  'ORBIT', 'PIANO', 'QUEST', 'ROBIN', 'SPARK', 'TOWER', 'VOICE', 'WHALE', 'YOUTH', 'SOLAR',
  'CROWN', 'SWORD', 'SHIELD', 'BLAST', 'FLASH', 'PIXEL', 'ARENA', 'CHAMP', 'SKILL', 'LEVEL'
];

export const COMMON_WORDS_6: string[] = [
  'ACTION', 'BEAUTY', 'CASTLE', 'DRAGON', 'ENERGY', 'FLIGHT', 'GALAXY', 'HEROIC', 'ISLAND',
  'JUNGLE', 'KNIGHT', 'LEGEND', 'MASTER', 'NATURE', 'PLANET', 'ROCKET', 'SILVER', 'TEMPLE',
  'VICTOR', 'WIZARD', 'SHADOW', 'PULSE', 'SUMMIT', 'BREEZE', 'CANYON', 'METEOR', 'SPIDER',
  'THUNDER', 'VAULT', 'BRIDGE', 'WONDERS', 'HARBOR', 'PIRATE', 'STREAM', 'CRYSTAL'
];

export const HANGMAN_WORDS: { word: string; category: string; clue: string }[] = [
  { word: 'ASTRONOMY', category: 'Science', clue: 'The study of celestial objects and space' },
  { word: 'CHESSBOARD', category: 'Games', clue: '64 checkered black and white squares' },
  { word: 'FORTRESS', category: 'Architecture', clue: 'A heavily defended castle stronghold' },
  { word: 'MICROPHONE', category: 'Technology', clue: 'Converts sound waves into electrical signals' },
  { word: 'AVALANCHE', category: 'Nature', clue: 'A rapid flow of snow down a mountain slope' },
  { word: 'CHOCOLATE', category: 'Food', clue: 'Sweet confection made from roasted cacao seeds' },
  { word: 'TREASURE', category: 'Adventure', clue: 'Hidden gold, gems, and precious artifacts' },
  { word: 'CHAMELEON', category: 'Animals', clue: 'A reptile known for changing its colors' },
  { word: 'LABYRINTH', category: 'Mythology', clue: 'A complex maze with winding passages' },
  { word: 'HURRICANE', category: 'Weather', clue: 'A tropical storm with high-speed swirling winds' },
  { word: 'TELESCOPE', category: 'Instruments', clue: 'Tool used to observe distant planets and stars' },
  { word: 'SYMPHONY', category: 'Music', clue: 'An elaborate musical composition for full orchestra' },
  { word: 'VOLCANO', category: 'Geology', clue: 'A mountain with a crater that expels lava' },
  { word: 'DOLPHIN', category: 'Marine Life', clue: 'An intelligent marine mammal with a dorsal fin' },
  { word: 'CYBERSPACE', category: 'Technology', clue: 'The virtual online world of computer networks' },
];

export const ANAGRAM_PUZZLES = [
  {
    master: 'GARDEN',
    scramble: 'DNRGAE',
    words: ['GARDEN', 'DANGER', 'GANDER', 'RANGED', 'GRADE', 'GRAND', 'DREAM', 'READ', 'DEAR', 'DARE', 'GEAR', 'RAGE', 'EARN', 'NEAR', 'RED', 'ERA', 'AGE', 'AND', 'DEN']
  },
  {
    master: 'PLANET',
    scramble: 'TELNAP',
    words: ['PLANET', 'PLANT', 'PLATE', 'PLEAT', 'LEAP', 'PALE', 'LANE', 'NEAT', 'TAPE', 'PEAL', 'PANT', 'LATE', 'TALE', 'PLAN', 'PAN', 'TAN', 'NET', 'TEN', 'PET', 'LET', 'ALE']
  },
  {
    master: 'SPRING',
    scramble: 'NPSRGI',
    words: ['SPRING', 'RINGS', 'GRIPS', 'PRING', 'RING', 'SING', 'GRIP', 'PINS', 'PIGS', 'SNIP', 'SPIN', 'RIP', 'PIG', 'PIN', 'SIP', 'SIN', 'SIR']
  },
  {
    master: 'CASTLE',
    scramble: 'STCELA',
    words: ['CASTLE', 'SCALE', 'STALE', 'STEAL', 'SLATE', 'LEAST', 'TALES', 'CAST', 'LATE', 'TALE', 'SALE', 'SEAL', 'LAST', 'SALT', 'CATS', 'ACTS', 'CASE', 'EAST', 'SEAT', 'CAT', 'ACT', 'TEA', 'EAT', 'SET', 'LET']
  },
  {
    master: 'MASTER',
    scramble: 'TSEMRA',
    words: ['MASTER', 'STREAM', 'MATER', 'SMART', 'STARE', 'TEAMS', 'MEATS', 'STEAM', 'TRAMS', 'ARMS', 'RAMS', 'REST', 'STAR', 'SEAT', 'EAST', 'MEAT', 'TEAM', 'STEM', 'RATE', 'MAST', 'MATS', 'ART', 'ARM', 'RAM', 'RAT', 'TAR', 'SEA', 'SET', 'TEA', 'EAT', 'MAT']
  }
];

export const SCRABBLE_DICTIONARY_SET: Set<string> = new Set([
  // Valid 2-letter words
  'AA', 'AB', 'AD', 'AE', 'AG', 'AH', 'AI', 'AL', 'AM', 'AN', 'AR', 'AS', 'AT', 'AW', 'AX', 'AY',
  'BA', 'BE', 'BI', 'BO', 'BY',
  'DA', 'DE', 'DO',
  'ED', 'EF', 'EH', 'EL', 'EM', 'EN', 'ER', 'ES', 'ET', 'EX', 'EY',
  'FA', 'FE',
  'GO',
  'HA', 'HE', 'HI', 'HM', 'HO',
  'ID', 'IF', 'IN', 'IS', 'IT',
  'JO',
  'KA', 'KI',
  'LA', 'LI', 'LO',
  'MA', 'ME', 'MI', 'MM', 'MO', 'MU', 'MY',
  'NA', 'NE', 'NO', 'NU',
  'OD', 'OE', 'OF', 'OH', 'OI', 'OK', 'OM', 'ON', 'OP', 'OR', 'OS', 'OW', 'OX', 'OY',
  'PA', 'PE', 'PI', 'PO',
  'QI',
  'RE',
  'SH', 'SI', 'SO',
  'TA', 'TI', 'TO',
  'UH', 'UM', 'UN', 'UP', 'US', 'UT',
  'WE', 'WO',
  'XI', 'XU',
  'YA', 'YE', 'YO',
  'ZA',

  // 3 to 8 letter common dictionary words
  'ACE', 'ACT', 'ADD', 'AGE', 'AGO', 'AID', 'AIM', 'AIR', 'ALL', 'AND', 'ANT', 'ANY', 'APE', 'APT', 'ARC', 'ARE', 'ARM', 'ART', 'ASH', 'ASK', 'AWE', 'AXE',
  'BAD', 'BAG', 'BAR', 'BAT', 'BAY', 'BED', 'BEE', 'BEG', 'BET', 'BIG', 'BIN', 'BIT', 'BOB', 'BOG', 'BOY', 'BOX', 'BUG', 'BUS', 'BUT', 'BUY',
  'CAB', 'CAN', 'CAP', 'CAR', 'CAT', 'COW', 'CRY', 'CUP', 'CUT',
  'DAD', 'DAM', 'DAY', 'DEN', 'DEW', 'DIG', 'DIM', 'DIP', 'DOG', 'DOT', 'DRY', 'DUE',
  'EAR', 'EAT', 'EGG', 'EGO', 'ELK', 'ELM', 'END', 'ERA', 'EYE',
  'FAN', 'FAR', 'FAT', 'FEW', 'FIG', 'FIN', 'FIT', 'FLY', 'FOG', 'FOR', 'FOX', 'FUN', 'FUR',
  'GAP', 'GAS', 'GEL', 'GEM', 'GET', 'GIN', 'GLAD', 'GOD', 'GUM', 'GUN', 'GUT', 'GUY', 'GYM',
  'HAD', 'HAM', 'HAT', 'HAY', 'HEN', 'HER', 'HEX', 'HID', 'HIM', 'HIP', 'HIT', 'HOP', 'HOT', 'HOW', 'HUB', 'HUG', 'HUM', 'HUT',
  'ICE', 'ILL', 'INK', 'INN', 'ION', 'IRK', 'ITS', 'IVY',
  'JAM', 'JAR', 'JAW', 'JAY', 'JET', 'JIG', 'JOB', 'JOG', 'JOY', 'JUG',
  'KEG', 'KEY', 'KID', 'KIN', 'KIT',
  'LAB', 'LAD', 'LAP', 'LAW', 'LAY', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LIT', 'LOG', 'LOT', 'LOW',
  'MAD', 'MAN', 'MAP', 'MAT', 'MAY', 'MEN', 'MET', 'MID', 'MIX', 'MOM', 'MOP', 'MUD', 'MUG',
  'NAP', 'NET', 'NEW', 'NIP', 'NOD', 'NOT', 'NOW', 'NUT',
  'OAK', 'OAR', 'OAT', 'ODD', 'OFF', 'OIL', 'OLD', 'ONE', 'OPT', 'ORB', 'OUR', 'OUT', 'OWL', 'OWN',
  'PAD', 'PAN', 'PAY', 'PEA', 'PEG', 'PEN', 'PET', 'PIG', 'PIN', 'PIT', 'PLY', 'POD', 'POP', 'POT',
  'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROW', 'RUB', 'RUG', 'RUN', 'RUT',
  'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SEE', 'SET', 'SEW', 'SHE', 'SHY', 'SIN', 'SIP', 'SIR', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SON', 'SOW', 'SPY', 'SUM', 'SUN',
  'TAB', 'TAG', 'TAN', 'TAP', 'TAR', 'TAX', 'TEA', 'TEN', 'THE', 'TIE', 'TIN', 'TIP', 'TOE', 'TOP', 'TOY', 'TRY', 'TUB', 'TWO',
  'URN', 'USE',
  'VAN', 'VAT', 'VET', 'VOW',
  'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WET', 'WHO', 'WHY', 'WIN', 'WOK', 'WON', 'WOW',
  'YAK', 'YAM', 'YAP', 'YEA', 'YES', 'YET', 'YOU', 'ZIP', 'ZOO',

  // 4-letter words
  'ABLE', 'ACID', 'AGED', 'ALSO', 'AREA', 'ARMY', 'AWAY', 'BABY', 'BACK', 'BALL', 'BAND', 'BANK', 'BASE', 'BATH', 'BEAR', 'BEAT', 'BEEN', 'BEER', 'BELL', 'BELT', 'BEST', 'BIRD', 'BLOW', 'BLUE', 'BOAT', 'BODY', 'BOMB', 'BOND', 'BONE', 'BOOK', 'BOOM', 'BORN', 'BOSS', 'BOTH', 'BOWL', 'BULK', 'BURN', 'BUSH', 'BUSY', 'CALL', 'CALM', 'CAMP', 'CARD', 'CARE', 'CASE', 'CASH', 'CAST', 'CELL', 'CHAT', 'CHIP', 'CITY', 'CLUB', 'COAL', 'COAT', 'CODE', 'COLD', 'COME', 'COOK', 'COOL', 'COPE', 'COPY', 'CORE', 'COST', 'CREW', 'CROP', 'DARK', 'DATA', 'DATE', 'DAWN', 'DAYS', 'DEAD', 'DEAL', 'DEAN', 'DEAR', 'DEBT', 'DEEP', 'DENY', 'DESK', 'DIAL', 'DIET', 'DISC', 'DISK', 'DOES', 'DONE', 'DOOR', 'DOSE', 'DOWN', 'DRAW', 'DREW', 'DROP', 'DRUG', 'DUAL', 'DUKE', 'DUST', 'DUTY', 'EACH', 'EARN', 'EASY', 'EDGE', 'ELSE', 'EVEN', 'EVER', 'EVIL', 'EXIT', 'FACE', 'FACT', 'FAIR', 'FALL', 'FARM', 'FAST', 'FATE', 'FEAR', 'FEED', 'FEEL', 'FEET', 'FELL', 'FELT', 'FILE', 'FILL', 'FILM', 'FIND', 'FINE', 'FIRE', 'FIRM', 'FISH', 'FIVE', 'FLAT', 'FLOW', 'FOOD', 'FOOT', 'FORM', 'FORT', 'FOUR', 'FREE', 'FROM', 'FUEL', 'FULL', 'FUND', 'GAIN', 'GAME', 'GATE', 'GAVE', 'GEAR', 'GENE', 'GIFT', 'GIRL', 'GIVE', 'GLAD', 'GOAL', 'GOES', 'GOLD', 'GOLF', 'GONE', 'GOOD', 'GRAY', 'GREW', 'GREY', 'GROW', 'GULF', 'HAIR', 'HALF', 'HALL', 'HAND', 'HANG', 'HARD', 'HARM', 'HATE', 'HAVE', 'HEAD', 'HEAR', 'HEAT', 'HELD', 'HELL', 'HELP', 'HERE', 'HERO', 'HIGH', 'HILL', 'HIRE', 'HOLD', 'HOLE', 'HOLY', 'HOME', 'HOPE', 'HOST', 'HOUR', 'HUGE', 'HUNG', 'HUNT', 'HURT', 'IDEA', 'INCH', 'INTO', 'IRON', 'ITEM', 'JACK', 'JANE', 'JEAN', 'JOIN', 'JUMP', 'JURY', 'JUST', 'KEEN', 'KEEP', 'KEPT', 'KICK', 'KILL', 'KIND', 'KING', 'KNEE', 'KNEW', 'KNOW', 'LACK', 'LADY', 'LAID', 'LAKE', 'LAND', 'LANE', 'LAST', 'LATE', 'LEAD', 'LEFT', 'LESS', 'LIFE', 'LIFT', 'LIKE', 'LINE', 'LINK', 'LION', 'LIST', 'LIVE', 'LOAD', 'LOAN', 'LOCK', 'LOGO', 'LONG', 'LOOK', 'LORD', 'LOSE', 'LOSS', 'LOST', 'LOVE', 'LUCK', 'MADE', 'MAIL', 'MAIN', 'MAKE', 'MALE', 'MANY', 'MARK', 'MASS', 'MEAL', 'MEAN', 'MEAT', 'MEET', 'MENU', 'MERE', 'MIKE', 'MILE', 'MILK', 'MILL', 'MIND', 'MINE', 'MISS', 'MODE', 'MOOD', 'MOON', 'MORE', 'MOST', 'MOVE', 'MUCH', 'MUST', 'NAME', 'NAVY', 'NEAR', 'NECK', 'NEED', 'NEWS', 'NEXT', 'NICE', 'NICK', 'NINE', 'NODE', 'NONE', 'NOSE', 'NOTE', 'OKAY', 'ONCE', 'ONLY', 'ONTO', 'OPEN', 'ORAL', 'OVER', 'PACE', 'PACK', 'PAGE', 'PAID', 'PAIN', 'PAIR', 'PALM', 'PARK', 'PART', 'PASS', 'PAST', 'PATH', 'PEAK', 'PEER', 'PICK', 'PILE', 'PINK', 'PIPE', 'PLAN', 'PLAY', 'PLOT', 'PLUG', 'PLUS', 'POLL', 'POOL', 'POOR', 'PORT', 'POST', 'PRAY', 'PURE', 'PUSH', 'RACE', 'RAIL', 'RAIN', 'RANK', 'RARE', 'RATE', 'READ', 'REAL', 'REAR', 'RELY', 'RENT', 'REST', 'RICE', 'RICH', 'RIDE', 'RING', 'RISE', 'RISK', 'ROAD', 'ROCK', 'ROLE', 'ROOF', 'ROOM', 'ROOT', 'ROPE', 'ROSE', 'RULE', 'RUSH', 'SAFE', 'SAID', 'SAKE', 'SALE', 'SALT', 'SAME', 'SAND', 'SAVE', 'SEAT', 'SEED', 'SEEK', 'SEEM', 'SEEN', 'SELF', 'SELL', 'SEND', 'SENT', 'SEPT', 'SHIP', 'SHOP', 'SHOT', 'SHOW', 'SHUT', 'SICK', 'SIDE', 'SIGN', 'SILK', 'SITE', 'SIZE', 'SKIN', 'SLIP', 'SLOW', 'SNOW', 'SOFT', 'SOIL', 'SOLD', 'SOLE', 'SOME', 'SONG', 'SOON', 'SORT', 'SOUL', 'SPOT', 'STAR', 'STAY', 'STEP', 'STOP', 'SUCH', 'SUIT', 'SURE', 'TAKE', 'TALE', 'TALK', 'TALL', 'TANK', 'TAPE', 'TASK', 'TEAM', 'TECH', 'TELL', 'TEND', 'TERM', 'TEST', 'TEXT', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY', 'THIN', 'THIS', 'THOU', 'THUS', 'TIDE', 'TILL', 'TIME', 'TINY', 'TOLL', 'TONE', 'TONY', 'TOOK', 'TOOL', 'TOUR', 'TOWN', 'TREE', 'TRIP', 'TRUE', 'TUBE', 'TURN', 'TWIN', 'TYPE', 'UNIT', 'UPON', 'USED', 'USER', 'VARY', 'VAST', 'VERY', 'VICE', 'VIEW', 'VOTE', 'WAGE', 'WAIT', 'WAKE', 'WALK', 'WALL', 'WANT', 'WARD', 'WARM', 'WASH', 'WAVE', 'WAYS', 'WEAK', 'WEAR', 'WEEK', 'WELL', 'WENT', 'WERE', 'WEST', 'WHAT', 'WHEN', 'WHOM', 'WIDE', 'WIFE', 'WILD', 'WILL', 'WIND', 'WINE', 'WING', 'WIPE', 'WIRE', 'WISE', 'WISH', 'WITH', 'WOOD', 'WORD', 'WORK', 'YARD', 'YEAH', 'YEAR', 'YOUR', 'ZERO', 'ZONE',

  // 5+ letter common words
  ...COMMON_WORDS_5,
  ...COMMON_WORDS_6
]);

export function isValidScrabbleWord(word: string): boolean {
  if (!word || word.length < 2) return false;
  return SCRABBLE_DICTIONARY_SET.has(word.toUpperCase());
}

export function isValid5LetterWord(word: string): boolean {
  if (!word || word.length !== 5) return false;
  const upper = word.toUpperCase();
  return SCRABBLE_DICTIONARY_SET.has(upper) || COMMON_WORDS_5.includes(upper);
}


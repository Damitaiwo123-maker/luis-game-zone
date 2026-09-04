import React from 'react';
import { useGame } from '../../context/GameContext';
import { LudoGame } from '../../games/board/LudoGame';
import { ChessGame } from '../../games/board/ChessGame';
import { ScrabbleGame } from '../../games/board/ScrabbleGame';
import { SolitaireGame } from '../../games/card/SolitaireGame';
import { ColorClashGame } from '../../games/card/ColorClashGame';
import { BlackjackGame } from '../../games/card/BlackjackGame';
import { MemoryMatchGame } from '../../games/card/MemoryMatchGame';
import { WarGame } from '../../games/card/WarGame';
import { WordGuessGame } from '../../games/word/WordGuessGame';
import { WordSearchGame } from '../../games/word/WordSearchGame';
import { HangmanGame } from '../../games/word/HangmanGame';
import { TicTacToeGame } from '../../games/casual/TicTacToeGame';
import { ConnectFourGame } from '../../games/casual/ConnectFourGame';
import { Game2048 } from '../../games/casual/Game2048';
import { SnakeGame } from '../../games/casual/SnakeGame';
import { MinesweeperGame } from '../../games/casual/MinesweeperGame';
import { CheckersGame } from '../../games/casual/CheckersGame';

// New Action, Racing, FPS, Aim, and Arcade games
import { TurboKartRushGame } from '../../games/racing/TurboKartRushGame';
import { AimArenaGame } from '../../games/aim/AimArenaGame';
import { NeonStrikeGame } from '../../games/fps/NeonStrikeGame';
import { GalaxyDefenderGame } from '../../games/arcade/GalaxyDefenderGame';
import { CyberSprintGame } from '../../games/arcade/CyberSprintGame';
import { NeonJumpGame } from '../../games/arcade/NeonJumpGame';
import { QuantumBreakerGame } from '../../games/arcade/QuantumBreakerGame';
import { RobotArenaGame } from '../../games/action/RobotArenaGame';
import { AlienDefenseGame } from '../../games/action/AlienDefenseGame';

export const GameView: React.FC = () => {
  const { activeGameId } = useGame();

  if (!activeGameId) return null;

  switch (activeGameId) {
    // Action, Racing, Aim, FPS & Arcade
    case 'turbo_kart':
      return <TurboKartRushGame />;
    case 'aim_arena':
      return <AimArenaGame />;
    case 'neon_strike':
      return <NeonStrikeGame />;
    case 'galaxy_defender':
      return <GalaxyDefenderGame />;
    case 'cyber_sprint':
      return <CyberSprintGame />;
    case 'neon_jump':
      return <NeonJumpGame />;
    case 'quantum_breaker':
      return <QuantumBreakerGame />;
    case 'robot_arena':
      return <RobotArenaGame />;
    case 'alien_defense':
      return <AlienDefenseGame />;

    // Classic Board, Card, Word & Casual
    case 'ludo':
      return <LudoGame />;
    case 'chess':
      return <ChessGame />;
    case 'scrabble':
      return <ScrabbleGame />;
    case 'solitaire':
      return <SolitaireGame />;
    case 'color_clash':
      return <ColorClashGame />;
    case 'blackjack':
      return <BlackjackGame />;
    case 'memory_match':
      return <MemoryMatchGame />;
    case 'war':
      return <WarGame />;
    case 'word_guess':
      return <WordGuessGame />;
    case 'word_search':
      return <WordSearchGame />;
    case 'hangman':
      return <HangmanGame />;
    case 'tictactoe':
      return <TicTacToeGame />;
    case 'connect_four':
      return <ConnectFourGame />;
    case 'game_2048':
      return <Game2048 />;
    case 'snake':
      return <SnakeGame />;
    case 'minesweeper':
      return <MinesweeperGame />;
    case 'checkers':
      return <CheckersGame />;
    default:
      return <TicTacToeGame />;
  }
};


import { Card } from './card';

export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: Card[];
  graveyard: Card[];
  hasPlayedCardThisTurn: boolean;
}

export interface GameState {
  players: [Player, Player];
  currentPlayerIndex: number;
  turn: number;
  gamePhase: 'menu' | 'setup' | 'playing' | 'gameover';
  winner: Player | null;
  logs: string[];
}

export type GamePhase = GameState['gamePhase'];
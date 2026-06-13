import { GameConfig } from '../config/gameConfig';

export type Element = typeof GameConfig.ELEMENTS[number];
export type CardType = 'minion' | 'spell' | 'weapon';
export type Rarity   = 'common' | 'rare' | 'epic' | 'legendary';
export type GamePhase = 'home' | 'playing' | 'gameover';
export type TurnPhase =
  | 'draw'
  | 'main1'
  | 'attack'
  | 'defense'
  | 'main2'
  | 'end';

export interface Card {
  id: string;
  name: string;
  description?: string;
  cost: number;       // Coût en mana
  attack: number;     // Dégâts (0 pour les sorts)
  health: number;     // PV actuels
  maxHealth: number;  // PV maximum
  type: CardType;
  element: Element;
  rarity: Rarity;
  version: string;    // Pour la gestion des mises à jour de cartes
}

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
  currentPlayerIndex: 0 | 1;
  turn: number;
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  winner: Player | null;
  logs: string[];
}
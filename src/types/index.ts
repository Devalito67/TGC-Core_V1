// ─── Primitives ───────────────────────────────────────────────────────────────
import { GameConfig } from '../config/gameConfig';

export type Element   = typeof GameConfig.ELEMENTS[number];
export type CardType  = 'minion' | 'spell' | 'weapon';
export type Rarity    = 'common' | 'rare' | 'epic' | 'legendary';
export type GamePhase = 'home' | 'playing' | 'gameover';
export type TurnPhase = 'draw' | 'main1' | 'attack' | 'defense' | 'main2' | 'end';

// ─── Card ─────────────────────────────────────────────────────────────────────
export interface Card {
  id: string;
  name: string;
  description?: string;
  cost: number;
  attack: number;
  defense: number;
  type: CardType;
  element: Element;
  effects?: string[];
  rarity: Rarity;
  version: string;
  // ── état de combat ──
  summoningSickness?: boolean; // true = vient d\'être joué, ne peut pas attaquer
  tapped?: boolean;            // true = a attaqué ou bloqué ce tour
}

// ─── Player ───────────────────────────────────────────────────────────────────
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

// ─── Combat ───────────────────────────────────────────────────────────────────
export type CombatTargetType = 'hero' | 'unit';

export interface CombatAttack {
  attackerId: string;
  targetType: CombatTargetType;
  targetId?: string; // défini seulement si targetType === 'unit'
}

export interface CombatBlock {
  attackerId: string; // l\'attaquant ciblant le héros qui est bloqué
  blockerId: string;  // le monstre défenseur
}

// phase interne du combat (sous-état de turnPhase=\'attack\' et \'defense\')
export type CombatPhase =
  | 'idle'               // hors combat
  | 'declaringAttacks'   // joueur actif déclare ses attaquants
  | 'declaringDefenses'  // joueur adverse déclare ses bloqueurs
  | 'resolving';         // résolution en cours (transitoire)

export interface CombatState {
  phase: CombatPhase;
  attacks: CombatAttack[];
  blocks: CombatBlock[];
}

// ─── GameState ────────────────────────────────────────────────────────────────
export interface GameState {
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  turn: number;
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  winner: Player | null;
  logs: string[];
  combat: CombatState; // intégré directement, plus de ExtendedGameState
}
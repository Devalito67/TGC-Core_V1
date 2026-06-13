import { create } from 'zustand';
import { Card, GameState, Player, TurnPhase } from '../types';
import { baseRules } from '../rules';
import { GameConfig } from '../config/gameConfig';
import { generateId } from '../utils/generateId';

interface GameStore {
  state: GameState;
  initializeGame: (deck1: Card[], deck2: Card[], player1Name: string, player2Name: string) => void;
  drawCard: () => void;
  playCard: (card: Card) => void;
  endTurn: () => void;
  attackWithCard: (attackerId: string, defenderId: string) => void;
  attackPlayer: (attackerId: string) => void;
  resetGame: () => void;
  playSpell: (card: Card, targetCardId?: string) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  nextTurnPhase: () => void;
}

const createInitialPlayer = (deck: Card[], name: string): Player => ({
  id: generateId(),
  name,
  health: GameConfig.PLAYER_STARTING_HEALTH,
  maxHealth: GameConfig.PLAYER_MAX_HEALTH,
  mana: 0,
  maxMana: 0,
  deck: [...deck].sort(() => Math.random() - 0.5),
  hand: [],
  board: [],
  graveyard: [],
  hasPlayedCardThisTurn: false,
});

const emptyPlayer: Player = {
  id: '',
  name: '',
  health: 30,
  maxHealth: 30,
  mana: 0,
  maxMana: 0,
  deck: [],
  hand: [],
  board: [],
  graveyard: [],
  hasPlayedCardThisTurn: false,
};

const initialState: GameState = {
  players: [emptyPlayer, emptyPlayer],
  currentPlayerIndex: 0,
  turn: 1,
  gamePhase: 'home' as const,
  turnPhase: 'draw',
  winner: null,
  logs: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: initialState,

  initializeGame: (deck1, deck2, player1Name, player2Name) => {
    const player1 = createInitialPlayer(deck1, player1Name);
    const player2 = createInitialPlayer(deck2, player2Name);

    let newState: GameState = {
      players: [player1, player2],
      currentPlayerIndex: 0,
      turn: 1,
      gamePhase: 'playing' as const,
      turnPhase: 'main1',
      winner: null,
      logs: ['⚔️ Que la bataille commence !'],
    };

    // Tour de départ : mana joueur 1
    newState = baseRules.onTurnStart(newState, newState.players[0]);

    // ✅ Pioche initiale joueur 1
    for (let i = 0; i < GameConfig.STARTING_HAND_SIZE; i++) {
      newState = baseRules.onCardDraw(newState, newState.players[0]);
    }

    // ✅ Pioche initiale joueur 2
    for (let i = 0; i < GameConfig.STARTING_HAND_SIZE; i++) {
      newState = baseRules.onCardDraw(newState, newState.players[1]);
    }

    set({ state: newState });
  },

  drawCard: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'draw') return;

    const player = state.players[state.currentPlayerIndex];
    const newState = baseRules.onCardDraw(state, player);

    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : { ...newState, turnPhase: 'main1' }
    });
  },

  playCard: (card) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'main1' && state.turnPhase !== 'main2') return;

    const player = state.players[state.currentPlayerIndex];
    const newState = baseRules.onCardPlay(state, player, card);

    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState
    });
  },

  endTurn: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;

    const newState = baseRules.onEndTurn(state);

    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : { ...newState, turnPhase: 'draw' }
    });
  },

  attackWithCard: (attackerId, defenderId) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'attack') return;

    const player = state.players[state.currentPlayerIndex];
    const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    const opponent = state.players[opponentIndex];

    const attacker = player.board.find(c => c.id === attackerId);
    const defender = opponent.board.find(c => c.id === defenderId);

    if (!attacker || !defender) return;

    const { damage: dmgToDefender } = baseRules.calculateAttack(attacker, defender);
    const { damage: dmgToAttacker } = baseRules.calculateAttack(defender, attacker);

    // Applique les dégâts des deux côtés
    const newAttackerBoard = player.board
      .map(c => c.id === attackerId ? { ...c, health: c.health - dmgToAttacker } : c)
      .filter(c => c.health > 0);

    const newDefenderBoard = opponent.board
      .map(c => c.id === defenderId ? { ...c, health: c.health - dmgToDefender } : c)
      .filter(c => c.health > 0);

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[state.currentPlayerIndex] = { ...player, board: newAttackerBoard };
    newPlayers[opponentIndex] = { ...opponent, board: newDefenderBoard };

    const newState: GameState = {
      ...state,
      players: newPlayers,
      logs: [
        ...state.logs,
        `⚔️ ${attacker.name} attaque ${defender.name} (${dmgToDefender} dégâts)`,
      ],
    };

    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState
    });
  },

  attackPlayer: (attackerId) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'attack') return;

    const player = state.players[state.currentPlayerIndex];
    const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    const opponent = state.players[opponentIndex];

    const attacker = player.board.find(c => c.id === attackerId);
    if (!attacker) return;

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[opponentIndex] = {
      ...opponent,
      health: opponent.health - attacker.attack,
    };

    const newState: GameState = {
      ...state,
      players: newPlayers,
      logs: [
        ...state.logs,
        `💥 ${attacker.name} attaque ${opponent.name} directement (-${attacker.attack} PV)`,
      ],
    };

    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState
    });
  },

  resetGame: () => {
    set({ state: initialState });
  },

  playSpell: (card, targetCardId?) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'main1' && state.turnPhase !== 'main2') return;

    const player = state.players[state.currentPlayerIndex];
    const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    const opponent = state.players[opponentIndex];

    // Résout la cible si besoin
    const target = targetCardId
      ? opponent.board.find(c => c.id === targetCardId)
      : undefined;

    const newState = baseRules.onCardPlay(state, player, card, target);
    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState
    });
  },

  setTurnPhase: (phase) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;

    set({
      state: {
        ...state,
        turnPhase: phase,
      },
    });
  },

  nextTurnPhase: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;

    const phaseOrder: TurnPhase[] = ['draw', 'main1', 'attack', 'defense', 'main2', 'end'];
    const currentIndex = phaseOrder.indexOf(state.turnPhase);

    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) return;

    set({
      state: {
        ...state,
        turnPhase: phaseOrder[currentIndex + 1],
      },
    });
  },
}));
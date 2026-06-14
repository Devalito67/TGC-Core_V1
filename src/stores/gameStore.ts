import { create } from 'zustand';
import { Card, GameState, Player, TurnPhase } from '../types';
import { baseRules } from '../rules';
import { GameConfig } from '../config/gameConfig';
import { generateId } from '../utils';

type AttackTarget = {
  type: 'hero' | 'unit';
  targetId?: string;
};

type PendingAttack = {
  attackerId: string;
  target: AttackTarget;
};

type PendingDefense = {
  attackerId: string;
  blockerId: string;
};

interface CombatState {
  pendingAttacks: PendingAttack[];
  pendingDefenses: PendingDefense[];
  attackConfirmed: boolean;
  defenseConfirmed: boolean;
}

interface ExtendedGameState extends GameState {
  combat: CombatState;
}

interface GameStore {
  state: ExtendedGameState;
  initializeGame: (deck1: Card[], deck2: Card[], player1Name: string, player2Name: string) => void;
  resolveDrawPhase: () => void;
  playCard: (card: Card) => void;
  endTurn: () => void;
  resetGame: () => void;
  playSpell: (card: Card, targetCardId?: string) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  nextTurnPhase: () => void;
  selectAttackTarget: (attackerId: string, target: AttackTarget) => void;
  removePendingAttack: (attackerId: string) => void;
  confirmAttackPhase: () => void;
  assignDefender: (attackerId: string, blockerId: string) => void;
  cancelDefense: (attackerId: string) => void;
  confirmDefensePhase: () => void;
  resolveCombatPhase: () => void;
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

const emptyCombatState: CombatState = {
  pendingAttacks: [],
  pendingDefenses: [],
  attackConfirmed: false,
  defenseConfirmed: false,
};

const initialState: ExtendedGameState = {
  players: [emptyPlayer, emptyPlayer],
  currentPlayerIndex: 0,
  turn: 1,
  gamePhase: 'home' as const,
  turnPhase: 'main1',
  winner: null,
  logs: [],
  combat: emptyCombatState,
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: initialState,

  initializeGame: (deck1, deck2, player1Name, player2Name) => {
    const player1 = createInitialPlayer(deck1, player1Name);
    const player2 = createInitialPlayer(deck2, player2Name);

    let newState: ExtendedGameState = {
      players: [player1, player2],
      currentPlayerIndex: 0,
      turn: 1,
      gamePhase: 'playing' as const,
      turnPhase: 'main1',
      winner: null,
      logs: ['⚔️ Que la bataille commence !'],
      combat: emptyCombatState,
    };

    newState = {
      ...(baseRules.onTurnStart(newState, newState.players[0]) as ExtendedGameState),
      combat: emptyCombatState,
    };

    for (let i = 0; i < GameConfig.STARTING_HAND_SIZE; i++) {
      newState = baseRules.onCardDraw(newState, newState.players[0]) as ExtendedGameState;
    }

    for (let i = 0; i < GameConfig.STARTING_HAND_SIZE; i++) {
      newState = baseRules.onCardDraw(newState, newState.players[1]) as ExtendedGameState;
    }

    set({ state: newState });
  },

  resolveDrawPhase: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'draw') return;

    const player = state.players[state.currentPlayerIndex];
    const newState = baseRules.onCardDraw(state, player) as ExtendedGameState;
    const winner = baseRules.checkWinCondition(newState);

    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : { ...newState, turnPhase: 'main1' },
    });
  },

  playCard: (card) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'main1' && state.turnPhase !== 'main2') return;

    const player = state.players[state.currentPlayerIndex];
    const newState = baseRules.onCardPlay(state, player, card) as ExtendedGameState;
    const winner = baseRules.checkWinCondition(newState);

    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState,
    });
  },

  endTurn: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;

    const nextPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    const turnIncrement = nextPlayerIndex === 0 ? 1 : 0;

    let newState: ExtendedGameState = {
      ...state,
      currentPlayerIndex: nextPlayerIndex,
      turn: state.turn + turnIncrement,
      turnPhase: 'draw',
      combat: emptyCombatState,
    };

    const nextPlayer = newState.players[nextPlayerIndex];
    newState = {
      ...(baseRules.onTurnStart(newState, nextPlayer) as ExtendedGameState),
      combat: emptyCombatState,
    };

    const winner = baseRules.checkWinCondition(newState);
    if (winner) {
      set({
        state: { ...newState, gamePhase: 'gameover', winner },
      });
      return;
    }

    set({ state: newState });
    get().resolveDrawPhase();
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

    const target = targetCardId
      ? opponent.board.find(c => c.id === targetCardId)
      : undefined;

    const newState = baseRules.onCardPlay(state, player, card, target) as ExtendedGameState;
    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState,
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

    const phaseOrder: TurnPhase[] = ['main1', 'attack', 'defense', 'main2', 'end'];
    const currentIndex = phaseOrder.indexOf(state.turnPhase);

    if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) return;

    set({
      state: {
        ...state,
        turnPhase: phaseOrder[currentIndex + 1],
      },
    });
  },

  selectAttackTarget: (attackerId, target) => {
    const { state } = get();
    if (state.gamePhase !== 'playing' || state.turnPhase !== 'attack') return;

    const player = state.players[state.currentPlayerIndex];
    const attacker = player.board.find(c => c.id === attackerId);
    if (!attacker) return;
    if (attacker.summoningSickness) return;

    const nextPendingAttacks = state.combat.pendingAttacks.filter(a => a.attackerId !== attackerId);
    nextPendingAttacks.push({ attackerId, target });

    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          pendingAttacks: nextPendingAttacks,
          attackConfirmed: false,
        },
      },
    });
  },

  removePendingAttack: (attackerId) => {
    const { state } = get();
    if (state.gamePhase !== 'playing' || state.turnPhase !== 'attack') return;

    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          pendingAttacks: state.combat.pendingAttacks.filter(a => a.attackerId !== attackerId),
          pendingDefenses: state.combat.pendingDefenses.filter(d => d.attackerId !== attackerId),
          attackConfirmed: false,
          defenseConfirmed: false,
        },
      },
    });
  },

  confirmAttackPhase: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing' || state.turnPhase !== 'attack') return;

    set({
      state: {
        ...state,
        turnPhase: 'defense',
        combat: {
          ...state.combat,
          attackConfirmed: true,
          defenseConfirmed: false,
          pendingDefenses: [],
        },
      },
    });
  },

  assignDefender: (attackerId, blockerId) => {
    const { state } = get();
    if (state.gamePhase !== 'playing' || state.turnPhase !== 'defense') return;

    const defenderIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    const defenderPlayer = state.players[defenderIndex];

    const attack = state.combat.pendingAttacks.find(a => a.attackerId === attackerId);
    if (!attack) return;
    if (attack.target.type !== 'hero') return;

    const blocker = defenderPlayer.board.find(c => c.id === blockerId);
    if (!blocker) return;

    const blockerAlreadyAssigned = state.combat.pendingDefenses.some(d => d.blockerId === blockerId);
    if (blockerAlreadyAssigned) return;

    const nextPendingDefenses = state.combat.pendingDefenses.filter(d => d.attackerId !== attackerId);
    nextPendingDefenses.push({ attackerId, blockerId });

    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          pendingDefenses: nextPendingDefenses,
          defenseConfirmed: false,
        },
      },
    });
  },

  cancelDefense: (attackerId) => {
    const { state } = get();
    if (state.gamePhase !== 'playing' || state.turnPhase !== 'defense') return;

    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          pendingDefenses: state.combat.pendingDefenses.filter(d => d.attackerId !== attackerId),
          defenseConfirmed: false,
        },
      },
    });
  },

  confirmDefensePhase: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing' || state.turnPhase !== 'defense') return;

    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          defenseConfirmed: true,
        },
      },
    });

    get().resolveCombatPhase();
  },

  resolveCombatPhase: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;

    const attackerIndex = state.currentPlayerIndex;
    const defenderIndex = attackerIndex === 0 ? 1 : 0;

    const attackerPlayer = state.players[attackerIndex];
    const defenderPlayer = state.players[defenderIndex];

    let updatedAttackerBoard = [...attackerPlayer.board];
    let updatedDefenderBoard = [...defenderPlayer.board];
    let updatedDefenderHealth = defenderPlayer.health;
    const combatLogs = [...state.logs];

    for (const attack of state.combat.pendingAttacks) {
      const attacker = updatedAttackerBoard.find(c => c.id === attack.attackerId);
      if (!attacker) continue;

      const assignedDefense = state.combat.pendingDefenses.find(d => d.attackerId === attack.attackerId);

      if (assignedDefense) {
        const blocker = updatedDefenderBoard.find(c => c.id === assignedDefense.blockerId);
        if (!blocker) continue;

        const { damage: dmgToBlocker } = baseRules.calculateAttack(attacker, blocker);
        const { damage: dmgToAttacker } = baseRules.calculateAttack(blocker, attacker);

        updatedAttackerBoard = updatedAttackerBoard
          .map(c => c.id === attacker.id ? { ...c, health: c.health - dmgToAttacker } : c)
          .filter(c => c.health > 0);

        updatedDefenderBoard = updatedDefenderBoard
          .map(c => c.id === blocker.id ? { ...c, health: c.health - dmgToBlocker } : c)
          .filter(c => c.health > 0);

        combatLogs.push(`🛡️ ${blocker.name} bloque ${attacker.name} (${dmgToBlocker}/${dmgToAttacker})`);
        continue;
      }

      if (attack.target.type === 'hero') {
        updatedDefenderHealth -= attacker.attack;
        combatLogs.push(`💥 ${attacker.name} attaque ${defenderPlayer.name} directement (-${attacker.attack} PV)`);
        continue;
      }

      if (attack.target.type === 'unit' && attack.target.targetId) {
        const targetUnit = updatedDefenderBoard.find(c => c.id === attack.target.targetId);
        if (!targetUnit) continue;

        const { damage: dmgToDefender } = baseRules.calculateAttack(attacker, targetUnit);
        const { damage: dmgToAttacker } = baseRules.calculateAttack(targetUnit, attacker);

        updatedAttackerBoard = updatedAttackerBoard
          .map(c => c.id === attacker.id ? { ...c, health: c.health - dmgToAttacker } : c)
          .filter(c => c.health > 0);

        updatedDefenderBoard = updatedDefenderBoard
          .map(c => c.id === targetUnit.id ? { ...c, health: c.health - dmgToDefender } : c)
          .filter(c => c.health > 0);

        combatLogs.push(`⚔️ ${attacker.name} attaque ${targetUnit.name} (${dmgToDefender}/${dmgToAttacker})`);
      }
    }

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[attackerIndex] = { ...attackerPlayer, board: updatedAttackerBoard };
    newPlayers[defenderIndex] = {
      ...defenderPlayer,
      board: updatedDefenderBoard,
      health: updatedDefenderHealth,
    };

    const newState: ExtendedGameState = {
      ...state,
      players: newPlayers,
      turnPhase: 'main2',
      logs: combatLogs,
      combat: emptyCombatState,
    };

    const winner = baseRules.checkWinCondition(newState);
    set({
      state: winner
        ? { ...newState, gamePhase: 'gameover' as const, winner }
        : newState,
    });
  },
}));
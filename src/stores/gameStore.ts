import { create } from 'zustand';
import { Card, CombatAttack, CombatBlock, CombatState, GameState, Player, TurnPhase } from '../types';
import { baseRules } from '../rules';
import { GameConfig } from '../config/gameConfig';
import { generateId } from '../utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyCombat: CombatState = {
  phase: 'idle',
  attacks: [],
  blocks: [],
};

const makePlayer = (deck: Card[], name: string): Player => ({
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
  id: '', name: '', health: 30, maxHealth: 30,
  mana: 0, maxMana: 0, deck: [], hand: [],
  board: [], graveyard: [], hasPlayedCardThisTurn: false,
};

const initialState: GameState = {
  players: [emptyPlayer, emptyPlayer],
  currentPlayerIndex: 0,
  turn: 1,
  gamePhase: 'home',
  turnPhase: 'main1',
  winner: null,
  logs: [],
  combat: emptyCombat,
};

// ─── Résolution du combat ─────────────────────────────────────────────────────
// Fonction pure — player1 = players[0], player2 = players[1], toujours.
// attackingIdx / defendingIdx = rôles du tour courant, indépendants de player1/player2.
// Appelée avec le board INTACT (avant tap) — le tap se fait après.

function resolveCombat(state: GameState): GameState {
  const attackingIdx = state.currentPlayerIndex;
  const defendingIdx = attackingIdx === 0 ? 1 : 0;

  let attackingBoard = [...state.players[attackingIdx].board];
  let defendingBoard = [...state.players[defendingIdx].board];
  let attackingGraveyard = [...state.players[attackingIdx].graveyard];
  let defendingGraveyard = [...state.players[defendingIdx].graveyard];
  let defendingHealth = state.players[defendingIdx].health;
  const logs = [...state.logs];

  // Helper : applique les dégâts et sépare vivants / morts
  const applyDamage = (
    board: Card[],
    graveyard: Card[],
    targetId: string,
    damage: number
  ): { board: Card[]; graveyard: Card[] } => {
    const updated = board.map(c =>
      c.id === targetId ? { ...c, defense: c.defense - damage } : c
    );
    const dead = updated.filter(c => c.defense <= 0);
    return {
      board: updated.filter(c => c.defense > 0),
      graveyard: [...graveyard, ...dead],
    };
  };

  for (const attack of state.combat.attacks) {
    const attacker = attackingBoard.find(c => c.id === attack.attackerId);
    if (!attacker) continue;

    const block = state.combat.blocks.find(b => b.attackerId === attack.attackerId);

    if (block) {
      // ── Attaque sur héros bloquée ──
      const blocker = defendingBoard.find(c => c.id === block.blockerId);
      if (!blocker) continue;

      const r1 = applyDamage(attackingBoard, attackingGraveyard, attacker.id, blocker.attack);
      attackingBoard     = r1.board;
      attackingGraveyard = r1.graveyard;

      const r2 = applyDamage(defendingBoard, defendingGraveyard, blocker.id, attacker.attack);
      defendingBoard     = r2.board;
      defendingGraveyard = r2.graveyard;

      logs.push(`🛡️ ${blocker.name} bloque ${attacker.name} — ${attacker.attack}/${blocker.attack} dégâts`);

    } else if (attack.targetType === 'hero') {
      // ── Attaque directe sur héros ──
      defendingHealth -= attacker.attack;
      logs.push(`💥 ${attacker.name} attaque ${state.players[defendingIdx].name} directement (−${attacker.attack} PV)`);

    } else if (attack.targetType === 'unit' && attack.targetId) {
      // ── Attaque sur unité ──
      const targetUnit = defendingBoard.find(c => c.id === attack.targetId);
      if (!targetUnit) continue;

      const r1 = applyDamage(attackingBoard, attackingGraveyard, attacker.id, targetUnit.attack);
      attackingBoard     = r1.board;
      attackingGraveyard = r1.graveyard;

      const r2 = applyDamage(defendingBoard, defendingGraveyard, targetUnit.id, attacker.attack);
      defendingBoard     = r2.board;
      defendingGraveyard = r2.graveyard;

      logs.push(`⚔️ ${attacker.name} attaque ${targetUnit.name} — ${attacker.attack}/${targetUnit.attack} dégâts`);
    }
  }

  const newPlayers: [Player, Player] = [...state.players] as [Player, Player];
  newPlayers[attackingIdx] = {
    ...state.players[attackingIdx],
    board: attackingBoard,
    graveyard: attackingGraveyard,
  };
  newPlayers[defendingIdx] = {
    ...state.players[defendingIdx],
    board: defendingBoard,
    graveyard: defendingGraveyard,
    health: defendingHealth,
  };

  return {
    ...state,
    players: newPlayers,
    turnPhase: 'main2',
    logs,
    combat: emptyCombat,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface GameStore {
  state: GameState;
  initializeGame: (deck1: Card[], deck2: Card[], p1Name: string, p2Name: string) => void;
  resetGame: () => void;
  resolveDrawPhase: () => void;
  endTurn: () => void;
  setTurnPhase: (phase: TurnPhase) => void;
  nextTurnPhase: () => void;
  playCard: (card: Card) => void;
  playSpell: (card: Card, targetCardId?: string) => void;
  declareAttack: (attack: CombatAttack) => void;
  cancelAttack: (attackerId: string) => void;
  confirmAttacks: () => void;
  declareBlock: (block: CombatBlock) => void;
  cancelBlock: (blockerId: string) => void;
  confirmDefense: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: initialState,

  // ─── Init ──────────────────────────────────────────────────────────────────

  initializeGame: (deck1, deck2, p1Name, p2Name) => {
    const player1 = makePlayer(deck1, p1Name);
    const player2 = makePlayer(deck2, p2Name);

    let s: GameState = {
      players: [player1, player2],
      currentPlayerIndex: 0,
      turn: 1,
      gamePhase: 'playing',
      turnPhase: 'main1',
      winner: null,
      logs: ['⚔️ Que la bataille commence !'],
      combat: emptyCombat,
    };

    s = { ...baseRules.onTurnStart(s, s.players[0]), combat: emptyCombat };
    for (let i = 0; i < GameConfig.STARTING_HAND_SIZE; i++) s = baseRules.onCardDraw(s, s.players[0]);
    for (let i = 0; i < GameConfig.STARTING_HAND_SIZE; i++) s = baseRules.onCardDraw(s, s.players[1]);
    set({ state: s });
  },

  resetGame: () => set({ state: initialState }),

  // ─── Tour ──────────────────────────────────────────────────────────────────

  resolveDrawPhase: () => {
    const { state } = get();
    if (state.turnPhase !== 'draw') return;
    const drawingPlayer = state.players[state.currentPlayerIndex];
    let s = baseRules.onCardDraw(state, drawingPlayer);
    const winner = baseRules.checkWinCondition(s);
    set({ state: winner ? { ...s, gamePhase: 'gameover', winner } : { ...s, turnPhase: 'main1' } });
  },

  endTurn: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;

    const nextPlayerIndex = (state.currentPlayerIndex === 0 ? 1 : 0) as 0 | 1;
    const turnIncrement   = nextPlayerIndex === 0 ? 1 : 0;

    let s: GameState = {
      ...state,
      currentPlayerIndex: nextPlayerIndex,
      turn: state.turn + turnIncrement,
      turnPhase: 'draw',
      combat: emptyCombat,
    };

    s = { ...baseRules.onTurnStart(s, s.players[nextPlayerIndex]), combat: emptyCombat };
    const winner = baseRules.checkWinCondition(s);
    if (winner) { set({ state: { ...s, gamePhase: 'gameover', winner } }); return; }

    set({ state: s });
    get().resolveDrawPhase();
  },

  setTurnPhase: (phase) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    set({ state: { ...state, turnPhase: phase } });
  },

  nextTurnPhase: () => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    const order: TurnPhase[] = ['main1', 'attack', 'defense', 'main2', 'end'];
    const idx = order.indexOf(state.turnPhase);
    if (idx === -1 || idx >= order.length - 1) return;
    set({ state: { ...state, turnPhase: order[idx + 1] } });
  },

  // ─── Cartes ────────────────────────────────────────────────────────────────

  playCard: (card) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'main1' && state.turnPhase !== 'main2') return;
    const playingPlayer = state.players[state.currentPlayerIndex];
    const s = baseRules.onCardPlay(state, playingPlayer, card);
    const winner = baseRules.checkWinCondition(s);
    set({ state: winner ? { ...s, gamePhase: 'gameover', winner } : s });
  },

  playSpell: (card, targetCardId?) => {
    const { state } = get();
    if (state.gamePhase !== 'playing') return;
    if (state.turnPhase !== 'main1' && state.turnPhase !== 'main2') return;
    const playingPlayer = state.players[state.currentPlayerIndex];
    const opposingIdx   = state.currentPlayerIndex === 0 ? 1 : 0;
    const target = targetCardId
      ? state.players[opposingIdx].board.find(c => c.id === targetCardId)
      : undefined;
    const s = baseRules.onCardPlay(state, playingPlayer, card, target);
    const winner = baseRules.checkWinCondition(s);
    set({ state: winner ? { ...s, gamePhase: 'gameover', winner } : s });
  },

  // ─── Phase ATTACK ──────────────────────────────────────────────────────────

  declareAttack: (attack) => {
    const { state } = get();
    if (state.turnPhase !== 'attack') return;

    const attackingIdx    = state.currentPlayerIndex;
    const attackingPlayer = state.players[attackingIdx];
    const card = attackingPlayer.board.find(c => c.id === attack.attackerId);

    if (!card) return;
    if (card.summoningSickness === true) return;
    if (card.tapped === true) return;

    if (attack.targetType === 'unit' && attack.targetId) {
      const defendingIdx = attackingIdx === 0 ? 1 : 0;
      const target = state.players[defendingIdx].board.find(c => c.id === attack.targetId);
      if (!target) return;
    }

    const attacks = [
      ...state.combat.attacks.filter(a => a.attackerId !== attack.attackerId),
      attack,
    ];

    set({ state: { ...state, combat: { ...state.combat, phase: 'declaringAttacks', attacks } } });
  },

  cancelAttack: (attackerId) => {
    const { state } = get();
    if (state.turnPhase !== 'attack') return;
    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          attacks: state.combat.attacks.filter(a => a.attackerId !== attackerId),
          blocks:  state.combat.blocks.filter(b => b.attackerId !== attackerId),
        },
      },
    });
  },

  confirmAttacks: () => {
    const { state } = get();
    if (state.turnPhase !== 'attack') return;

    const attackingIdx = state.currentPlayerIndex;
    const defendingIdx = attackingIdx === 0 ? 1 : 0;
    const attackerIds  = new Set(state.combat.attacks.map(a => a.attackerId));

    // Cas 1 : aucune attaque → main2 directement
    if (state.combat.attacks.length === 0) {
      set({ state: { ...state, turnPhase: 'main2', combat: emptyCombat } });
      return;
    }

    // Cas 2 : attaque sur héros ET bloqueur disponible → phase defense
    const hasHeroAttack = state.combat.attacks.some(a => a.targetType === 'hero');
    const unitTargetIds = new Set(
      state.combat.attacks
        .filter(a => a.targetType === 'unit' && a.targetId)
        .map(a => a.targetId!)
    );
    const hasAvailableBlocker = state.players[defendingIdx].board.some(
      c => !c.tapped && !unitTargetIds.has(c.id)
    );

    if (hasHeroAttack && hasAvailableBlocker) {
      // Taper les attaquants, passer en defense
      const newPlayers: [Player, Player] = [...state.players] as [Player, Player];
      newPlayers[attackingIdx] = {
        ...state.players[attackingIdx],
        board: state.players[attackingIdx].board.map(c =>
          attackerIds.has(c.id) ? { ...c, tapped: true } : c
        ),
      };
      set({
        state: {
          ...state,
          players: newPlayers,
          turnPhase: 'defense',
          combat: { ...state.combat, phase: 'declaringDefenses', blocks: [] },
        },
      });
      return;
    }

    // Cas 3 : résolution directe — résoudre D'ABORD, tapper APRÈS
    const resolved = resolveCombat({
      ...state,
      combat: { ...state.combat, phase: 'resolving', blocks: [] },
    });

    const newPlayers: [Player, Player] = [...resolved.players] as [Player, Player];
    newPlayers[attackingIdx] = {
      ...resolved.players[attackingIdx],
      board: resolved.players[attackingIdx].board.map(c =>
        attackerIds.has(c.id) ? { ...c, tapped: true } : c
      ),
    };

    const finalState = { ...resolved, players: newPlayers };
    const winner = baseRules.checkWinCondition(finalState);
    set({ state: winner ? { ...finalState, gamePhase: 'gameover', winner } : finalState });
  },

  // ─── Phase DEFENSE ─────────────────────────────────────────────────────────

  declareBlock: (block) => {
    const { state } = get();
    if (state.turnPhase !== 'defense') return;

    const defendingIdx    = state.currentPlayerIndex === 0 ? 1 : 0;
    const defendingPlayer = state.players[defendingIdx];

    const attack = state.combat.attacks.find(a => a.attackerId === block.attackerId);
    if (!attack || attack.targetType !== 'hero') return;

    const blocker = defendingPlayer.board.find(c => c.id === block.blockerId);
    if (!blocker) return;

    if (state.combat.blocks.some(b => b.blockerId === block.blockerId)) return;

    // summoningSickness n'empêche PAS de bloquer — intentionnel

    const blocks = [
      ...state.combat.blocks.filter(b => b.attackerId !== block.attackerId),
      block,
    ];

    set({ state: { ...state, combat: { ...state.combat, blocks } } });
  },

  cancelBlock: (blockerId) => {
    const { state } = get();
    if (state.turnPhase !== 'defense') return;
    set({
      state: {
        ...state,
        combat: {
          ...state.combat,
          blocks: state.combat.blocks.filter(b => b.blockerId !== blockerId),
        },
      },
    });
  },

  confirmDefense: () => {
    const { state } = get();
    if (state.turnPhase !== 'defense') return;

    const defendingIdx = state.currentPlayerIndex === 0 ? 1 : 0;
    const blockerIds   = new Set(state.combat.blocks.map(b => b.blockerId));

    // Résoudre D'ABORD avec le board intact (bloqueurs vivants et non-tappés)
    const resolved = resolveCombat({
      ...state,
      combat: { ...state.combat, phase: 'resolving' },
    });

    // Tapper les bloqueurs survivants APRÈS résolution
    const newPlayers: [Player, Player] = [...resolved.players] as [Player, Player];
    newPlayers[defendingIdx] = {
      ...resolved.players[defendingIdx],
      board: resolved.players[defendingIdx].board.map(c =>
        blockerIds.has(c.id) ? { ...c, tapped: true } : c
      ),
    };

    const finalState = { ...resolved, players: newPlayers };
    const winner = baseRules.checkWinCondition(finalState);
    set({ state: winner ? { ...finalState, gamePhase: 'gameover', winner } : finalState });
  },
}));
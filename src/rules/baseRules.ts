import { Card, Player, GameState } from '../types';
import { GameConfig } from '../config/gameConfig';
import { spellEffects } from './spellEffects';

export const baseRules = {
  // Début de tour : +1 mana, reset mana, reset hasPlayed
onTurnStart: (state: GameState, player: Player): GameState => {
  const newMaxMana = Math.min(player.maxMana + GameConfig.MANA_PER_TURN, GameConfig.MANA_MAX);
  const idx = state.players.findIndex(p => p.id === player.id) as 0 | 1;

  const newPlayers = [...state.players] as [Player, Player];
  newPlayers[idx] = {
    ...player,
    maxMana: newMaxMana,
    mana: newMaxMana,
    hasPlayedCardThisTurn: false,
    board: player.board.map(c => ({ ...c, summoningSickness: false })), // ← fusionné ici
  };

  return {
    ...state,
    players: newPlayers, // ← un seul players
    logs: [...state.logs, `🔄 Tour ${state.turn} — ${newPlayers[idx].name} | 💧 ${newMaxMana}/${newMaxMana}`],
  };
},

  // Pioche une carte
  onCardDraw: (state: GameState, player: Player): GameState => {
    const idx = state.players.findIndex(p => p.id === player.id) as 0 | 1;
    if (player.deck.length === 0) {
      return { ...state, logs: [...state.logs, `💀 ${player.name} n'a plus de cartes !`] };
    }
    if (player.hand.length >= GameConfig.HAND_MAX_CARDS) {
      return { ...state, logs: [...state.logs, `✋ Main pleine pour ${player.name}`] };
    }
    const newDeck = [...player.deck];
    const card = newDeck.shift()!;
    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[idx] = { ...player, deck: newDeck, hand: [...player.hand, card] };
    return { ...state, players: newPlayers, logs: [...state.logs, `🃏 ${player.name} pioche ${card.name}`] };
  },

  // Joue une carte (minion ou sort)
  onCardPlay: (state: GameState, player: Player, card: Card, target?: Card): GameState => {
    if (!baseRules.canPlayCard(player, card)) {
      return { ...state, logs: [...state.logs, `❌ Impossible de jouer ${card.name}`] };
    }

    const cardToBoard: Card = { ...card, summoningSickness: true, };
    const idx = state.players.findIndex(p => p.id === player.id) as 0 | 1;
    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[idx] = {
      ...player,
      hand: player.hand.filter(c => c.id !== card.id),
      mana: player.mana - card.cost,
    };
    let newState: GameState = { ...state, players: newPlayers };

    // Minion → terrain
    if (cardToBoard.type === 'minion') {
      if (player.board.length >= GameConfig.BOARD_MAX_CARDS) {
        return { ...state, logs: [...state.logs, `❌ Terrain plein !`] };
      }
      newPlayers[idx] = {
        ...newPlayers[idx],
        board: [...newPlayers[idx].board, { ...cardToBoard, health: card.maxHealth }],
      };
      return {
        ...newState,
        players: [...newPlayers] as [Player, Player],
        logs: [...state.logs, `🧙 ${player.name} invoque ${card.name} (${card.attack}⚔️ ${card.health}❤️)`],
      };
    }

    // Sort → effet puis défausse
    if (card.type === 'spell') {
      const effect = spellEffects[card.name];
      if (effect) {
        const result = effect(newState, newPlayers[idx], target);
        const afterIdx = result.newState.players.findIndex(p => p.id === player.id) as 0 | 1;
        const finalPlayers = [...result.newState.players] as [Player, Player];
        finalPlayers[afterIdx] = {
          ...finalPlayers[afterIdx],
          graveyard: [...finalPlayers[afterIdx].graveyard, card],
        };
        return { ...result.newState, players: finalPlayers, logs: [...newState.logs, result.message] };
      }
      // Sort sans effet codé
      newPlayers[idx] = { ...newPlayers[idx], graveyard: [...newPlayers[idx].graveyard, card] };
      return {
        ...newState,
        players: [...newPlayers] as [Player, Player],
        logs: [...newState.logs, `✨ ${player.name} joue ${card.name}`],
      };
    }

    return newState;
  },

  // Fin de tour → change de joueur, début de tour suivant + pioche
  onEndTurn: (state: GameState): GameState => {
    const nextIdx = (state.currentPlayerIndex === 0 ? 1 : 0) as 0 | 1;
    const nextPlayer = state.players[nextIdx];
    const newTurn = nextIdx === 0 ? state.turn + 1 : state.turn;

    let newState: GameState = {
      ...state,
      currentPlayerIndex: nextIdx,
      turn: newTurn,
      turnPhase: 'draw',
      logs: [...state.logs, `⏭️ Au tour de ${nextPlayer.name}`],
    };

    newState = baseRules.onTurnStart(newState, nextPlayer);
    newState = baseRules.onCardDraw(newState, newState.players[nextIdx]);

    return {
      ...newState,
      turnPhase: 'main1',
    };
  },

  // Peut jouer cette carte ?
  canPlayCard: (player: Player, card: Card): boolean => {
    if (player.mana < card.cost) return false;
    if (card.type === 'minion' && player.board.length >= GameConfig.BOARD_MAX_CARDS) return false;
    return true;
  },

  // Calcule les dégâts d'une attaque
  calculateAttack: (attacker: Card, defender: Card): { damage: number; dead: boolean } => {
    const damage = attacker.attack;
    return { damage, dead: defender.health <= damage };
  },

  // Vérifie la condition de victoire
  checkWinCondition: (state: GameState): Player | null => {
    const [p1, p2] = state.players;
    if (p1.health <= 0) return p2;
    if (p2.health <= 0) return p1;
    return null;
  },
};
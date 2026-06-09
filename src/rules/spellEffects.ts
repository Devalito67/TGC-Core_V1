import { Card, GameState, Player } from '../types';

export interface SpellResult {
  newState: GameState;
  message: string;
}

// Registre des effets de sorts
export const spellEffects: Record<string, (
  state: GameState,
  caster: Player,
  target?: Card | Player
) => SpellResult> = {

  // 🔥 Boule de Feu — inflige 3 dégâts à une cible (carte ou héros)
'Boule de Feu': (state, caster, target) => {
  const DAMAGE = 3;
  const casterIndex = state.players.findIndex(p => p.id === caster.id);
  const opponentIndex = casterIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];

  // Cible = carte ennemie sur le board (si target est une Card avec un id)
  const targetCard = target && 'id' in target
    ? opponent.board.find(c => c.id === (target as Card).id)
    : null;

  if (targetCard) {
    const newBoard = opponent.board
      .map(c => c.id === targetCard.id ? { ...c, health: c.health - DAMAGE } : c)
      .filter(c => c.health > 0);

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[opponentIndex] = { ...opponent, board: newBoard };

    return {
      newState: { ...state, players: newPlayers },
      message: `🔥 Boule de Feu frappe ${targetCard.name} pour ${DAMAGE} dégâts !`,
    };
  }

  // Pas de cible carte → attaque le héros directement
  const newPlayers = [...state.players] as [Player, Player];
  newPlayers[opponentIndex] = { ...opponent, health: opponent.health - DAMAGE };

  return {
    newState: { ...state, players: newPlayers },
    message: `🔥 Boule de Feu frappe ${opponent.name} directement pour ${DAMAGE} dégâts !`,
  };
},

  // 💚 Soin Magique — restaure 5 PV au joueur actif
  'Soin Magique': (state, caster) => {
    const HEAL = 5;
    const casterIndex = state.players.findIndex(p => p.id === caster.id);
    const newHealth = Math.min(caster.health + HEAL, caster.maxHealth);

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[casterIndex] = { ...caster, health: newHealth };

    return {
      newState: { ...state, players: newPlayers },
      message: `💚 Soin Magique restaure ${HEAL} PV à ${caster.name} (${newHealth}/${caster.maxHealth})`,
    };
  },

  // 🌪️ Tempête de Vent — repousse toutes les cartes ennemies (les remet dans le deck)
  'Tempête de Vent': (state, caster) => {
    const casterIndex = state.players.findIndex(p => p.id === caster.id);
    const opponentIndex = casterIndex === 0 ? 1 : 0;
    const opponent = state.players[opponentIndex];

    const count = opponent.board.length;
    if (count === 0) {
      return {
        newState: state,
        message: `🌪️ Tempête de Vent... mais le terrain adverse est déjà vide !`,
      };
    }

    // Les cartes ennemies retournent dans le deck (mélangé)
    const returnedCards = [...opponent.board];
    const newDeck = [...returnedCards, ...opponent.deck].sort(() => Math.random() - 0.5);

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[opponentIndex] = { ...opponent, board: [], deck: newDeck };

    return {
      newState: { ...state, players: newPlayers },
      message: `🌪️ Tempête de Vent repousse ${count} carte(s) ennemie(s) dans le deck !`,
    };
  },
};

// Sorts qui nécessitent une cible (carte ennemie)
export const spellsRequiringTarget = ['Boule de Feu'];

// Sorts à effet immédiat sans cible
export const spellsAutoEffect = ['Soin Magique', 'Tempête de Vent'];

// Vérifie si un sort nécessite une cible
export const spellNeedsTarget = (spellName: string): boolean =>
  spellsRequiringTarget.includes(spellName);
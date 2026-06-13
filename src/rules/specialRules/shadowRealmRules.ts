import { Card, Player, GameState } from '../../types';

// Exemple de règle spéciale : Shadow Realm (cartes shadow gagnent +1 attack au début du tour)
export const shadowRealmRules = {
  onTurnStart: (state: GameState, player: Player) => {
    const newBoard = player.board.map(card => {
      if (card.element === 'shadow') {
        return { ...card, attack: card.attack + 1 };
      }
      return card;
    });

    const newPlayers = [...state.players] as [Player, Player];
    newPlayers[state.currentPlayerIndex] = { ...player, board: newBoard };

    return {
      ...state,
      players: newPlayers,
      logs: [...state.logs, `${player.name} - Mistiques noires gagnent +1 attaque`],
    };
  },
};
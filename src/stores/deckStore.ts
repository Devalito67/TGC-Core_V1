import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../types';
import { GameConfig } from '../config/gameConfig';
import { generateId } from '../utils';

export type SavedDeck = {
  id: string;
  name: string;
  cards: Card[];
};

interface DeckStore {
  decks: SavedDeck[];
  currentDeck: Card[] | null;
  currentDeckName: string;
  addCardToDeck: (card: Card) => void;
  removeCardFromDeck: (cardId: string) => void;
  saveDeck: (name: string) => void;
  clearCurrentDeck: () => void;
  createDefaultDeck: () => void;
  setCurrentDeckName: (name: string) => void;
  openDeck: (deckId: string) => void;
  deleteDeck: (deckId: string) => void;
}

const makeCard = (
  name: string,
  cost: number,
  attack: number,
  defense: number,
  type: 'minion' | 'spell' | 'weapon',
  element: 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'light',
  rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common',
  description?: string,
  
): Card => ({
  id: generateId(),
  name,
  description,
  cost,
  attack,
  defense,
  type,
  element,
  rarity,
  version: '1.0',
  summoningSickness: true,
  tapped: false,     
});

const buildDefaultCards = (): Card[] => [
  makeCard('Guerrier de Feu', 2, 3, 2, 'minion', 'fire', 'common', 'Un soldat des flammes'),
  makeCard('Guerrier de Feu', 2, 3, 2, 'minion', 'fire', 'common', 'Un soldat des flammes'),
  makeCard('Guerrier de Feu', 2, 3, 2, 'minion', 'fire', 'common', 'Un soldat des flammes'),
  makeCard('Guerrier de Feu', 2, 3, 2, 'minion', 'fire', 'common', 'Un soldat des flammes'),
  makeCard('Esprit des Vents', 1, 1, 1, 'minion', 'air', 'common', 'Rapide mais fragile'),
  makeCard('Esprit des Vents', 1, 1, 1, 'minion', 'air', 'common', 'Rapide mais fragile'),
  makeCard('Esprit des Vents', 1, 1, 1, 'minion', 'air', 'common', 'Rapide mais fragile'),
  makeCard('Esprit des Vents', 1, 1, 1, 'minion', 'air', 'common', 'Rapide mais fragile'),
  makeCard("Guardian de l'Eau", 3, 2, 4, 'minion', 'water', 'common', 'Protège ses alliés'),
  makeCard("Guardian de l'Eau", 3, 2, 4, 'minion', 'water', 'common', 'Protège ses alliés'),
  makeCard("Guardian de l'Eau", 3, 2, 4, 'minion', 'water', 'common', 'Protège ses alliés'),
  makeCard("Guardian de l'Eau", 3, 2, 4, 'minion', 'water', 'common', 'Protège ses alliés'),
  makeCard("Chasseur d'Ombres", 2, 2, 2, 'minion', 'shadow', 'common', "Insaisissable dans l'obscurité"),
  makeCard("Chasseur d'Ombres", 2, 2, 2, 'minion', 'shadow', 'common', "Insaisissable dans l'obscurité"),
  makeCard("Chasseur d'Ombres", 2, 2, 2, 'minion', 'shadow', 'common', "Insaisissable dans l'obscurité"),
  makeCard("Chasseur d'Ombres", 2, 2, 2, 'minion', 'shadow', 'common', "Insaisissable dans l'obscurité"),
  makeCard('Golem de Pierre', 4, 3, 6, 'minion', 'earth', 'rare', 'Résistant et lent'),
  makeCard('Golem de Pierre', 4, 3, 6, 'minion', 'earth', 'rare', 'Résistant et lent'),
  makeCard('Golem de Pierre', 4, 3, 6, 'minion', 'earth', 'rare', 'Résistant et lent'),
  makeCard('Paladin de Lumière', 4, 4, 5, 'minion', 'light', 'rare', 'Gardien sacré'),
  makeCard('Paladin de Lumière', 4, 4, 5, 'minion', 'light', 'rare', 'Gardien sacré'),
  makeCard('Paladin de Lumière', 4, 4, 5, 'minion', 'light', 'rare', 'Gardien sacré'),
  makeCard('Mage des Glaces', 3, 3, 3, 'minion', 'water', 'rare', 'Ralentit les ennemis'),
  makeCard('Mage des Glaces', 3, 3, 3, 'minion', 'water', 'rare', 'Ralentit les ennemis'),
  makeCard('Mage des Glaces', 3, 3, 3, 'minion', 'water', 'rare', 'Ralentit les ennemis'),
  makeCard('Archimage des Ténèbres', 5, 5, 5, 'minion', 'shadow', 'epic', 'Maître des ombres'),
  makeCard('Archimage des Ténèbres', 5, 5, 5, 'minion', 'shadow', 'epic', 'Maître des ombres'),
  makeCard('Chevalier du Crépuscule', 6, 6, 6, 'minion', 'shadow', 'epic', "Entre la lumière et l'ombre"),
  makeCard('Chevalier du Crépuscule', 6, 6, 6, 'minion', 'shadow', 'epic', "Entre la lumière et l'ombre"),
  makeCard('Dragon de Terre', 7, 8, 8, 'minion', 'earth', 'legendary', 'Titan indestructible'),
  makeCard('Phoenix de Cendres', 8, 7, 7, 'minion', 'fire', 'legendary', 'Renaît de ses cendres'),
  makeCard('Boule de Feu', 1, 0, 0, 'spell', 'fire', 'common', 'Inflige 3 dégâts'),
  makeCard('Boule de Feu', 1, 0, 0, 'spell', 'fire', 'common', 'Inflige 3 dégâts'),
  makeCard('Boule de Feu', 1, 0, 0, 'spell', 'fire', 'common', 'Inflige 3 dégâts'),
  makeCard('Boule de Feu', 1, 0, 0, 'spell', 'fire', 'common', 'Inflige 3 dégâts'),
  makeCard('Soin Magique', 2, 0, 0, 'spell', 'light', 'rare', 'Restaure 5 PV'),
  makeCard('Soin Magique', 2, 0, 0, 'spell', 'light', 'rare', 'Restaure 5 PV'),
  makeCard('Soin Magique', 2, 0, 0, 'spell', 'light', 'rare', 'Restaure 5 PV'),
  makeCard('Tempête de Vent', 3, 0, 0, 'spell', 'air', 'rare', 'Repousse tous les ennemis'),
  makeCard('Tempête de Vent', 3, 0, 0, 'spell', 'air', 'rare', 'Repousse tous les ennemis'),
];

export const DECK_MIN_SIZE = GameConfig.DECK_MIN_SIZE;
export const DECK_MAX_SIZE = GameConfig.DECK_MAX_SIZE;

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      decks: [],
      currentDeck: null,
      currentDeckName: 'Mon Deck',

      addCardToDeck: (card) => {
        const { currentDeck } = get();
        const deck = currentDeck || [];
        if (deck.length >= GameConfig.DECK_MAX_SIZE) return;
        set({ currentDeck: [...deck, card] });
      },

      removeCardFromDeck: (cardId) => {
        const { currentDeck } = get();
        if (!currentDeck) return;
        set({ currentDeck: currentDeck.filter((c) => c.id !== cardId) });
      },

      saveDeck: (name) => {
        const { currentDeck, decks } = get();
        if (!currentDeck || currentDeck.length === 0) return;

        const trimmedName = name.trim() || 'Mon Deck';
        const existingIndex = decks.findIndex((d) => d.name === trimmedName);

        let newDecks: SavedDeck[];
        if (existingIndex >= 0) {
          newDecks = [...decks];
          newDecks[existingIndex] = {
            ...newDecks[existingIndex],
            cards: [...currentDeck],
          };
        } else {
          newDecks = [
            ...decks,
            { id: generateId(), name: trimmedName, cards: [...currentDeck] },
          ];
        }

        set({ decks: newDecks, currentDeckName: trimmedName });
      },

      clearCurrentDeck: () =>
        set({ currentDeck: [], currentDeckName: 'Mon Deck' }),

      createDefaultDeck: () =>
        set({ currentDeck: buildDefaultCards(), currentDeckName: 'Deck par défaut' }),

      setCurrentDeckName: (name) => set({ currentDeckName: name }),

      openDeck: (deckId) => {
        const { decks } = get();
        const deck = decks.find((d) => d.id === deckId);
        if (!deck) return;
        set({
          currentDeck: deck.cards.map((c) => ({ ...c, id: generateId() })),
          currentDeckName: deck.name,
        });
      },

      deleteDeck: (deckId) => {
        const { decks } = get();
        set({ decks: decks.filter((d) => d.id !== deckId) });
      },
    }),
    {
      name: 'tcg-deck-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
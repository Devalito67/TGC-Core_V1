import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { useGameStore } from '../stores';
import { useDeckStore, DECK_MIN_SIZE, SavedDeck } from '../stores/deckStore';
import BurgerMenu from '../components/BurgerMenu';

interface HomeScreenProps {
  onGoToDeck?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onGoToDeck }) => {
  const initializeGame = useGameStore((state) => state.initializeGame);
  const createDefaultDeck = useDeckStore((state) => state.createDefaultDeck);
  const currentDeck = useDeckStore((state) => state.currentDeck);
  const currentDeckName = useDeckStore((state) => state.currentDeckName);
  const decks = useDeckStore((state) => state.decks);
  const openDeck = useDeckStore((state) => state.openDeck);
  const deleteDeck = useDeckStore((state) => state.deleteDeck);
  const clearCurrentDeck = useDeckStore((state) => state.clearCurrentDeck);

  const deckCount = currentDeck?.length || 0;
  const deckReady = deckCount >= DECK_MIN_SIZE;

  const startGame = () => {
    if (!currentDeck || currentDeck.length < DECK_MIN_SIZE) {
      Alert.alert(
        'Deck insuffisant',
        `Ton deck a ${deckCount} cartes. Il en faut au moins ${DECK_MIN_SIZE}.`
      );
      return;
    }
    const deckCopy1 = currentDeck.map((c) => ({
      ...c,
      id: Math.random().toString(36).substring(2),
    }));
    const deckCopy2 = currentDeck.map((c) => ({
      ...c,
      id: Math.random().toString(36).substring(2),
    }));
    initializeGame(deckCopy1, deckCopy2, 'Joueur 1', 'Joueur 2');
  };

  const handleLoadDefault = () => {
    createDefaultDeck();
    Alert.alert('✅ Deck chargé', '40 cartes prêtes à jouer !');
  };

  const handleNewDeck = () => {
    clearCurrentDeck();
    onGoToDeck?.();
  };

  const handleOpenDeck = (deckId: string) => {
    openDeck(deckId);
    onGoToDeck?.();
  };

  const handleDeleteDeck = (deckId: string, name: string) => {
    Alert.alert('Supprimer', `Supprimer "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => deleteDeck(deckId),
      },
    ]);
  };

  const renderHeader = () => (
    <View>
       <BurgerMenu items={[
          { label: 'Deck Builder', icon: '🃏', onPress: () => onGoToDeck?.() },
        ]} />
      <Text style={styles.title}>⚔️ TCG Template</Text>
      <Text style={styles.subtitle}>Jeu de Cartes Personnalisable</Text>

      {/* Deck actif */}
      <View style={styles.currentDeckBox}>
        <Text style={styles.currentDeckLabel}>Deck chargé</Text>
        <Text style={styles.currentDeckName}>{currentDeckName}</Text>
        <Text style={styles.currentDeckMeta}>{deckCount} cartes</Text>
      </View>

      {/* Mode de jeu */}
      <View style={styles.modeBox}>
        <Text style={styles.modeTitle}>🎮 Mode de jeu</Text>
        <View style={styles.modeItem}>
          <Text style={styles.modeIcon}>♟️</Text>
          <View>
            <Text style={styles.modeName}>Solo (contre soi-même)</Text>
            <Text style={styles.modeDesc}>Joue les 2 côtés comme aux échecs</Text>
          </View>
        </View>
        <View style={[styles.modeItem, styles.modeLocked]}>
          <Text style={styles.modeIcon}>🌐</Text>
          <View>
            <Text style={[styles.modeName, styles.modeLockedText]}>Multijoueur en ligne</Text>
            <Text style={styles.modeDesc}>Prochainement (V2)</Text>
          </View>
        </View>
        <View style={[styles.modeItem, styles.modeLocked]}>
          <Text style={styles.modeIcon}>🤖</Text>
          <View>
            <Text style={[styles.modeName, styles.modeLockedText]}>Contre l'IA</Text>
            <Text style={styles.modeDesc}>Prochainement (V2)</Text>
          </View>
        </View>
      </View>

      {/* En-tête liste decks */}
      <View style={styles.deckListHeader}>
        <Text style={styles.deckListTitle}>📚 Mes Decks sauvegardés</Text>
        <TouchableOpacity style={styles.newDeckButton} onPress={handleNewDeck}>
          <Text style={styles.newDeckButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View>
      <TouchableOpacity onPress={handleLoadDefault} style={styles.buttonSecondary}>
        <Text style={styles.buttonText}>🃏 Charger Deck Par Défaut (40 cartes)</Text>
      </TouchableOpacity>

      {onGoToDeck && (
        <TouchableOpacity onPress={onGoToDeck} style={styles.buttonTertiary}>
          <Text style={styles.buttonText}>🃏 Ouvrir </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={startGame}
        style={[styles.buttonPrimary, !deckReady && styles.buttonDisabled]}
        disabled={!deckReady}
      >
        <Text style={styles.buttonText}>
          {deckReady ? '🎮 Commencer la Partie' : `⚠️ Deck incomplet (${deckCount}/40)`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={decks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aucun deck sauvegardé</Text>
          <Text style={styles.emptySubText}>
            Crée un deck dans le builder et enregistre-le pour le retrouver ici.
          </Text>
        </View>
      }
      renderItem={({ item }: { item: SavedDeck }) => (
        <View style={styles.deckCard}>
          <View style={styles.deckCardInfo}>
            <Text style={styles.deckCardName}>{item.name}</Text>
            <Text style={styles.deckCardMeta}>{item.cards.length} cartes</Text>
          </View>
          <TouchableOpacity
            style={styles.openButton}
            onPress={() => handleOpenDeck(item.id)}
          >
            <Text style={styles.openButtonText}>Ouvrir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDeck(item.id, item.name)}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#1a1a2e',
    paddingBottom: 36,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 20,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentDeckBox: {
    width: '100%',
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.3)',
  },
  currentDeckLabel: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  currentDeckName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  currentDeckMeta: {
    color: '#94A3B8',
    fontSize: 13,
  },
  modeBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modeTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderRadius: 8,
  },
  modeLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    opacity: 0.5,
  },
  modeIcon: { fontSize: 24 },
  modeName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modeLockedText: { color: '#aaa' },
  modeDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  deckListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deckListTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  newDeckButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newDeckButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  deckCardInfo: { flex: 1 },
  deckCardName: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  deckCardMeta: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  openButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  openButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  deleteButton: {
    backgroundColor: '#7F1D1D',
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 18 },
  emptyBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonTertiary: {
    backgroundColor: '#9370DB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
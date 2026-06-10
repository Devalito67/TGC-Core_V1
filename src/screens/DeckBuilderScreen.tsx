import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { useDeckStore } from '../stores';
import { CardComponent } from '../components';
import { defaultCards } from '../data/defaultCards';
import * as ScreenOrientation from 'expo-screen-orientation';

const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const DeckBuilderScreen: React.FC = () => {
  const currentDeck = useDeckStore((s) => s.currentDeck);
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck);
  const removeCardFromDeck = useDeckStore((s) => s.removeCardFromDeck);
  const saveDeck = useDeckStore((s) => s.saveDeck);
  const clearCurrentDeck = useDeckStore((s) => s.clearCurrentDeck);
  const screenWidth = Dimensions.get('window').width;
  // Panneau droit = flex:1, le gauche = 40% + gap 12 + padding 16*2
  const rightPanelWidth = screenWidth * 0.6 - 12 - 20; // approx
  const cardTileWidth = (rightPanelWidth - 10 * 3) / 2; // padding 10 + gap entre 2 colonnes
  const cardTileHeight = cardTileWidth * 1.397; // ratio poker
  const screenHeight = Dimensions.get('window').height;
  // ratio poker standard : 63mm x 88mm = 1:1.3968
  const CARD_HEIGHT = screenHeight * 0.85;
  const CARD_WIDTH = CARD_HEIGHT / 1.397;

  const [search, setSearch] = useState('');
  const [deckName, setDeckName] = useState('Deck List');
  const [isEditingDeckName, setIsEditingDeckName] = useState(false);
  const [curveCollapsed, setCurveCollapsed] = useState(false);
  const [selectedCard, setSelectedCard] = useState<typeof defaultCards[0] | null>(null);

  const getCountForCard = (cardName: string) => {
    return groupedDeck.find((c) => c.name === cardName)?.count || 0;
  };

  useEffect(() => {
    const lockLandscape = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (error) {
        console.log('Orientation lock error:', error);
      }
    };

    lockLandscape();

    return () => {
      ScreenOrientation.unlockAsync().catch(() => { });
    };
  }, []);

  const handleAddCard = (templateCard: typeof defaultCards[0]) => {
    if ((currentDeck?.length || 0) >= 40) {
      Alert.alert('Deck plein', 'Maximum 40 cartes autorisées');
      return;
    }

    const currentCopies =
      currentDeck?.filter((card) => card.name === templateCard.name).length || 0;

    if (currentCopies >= 4) {
      Alert.alert('Limite atteinte', 'Maximum 4 exemplaires par carte');
      return;
    }

    const newCard = { ...templateCard, id: generateId() };
    addCardToDeck(newCard);
  };



  const handleRemoveOne = (cardId: string) => {
    removeCardFromDeck(cardId);
  };

  const handleSave = () => {
    if (!currentDeck || currentDeck.length === 0) {
      Alert.alert('Erreur', 'Le deck est vide');
      return;
    }

    saveDeck(deckName?.trim() || 'Mon Deck');
    Alert.alert('Succès', 'Deck sauvegardé');
  };

  const handleResetDeck = () => {
    if (!currentDeck || currentDeck.length === 0) {
      return;
    }

    Alert.alert(
      'Réinitialiser le deck',
      'Voulez-vous vraiment tout effacer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => clearCurrentDeck(),
        },
      ]
    );
  };

  const groupedDeck = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        mana: number;
        count: number;
        entries: any[];
        templateCard: typeof defaultCards[0] | null;
      }
    >();

    (currentDeck || []).forEach((card) => {
      const key = card.name;

      if (!map.has(key)) {
        const template = defaultCards.find((c) => c.name === card.name) || null;

        map.set(key, {
          name: card.name,
          mana: Number(card.manaCost ?? card.cost ?? card.mana ?? 0),
          count: 0,
          entries: [],
          templateCard: template,
        });
      }

      const item = map.get(key)!;
      item.count += 1;
      item.entries.push(card);
    });

    return Array.from(map.values()).sort(
      (a, b) => a.mana - b.mana || a.name.localeCompare(b.name)
    );
  }, [currentDeck]);

  const manaCurve = useMemo(() => {
    const curve: Record<number, number> = {};

    groupedDeck.forEach((card) => {
      const cost = Number(card.mana) || 0;
      curve[cost] = (curve[cost] || 0) + card.count;
    });

    const items = Object.entries(curve)
      .map(([cost, count]) => ({
        cost: Number(cost),
        count,
      }))
      .sort((a, b) => a.cost - b.cost);

    const maxCount = Math.max(...items.map((i) => i.count), 1);

    return items.map((item) => ({
      ...item,
      ratio: item.count / maxCount,
    }));
  }, [groupedDeck]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return defaultCards;

    return defaultCards.filter((card) =>
      card.name.toLowerCase().includes(q)
    );
  }, [search]);

  const renderLeftHeader = (
    <View>
      <View style={styles.curveHeader}>
        <Text style={styles.panelTitle}>Mana Curve</Text>
        <TouchableOpacity onPress={() => setCurveCollapsed(!curveCollapsed)}>
          <Text style={styles.collapseText}>
            {curveCollapsed ? 'Agrandir' : 'Réduire'}
          </Text>
        </TouchableOpacity>
      </View>

      {!curveCollapsed && (
        <View style={styles.curvePanel}>
          {manaCurve.length === 0 ? (
            <Text style={styles.emptyText}>Aucune carte sélectionnée</Text>
          ) : (
            <View style={styles.curveBars}>
              {manaCurve.map((item) => (
                <View key={item.cost} style={styles.curveBarItem}>
                  <View
                    style={[
                      styles.curveBar,
                      {
                        height: Math.max(10, item.ratio * 72),
                      },
                    ]}
                  />
                  <Text style={styles.curveCount}>{item.count}</Text>
                  <Text style={styles.curveLabel}>{item.cost}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.deckHeader}>
        {isEditingDeckName ? (
          <TextInput
            value={deckName}
            onChangeText={setDeckName}
            onBlur={() => setIsEditingDeckName(false)}
            onSubmitEditing={() => setIsEditingDeckName(false)}
            autoFocus
            placeholder="Nom du deck"
            placeholderTextColor="#64748B"
            style={styles.deckNameInput}
          />
        ) : (
          <TouchableOpacity
            style={styles.deckNameButton}
            onPress={() => setIsEditingDeckName(true)}
          >
            <Text numberOfLines={1} style={styles.deckTitle}>
              {deckName || 'Deck List'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.deckHeaderRight}>
          <Text style={styles.deckCount}>{currentDeck?.length || 0}/40</Text>

          <TouchableOpacity style={styles.resetButton} onPress={handleResetDeck}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderText, styles.colMana]}>Mana</Text>
        <Text style={[styles.listHeaderText, styles.colName]}>Carte</Text>
        <Text style={[styles.listHeaderText, styles.colQty]}>Qté</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal
        visible={selectedCard !== null}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedCard(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedCard(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCardWrapper, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
                {selectedCard && (
                  <CardComponent
                    card={selectedCard}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.tcgTitle}>Mon TCG</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher / filtrer une carte"
          placeholderTextColor="#8A8FA3"
          style={styles.searchInput}
        />

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <FlatList
            data={groupedDeck}
            keyExtractor={(item) => item.name}
            style={styles.deckList}
            contentContainerStyle={styles.deckListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            ListHeaderComponent={renderLeftHeader}
            renderItem={({ item }) => {
              const isMaxCopies = item.count >= 4;

              return (
                <View style={styles.deckRowWrapper}>
                  <View style={styles.deckRow}>
                    <Text style={styles.colManaValue}>{item.mana}</Text>

                    <TouchableOpacity
                      style={styles.colNameTouchable}
                      onPress={() => {
                        if (item.templateCard) setSelectedCard(item.templateCard);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text numberOfLines={1} style={styles.colNameValue}>
                        {item.name}
                      </Text>
                      <Text style={styles.expandHint}>👁</Text>
                    </TouchableOpacity>

                    <View style={styles.qtyBox}>
                      <Text style={styles.qtyText}>{item.count}</Text>

                      <TouchableOpacity
                        style={[styles.qtyButton, isMaxCopies && styles.qtyButtonDisabled]}
                        disabled={isMaxCopies}
                        onPress={() => {
                          const template = defaultCards.find((c) => c.name === item.name);
                          if (template) handleAddCard(template);
                        }}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.qtyButton, styles.qtyRemove]}
                        onPress={() =>
                          handleRemoveOne(item.entries[item.entries.length - 1].id)
                        }
                      >
                        <Text style={styles.qtyButtonText}>-</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucune carte dans le deck</Text>
            }
          />
        </View>

        <View style={styles.rightPanel}>
          <FlatList
            data={filteredCards}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const count = getCountForCard(item.name);
              const isMaxCopies = count >= 4;
              const isDeckFull = (currentDeck?.length || 0) >= 40;

              return (
                <TouchableOpacity
                  style={[
                    styles.cardTile,
                    { width: cardTileWidth, height: cardTileHeight },
                    isMaxCopies && styles.cardTileDisabled,
                  ]}
                  onPress={() => handleAddCard(item)}
                  activeOpacity={0.9}
                  disabled={isMaxCopies || isDeckFull}
                >
                  <CardComponent
                    card={item}
                    width={cardTileWidth}
                    height={cardTileHeight}
                  />

                  <View style={styles.cardOverlay}>
                    <Text style={styles.cardOverlayText}>
                      {count > 0 ? `x${count}` : '+'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBar: {
    height: 64,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  tcgTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    minWidth: 110,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#E5E7EB',
    fontWeight: '700',
  },
  primaryButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  leftPanel: {
    width: '40%',
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 12,
    overflow: 'hidden',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 10,
  },
  deckList: {
    flex: 1,
  },
  deckListContent: {
    paddingBottom: 24,
  },
  curveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  collapseText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
  curvePanel: {
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: '#0B1220',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    height: 128,
    overflow: 'hidden',
  },
  curveBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
  },
  curveBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  curveBar: {
    width: 22,
    maxHeight: 72,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    marginBottom: 4,
  },
  curveCount: {
    color: '#E5E7EB',
    fontSize: 11,
  },
  curveLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B1220',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  deckNameButton: {
    flex: 1,
    marginRight: 12,
  },
  deckNameInput: {
    flex: 1,
    marginRight: 12,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deckTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  deckHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deckCount: {
    color: '#22D3EE',
    fontSize: 15,
    fontWeight: '800',
  },
  resetButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  listHeaderText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  colMana: {
    width: 52,
  },
  colName: {
    flex: 1,
  },
  colQty: {
    width: 92,
    textAlign: 'right',
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1220',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  deckRowWrapper: {
    marginBottom: 8,
  },
  colNameTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandHint: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedCardContainer: {
    backgroundColor: '#0B1220',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 8,
    paddingBottom: 10,
    marginTop: -4,
  },
  qtyButtonDisabled: {
    backgroundColor: '#3F3F46',
    opacity: 0.5,
  },
  colManaValue: {
    width: 52,
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: '800',
  },
  colNameValue: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  qtyBox: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyRemove: {
    backgroundColor: '#EF4444',
  },
  qtyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  gridContent: {
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTile: {
  backgroundColor: '#0B1220',
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden', // 👈 ajoute ça pour que la carte ne déborde pas
  },
  cardTileDisabled: {
    opacity: 0.55,
  },
  cardOverlay: {
    position: 'absolute',
    right: 14,
    top: 14,
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlayText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    position: 'relative',
    backgroundColor: '#0B1220',
  },
});
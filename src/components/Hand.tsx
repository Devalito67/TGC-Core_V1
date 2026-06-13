import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from '../types';
import { CardComponent } from './Card';
import { useGameStore } from '../stores';
import { spellNeedsTarget } from '../rules/spellEffects';

/**
 * HAND REFACTORING - OBSIDIAN RIFT EDITION
 * Integrated for Landscape UX & High-Fidelity visual feedback.
 */

interface HandProps {
  cards: Card[];
}

export const Hand: React.FC<HandProps> = ({ cards }) => {
  const playCard = useGameStore((s) => s.playCard);
  const playSpell = useGameStore((s) => s.playSpell);
  const state = useGameStore((s) => s.state);

  const [pendingSpell, setPendingSpell] = useState<Card | null>(null);
  const [directSpell, setDirectSpell] = useState<Card | null>(null);

  const currentPlayerIndex = state.currentPlayerIndex;
  const player = state.players[currentPlayerIndex];
  const opponentIdx = currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIdx];

  useEffect(() => {
    setPendingSpell(null);
  }, [currentPlayerIndex]);

  const handleCardPress = (card: Card) => {
    if (player.mana < card.cost) {
      setDirectSpell({ ...card, description: `❌ RIFT ENERGY LOW! Cost: ${card.cost} 💧 | Energy: ${player.mana} 💧` });
      setTimeout(() => setDirectSpell(null), 2500);
      return;
    }

    if (card.type === 'minion') {
      playCard(card);
      return;
    }

    if (card.type === 'spell' && spellNeedsTarget(card.name)) {
      if (opponent.board.length === 0) {
        setDirectSpell(card);
      } else {
        setPendingSpell(card);
      }
      return;
    }

    if (card.type === 'spell') {
      playSpell(card);
      return;
    }
  };

  const handleDirectSpellConfirm = () => {
    if (!directSpell) return;
    playSpell(directSpell);
    setDirectSpell(null);
  };

  const handleTargetSelect = (targetCardId: string) => {
    if (!pendingSpell) return;
    playSpell(pendingSpell, targetCardId);
    setPendingSpell(null);
  };

  const handleTargetHero = () => {
    if (!pendingSpell) return;
    playSpell(pendingSpell);
    setPendingSpell(null);
  };

  return (
    <View style={styles.container}>
      {/* === OVERLAYS: SPELL TARGETING & CONFIRMATION === */}
      {pendingSpell && (
        <View style={styles.overlayContainer}>
          <View style={styles.targetZone}>
            <View style={styles.targetHeader}>
              <View style={styles.targetTitleRow}>
                <Text style={styles.targetIcon}>🎯</Text>
                <Text style={styles.targetLabel}>SELECT TARGET FOR {pendingSpell.name.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setPendingSpell(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetScroll}>
              <TouchableOpacity style={styles.targetHeroButton} onPress={handleTargetHero}>
                <View style={styles.targetHeroAvatar}>
                   <Text style={styles.targetHeroEmoji}>👤</Text>
                </View>
                <Text style={styles.targetHeroName}>{opponent.name}</Text>
                <View style={styles.targetHpBadge}>
                  <Text style={styles.targetHpText}>{opponent.health}</Text>
                </View>
              </TouchableOpacity>

              {opponent.board.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.targetCardWrapper}
                  onPress={() => handleTargetSelect(card.id)}
                >
                  <CardComponent card={card} size="small" />
                  <View style={styles.targetCrosshair}>
                    <Text style={styles.crosshairEmoji}>🎯</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {directSpell && (
        <View style={styles.overlayContainer}>
          <View style={[styles.directSpellBanner, directSpell.description?.includes('❌') && styles.errorBanner]}>
            <Text style={[styles.directSpellText, directSpell.description?.includes('❌') && styles.errorText]}>
              {directSpell.description?.includes('❌') 
                ? directSpell.description 
                : `STRIKE ${opponent.name.toUpperCase()} WITH ${directSpell.name.toUpperCase()}?`}
            </Text>
            
            {!directSpell.description?.includes('❌') && (
              <View style={styles.directSpellButtons}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleDirectSpellConfirm}>
                  <Text style={styles.confirmText}>CAST SPELL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyButton} onPress={() => setDirectSpell(null)}>
                  <Text style={styles.denyText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* === HAND OF CARDS === */}
      <View style={styles.handContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handScroll}
        >
          {cards.length === 0 ? (
            <Text style={styles.emptyHand}>The Rift is silent... Draw a card.</Text>
          ) : (
            cards.map((card, index) => {
              const isUnplayable = player.mana < card.cost;
              const isPending = pendingSpell?.id === card.id;
              const isDimmed = pendingSpell !== null && !isPending;

              return (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => handleCardPress(card)}
                  activeOpacity={0.7}
                  disabled={pendingSpell !== null && !isPending}
                  style={[
                    styles.cardWrapper,
                    isUnplayable && styles.cardUnplayable,
                    isPending && styles.cardPending,
                    isDimmed && styles.cardDimmed,
                    { marginLeft: index === 0 ? 0 : -15 } // Overlap effect
                  ]}
                >
                  <CardComponent card={card} size="small" />
                  <View style={[styles.costBadge, isUnplayable ? styles.costNok : styles.costOk]}>
                    <Text style={styles.costText}>{card.cost}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: 10,
  },
  overlayContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  handContainer: {
    height: 120,
    justifyContent: 'flex-end',
  },
  handScroll: {
    paddingHorizontal: 30,
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  cardWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  cardUnplayable: {
    opacity: 0.5,
  },
  cardDimmed: {
    opacity: 0.3,
  },
  cardPending: {
    transform: [{ scale: 1.15 }, { translateY: -20 }],
    zIndex: 100,
    shadowColor: '#d4af37',
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  costBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#111316',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  costOk: {
    backgroundColor: '#4ECDC4', // Mana Cyan
    shadowColor: '#4ECDC4',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  costNok: {
    backgroundColor: '#FF6B6B', // Error Red
  },
  costText: {
    color: '#111316',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Sora',
  },
  emptyHand: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Sora',
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
  },
  // Targeting styles
  targetZone: {
    backgroundColor: 'rgba(17, 19, 22, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowRadius: 20,
    shadowOpacity: 0.3,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetIcon: {
    fontSize: 16,
  },
  targetLabel: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'Sora',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelText: {
    color: '#FF6B6B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  targetScroll: {
    gap: 12,
    paddingVertical: 5,
  },
  targetHeroButton: {
    width: 70,
    height: 90,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetHeroAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1c1f',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetHeroEmoji: {
    fontSize: 20,
  },
  targetHeroName: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 6,
    opacity: 0.6,
  },
  targetHpBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  targetHpText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  targetCardWrapper: {
    position: 'relative',
  },
  targetCrosshair: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#d4af37',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  crosshairEmoji: {
    fontSize: 10,
  },
  // Direct Spell Banner
  directSpellBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#d4af37',
    alignItems: 'center',
  },
  errorBanner: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  directSpellText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Sora',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 10,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 0,
  },
  directSpellButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  confirmText: {
    color: '#111316',
    fontWeight: '900',
    fontSize: 10,
    fontFamily: 'Sora',
  },
  denyButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  denyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
});


import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Card } from '../types';
import { CardComponent } from './Card';
import { useGameStore } from '../stores';
import { spellNeedsTarget } from '../rules/spellEffects';
import { getPreviewCardDimensions, getHandCardDimensions } from '../utils';


interface HandProps {
  cards: Card[];
  leftOffset?: number;   // marge gauche calculée depuis GameScreen
  rightOffset?: number;  // marge droite calculée depuis GameScreen
}


const { cardWidth: PREVIEW_W, cardHeight: PREVIEW_H } = getPreviewCardDimensions(0.75);
const { cardWidth: HAND_W, cardHeight: HAND_H } = getHandCardDimensions(0.25);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = -90;


export const Hand: React.FC<HandProps> = ({ cards, leftOffset = 0, rightOffset = 0 }) => {
  const playCard = useGameStore((s) => s.playCard);
  const playSpell = useGameStore((s) => s.playSpell);
  const state = useGameStore((s) => s.state);

  const opponent = state.players[(state.currentPlayerIndex + 1) % 2];

  const [focusedCard, setFocusedCard] = useState<Card | null>(null);
  const [pendingSpell, setPendingSpell] = useState<Card | null>(null);
  const [directSpell, setDirectSpell] = useState<Card | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;

  // Clean pendingSpell on turn change
  useEffect(() => {
    setPendingSpell(null);
    setDirectSpell(null);
  }, [state.currentPlayerIndex, state.turn]);

  // Clean focusedCard if it left the hand
  useEffect(() => {
    if (focusedCard && !cards.find((c) => c.id === focusedCard.id)) {
      setFocusedCard(null);
      translateY.setValue(0);
    }
  }, [cards, focusedCard, translateY]);

  // Auto-dismiss error
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(null), 1500);
    return () => clearTimeout(t);
  }, [errorMessage]);

  const closePreview = () => {
    setFocusedCard(null);
    translateY.setValue(0);
  };

  const playCardFromPreview = (card: Card) => {
    const { state } = useGameStore.getState();
    const livePlayer = state.players[state.currentPlayerIndex];
    const liveOpponent = state.players[(state.currentPlayerIndex + 1) % 2];

    if (!livePlayer) return;

    if (card.cost > livePlayer.mana) {
      setErrorMessage('Not enough mana');
      return;
    }

    if (card.type === 'minion') {
      playCard(card);
      return;
    }

    if (card.type === 'spell') {
      if (spellNeedsTarget(card.name)) {
        const opponentHasMinions = !!liveOpponent?.board?.length;
        if (!opponentHasMinions) {
          setDirectSpell(card);
        } else {
          setPendingSpell(card);
        }
      } else {
        playSpell(card);
      }
    }
  };

  const triggerPlay = (card: Card) => {
    Animated.timing(translateY, {
      toValue: -SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setFocusedCard(null);
      translateY.setValue(0);
      playCardFromPreview(card);
    });
  };

  // keep a ref of focusedCard so the (stable) PanResponder has fresh value
  const focusedCardRef = useRef<Card | null>(null);
  useEffect(() => {
    focusedCardRef.current = focusedCard;
  }, [focusedCard]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(gesture.dy < 0 ? gesture.dy : gesture.dy * 0.2);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < SWIPE_THRESHOLD && focusedCardRef.current) {
          triggerPlay(focusedCardRef.current);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const onCardTap = (card: Card) => {
    translateY.setValue(0);
    setFocusedCard(card);
  };

  const resolveTarget = (targetId: string) => {
    if (!pendingSpell) return;
    playSpell(pendingSpell, targetId);
    setPendingSpell(null);
  };

  const confirmDirectSpell = () => {
    if (!directSpell || !opponent) return;
    playSpell(directSpell);
    setDirectSpell(null);
  };

  return (
    <>
      {/* Target selection overlay */}
      {pendingSpell && opponent?.board && opponent.board.length > 0 && (
        <View style={styles.overlay} testID="target-selection-overlay">
          <View style={styles.overlayBox}>
            <Text style={styles.overlayTitle}>Choose a target</Text>
            <View style={styles.targetRow}>
              {opponent.board.map((m: any) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.targetBtn}
                  onPress={() => resolveTarget(m.id)}
                  testID={`target-${m.id}`}
                >
                  <Text style={styles.targetBtnText}>{m.name ?? 'Minion'}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.targetBtn, styles.heroTargetBtn]}
                onPress={() => {
                  if (!pendingSpell) return;
                  playSpell(pendingSpell);
                  setPendingSpell(null);
                }}
                testID="target-hero"
              >
                <Text style={styles.targetBtnText}>Hero</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setPendingSpell(null)}
              testID="cancel-target-button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Direct spell confirmation overlay */}
      {directSpell && (
        <View style={styles.overlay} testID="direct-cast-overlay">
          <View style={styles.overlayBox}>
            <Text style={styles.overlayTitle}>
              Cast {directSpell.name} on opponent hero?
            </Text>
            <View style={styles.targetRow}>
              <TouchableOpacity
                style={[styles.targetBtn, styles.heroTargetBtn]}
                onPress={confirmDirectSpell}
                testID="confirm-direct-cast"
              >
                <Text style={styles.targetBtnText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDirectSpell(null)}
                testID="cancel-direct-cast"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Error toast */}
      {errorMessage && (
        <View style={styles.errorOverlay} testID="error-overlay" pointerEvents="none">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Preview modal — rendu hors de la hiérarchie via Modal natif */}
      <Modal
        visible={!!focusedCard && !pendingSpell && !directSpell}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
        testID="card-preview-modal"
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={closePreview}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => { }}>
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.previewCardWrapper, { transform: [{ translateY }] }]}
              testID="preview-card"
            >
              <CardComponent
                card={focusedCard!}
                size="large"
                width={PREVIEW_W}
                height={PREVIEW_H}
              />
              <Text style={styles.hint}>Swipe up to play • Tap outside to close</Text>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Hand */}
      <View style={[styles.handContainer, { left: leftOffset, right: rightOffset }]} testID="hand-container">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handContent}
          testID="hand-scroll"
        >
          {cards.map((card) => {
            const isSelected = focusedCard?.id === card.id;
            return (
              <TouchableOpacity
                key={card.id}
                activeOpacity={0.8}
                onPress={() => onCardTap(card)}
                style={[styles.cardSlot, isSelected && styles.cardSlotSelected]}
                testID={`hand-card-${card.id}`}
              >
                <CardComponent card={card} size="small" width={HAND_W} height={HAND_H} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
};


const styles = StyleSheet.create({
  handContainer: {
    position: 'absolute',
    bottom: -30,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  handContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  cardSlot: {
    marginHorizontal: 4,
    borderRadius: 8,
  },
  cardSlotSelected: {
    transform: [{ translateY: -6 }],
    borderWidth: 2,
    borderColor: '#ffd56b',
    borderRadius: 10,
  },
  // Overlays (target / direct spell) — restent dans Hand car positionnés en absolu
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  overlayBox: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    minWidth: 280,
    alignItems: 'center',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  targetBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 4,
  },
  heroTargetBtn: {
    backgroundColor: '#b91c1c',
  },
  targetBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  errorOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 70,
  },
  errorText: {
    backgroundColor: 'rgba(185,28,28,0.9)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    fontWeight: '600',
  },
  // Modal natif — styles internes uniquement
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardWrapper: {
    alignItems: 'center',
  },
  hint: {
    color: '#fff',
    marginTop: 14,
    fontSize: 14,
    opacity: 0.85,
  },
});
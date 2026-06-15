import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Player, TurnPhase } from '../types';
import { Board } from './Board';

type BoardFocus = 'player' | 'balanced' | 'opponent';

const FOCUS_RATIOS: Record<BoardFocus, { opponent: number; player: number }> = {
  player:   { opponent: 0.10, player: 0.90 },
  balanced: { opponent: 0.40, player: 0.60 },
  opponent: { opponent: 0.90, player: 0.10 },
};

const PHASE_DEFAULT_FOCUS: Partial<Record<TurnPhase, BoardFocus>> = {
  main1:   'balanced',
  attack:  'player',
  defense: 'opponent',
  main2:   'balanced',
  end:     'balanced',
};

interface BoardContainerProps {
  player: Player;
  opponent: Player;
  isCurrentPlayer: boolean;
  turnPhase: TurnPhase;
  selectedAttackerId: string | null;
  onSelectAttacker: (attackerId: string | null) => void;
  onAttackDefender: (targetType: 'hero' | 'unit', targetId?: string) => void;
  onConfirmAttack: () => void;
  onAssignDefender: (attackerId: string, blockerId: string) => void;
  onConfirmDefense: () => void;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({
  player,
  opponent,
  isCurrentPlayer,
  turnPhase,
  selectedAttackerId,
  onSelectAttacker,
  onAttackDefender,
  onConfirmAttack,
  onAssignDefender,
  onConfirmDefense,
}) => {
  const [focus, setFocus] = useState<BoardFocus>('balanced');
  const focusRef = useRef<BoardFocus>('balanced');

  const opponentFlex = useRef(new Animated.Value(FOCUS_RATIOS.balanced.opponent)).current;
  const playerFlex   = useRef(new Animated.Value(FOCUS_RATIOS.balanced.player)).current;

  const snapToFocus = (newFocus: BoardFocus) => {
    focusRef.current = newFocus;
    setFocus(newFocus);
    const ratios = FOCUS_RATIOS[newFocus];
    Animated.spring(opponentFlex, {
      toValue: ratios.opponent,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
    Animated.spring(playerFlex, {
      toValue: ratios.player,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  };

  // Auto-snap selon la phase active
  useEffect(() => {
    const defaultFocus = PHASE_DEFAULT_FOCUS[turnPhase];
    if (defaultFocus) snapToFocus(defaultFocus);
  }, [turnPhase]);

  // Geste vertical propre avec RNGH v2
  // activeOffsetY  → s\'active seulement si mouvement vertical > 15px
  // failOffsetX    → abandonne si mouvement horizontal > 10px (laisse le FlatList scroller)
  const swipeGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-10, 10])
    .runOnJS(true)
    .onEnd((event) => {
      const current = focusRef.current;
      const swipedUp   = event.translationY < -30 || event.velocityY < -400;
      const swipedDown = event.translationY > 30  || event.velocityY > 400;

      if (swipedUp) {
        if (current === 'player')        snapToFocus('balanced');
        else if (current === 'balanced') snapToFocus('opponent');
      } else if (swipedDown) {
        if (current === 'opponent')      snapToFocus('balanced');
        else if (current === 'balanced') snapToFocus('player');
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        <Board
          player={player}
          opponent={opponent}
          isCurrentPlayer={isCurrentPlayer}
          turnPhase={turnPhase}
          selectedAttackerId={selectedAttackerId}
          onSelectAttacker={onSelectAttacker}
          onAttackDefender={onAttackDefender}
          onConfirmAttack={onConfirmAttack}
          onAssignDefender={onAssignDefender}
          onConfirmDefense={onConfirmDefense}
          opponentFlex={opponentFlex}
          playerFlex={playerFlex}
        />

        {/* 3 points indicateurs de focus */}
        <View style={styles.focusIndicators} pointerEvents="none">
          {(['opponent', 'balanced', 'player'] as BoardFocus[]).map((state) => (
            <View
              key={state}
              style={[styles.focusDot, focus === state && styles.focusDotActive]}
            />
          ))}
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  focusIndicators: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -24 }],
    alignItems: 'center',
    gap: 6,
  },
  focusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  focusDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4af37',
  },
});
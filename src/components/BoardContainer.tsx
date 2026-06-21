import React, { useRef, useState, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CombatAttack, CombatBlock, Player, TurnPhase } from '../types';
import { Board } from './Board';
import { useGameStore } from '../stores';

type BoardFocus = 'player1' | 'balanced' | 'player2';

const FOCUS_RATIOS: Record<BoardFocus, { player2: number; player1: number }> = {
  player1: { player2: 0.10, player1: 0.90 },
  balanced: { player2: 0.40, player1: 0.60 },
  player2: { player2: 0.90, player1: 0.10 },
};

interface BoardContainerProps {
  player1: Player;
  player2: Player;
  currentPlayerIndex: 0 | 1;
  turnPhase: TurnPhase;
  selectedAttackerId: string | null;
  onSelectedAttackerChange: (id: string | null) => void;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({
  player1, player2, currentPlayerIndex, turnPhase, onSelectedAttackerChange,
  selectedAttackerId,
}) => {
  // ── Store actions ───────────────────────────────────────────────────────────
  const attacks = useGameStore(s => s.state.combat.attacks);
  const blocks = useGameStore(s => s.state.combat.blocks);
  const declareAttack = useGameStore(s => s.declareAttack);
  const cancelAttack = useGameStore(s => s.cancelAttack);
  const declareBlock = useGameStore(s => s.declareBlock);
  const cancelBlock = useGameStore(s => s.cancelBlock);

  // ── Sélection UI locale ─────────────────────────────────────────────────────
  // Séparée du store : c'est de l'UI temporaire avant confirmation
  const [selectedBlockerId, setSelectedBlockerId] = useState<string | null>(null);

  useEffect(() => {
    onSelectedAttackerChange(null);
    setSelectedBlockerId(null);
  }, [turnPhase]);

  // ── Handlers qui relient UI → store ─────────────────────────────────────────

  const handleDeclareAttack = (attack: CombatAttack) => {
    declareAttack(attack);
    onSelectedAttackerChange(null);
  };

  const handleDeclareBlock = (block: CombatBlock) => {
    declareBlock(block);
    setSelectedBlockerId(null);
  };

  // ── Swipe / focus ───────────────────────────────────────────────────────────
  const [focus, setFocus] = useState<BoardFocus>('balanced');
  const focusRef = useRef<BoardFocus>('balanced');
  const player2Flex = useRef(new Animated.Value(0.40)).current;
  const player1Flex = useRef(new Animated.Value(0.60)).current;

  const snapToFocus = (f: BoardFocus) => {
    focusRef.current = f;
    setFocus(f);
    const r = FOCUS_RATIOS[f];
    Animated.spring(player2Flex, { toValue: r.player2, useNativeDriver: false, tension: 80, friction: 10 }).start();
    Animated.spring(player1Flex, { toValue: r.player1, useNativeDriver: false, tension: 80, friction: 10 }).start();
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-10, 10])
    .runOnJS(true)
    .onEnd(e => {
      const up = e.translationY < -30 || e.velocityY < -400;
      const down = e.translationY > 30 || e.velocityY > 400;
      const cur = focusRef.current;
      if (up) snapToFocus(cur === 'player1' ? 'balanced' : 'player2');
      if (down) snapToFocus(cur === 'player2' ? 'balanced' : 'player1');
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1 }}>
        <Board
          player1={player1}
          player2={player2}
          currentPlayerIndex={currentPlayerIndex}
          turnPhase={turnPhase}
          attacks={attacks}
          blocks={blocks}
          selectedAttackerId={selectedAttackerId}
          selectedBlockerId={selectedBlockerId}
          onSelectAttacker={onSelectedAttackerChange}
          onSelectBlocker={setSelectedBlockerId}
          onDeclareAttack={handleDeclareAttack}
          onCancelAttack={cancelAttack}
          onDeclareBlock={handleDeclareBlock}
          onCancelBlock={cancelBlock}
          player2Flex={player2Flex}
          player1Flex={player1Flex}
        />
        {/* Indicateurs de focus */}
        <View style={styles.focusIndicators} pointerEvents="none">
          {(['player2', 'balanced', 'player1'] as BoardFocus[]).map(s => (
            <View key={s} style={[styles.focusDot, focus === s && styles.focusDotActive]} />
          ))}
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  focusIndicators: { position: 'absolute' as const, right: 8, top: '50%', transform: [{ translateY: -28 }], gap: 6, alignItems: 'center' as const },
  focusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  focusDotActive: { backgroundColor: '#d4af37', width: 8, height: 8, borderRadius: 4 },
});
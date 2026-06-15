import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../stores';
import { Hand, GameOverModal } from '../components';
import { BoardContainer } from '../components/BoardContainer';
import { lockLandscape, unlockOrientation } from '../utils';
import { LeftPanel } from '../components/LeftPanel';
import { RightPanel } from '../components/RightPanel';

type GameScreenProps = {
  onBackToHome: () => void;
};

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToHome }) => {
  const state = useGameStore((s) => s.state);
  const nextTurnPhase = useGameStore((s) => s.nextTurnPhase);
  const endTurn = useGameStore((s) => s.endTurn);
  const resetGame = useGameStore((s) => s.resetGame);

  const selectAttackTarget = useGameStore((s) => s.selectAttackTarget);
  const confirmAttackPhase = useGameStore((s) => s.confirmAttackPhase);
  const assignDefender = useGameStore((s) => s.assignDefender);
  const confirmDefensePhase = useGameStore((s) => s.confirmDefensePhase);

  const turnPhase = state.turnPhase;
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);

  useEffect(() => {
    lockLandscape();
    return () => {
      unlockOrientation();
    };
  }, []);

  useEffect(() => {
    setSelectedAttackerId(null);
  }, [state.currentPlayerIndex, turnPhase]);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const opponent = state.players[state.currentPlayerIndex === 0 ? 1 : 0];
  const isGameActive = state.gamePhase === 'playing';

  if (state.gamePhase === 'home') {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Returning to Rift Sanctum...</Text>
      </View>
    );
  }

  const handleSelectAttacker = (attackerId: string | null) => {
    if (turnPhase !== 'attack') return;
    setSelectedAttackerId(attackerId);
  };

  const handleSelectAttackTarget = (targetType: 'hero' | 'unit', targetId?: string) => {
    if (!selectedAttackerId || turnPhase !== 'attack') return;
    selectAttackTarget(selectedAttackerId, { type: targetType, targetId });
    setSelectedAttackerId(null);
  };

  const handleConfirmAttackPhase = () => {
    confirmAttackPhase();
    setSelectedAttackerId(null);
  };

  const handleAssignDefender = (attackerId: string, blockerId: string) => {
    if (turnPhase !== 'defense') return;
    assignDefender(attackerId, blockerId);
  };

  const handleConfirmDefensePhase = () => {
    confirmDefensePhase();
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.gameRow}>
          <LeftPanel
            player={currentPlayer}
            opponent={opponent}
            selectedAttackerId={selectedAttackerId}
            onAttackHero={handleSelectAttackTarget}
          />

          <View style={styles.centerColumn}>
            <BoardContainer
              player={currentPlayer}
              opponent={opponent}
              isCurrentPlayer={isGameActive}
              turnPhase={turnPhase}
              selectedAttackerId={selectedAttackerId}
              onSelectAttacker={handleSelectAttacker}
              onAttackDefender={handleSelectAttackTarget}
              onConfirmAttack={handleConfirmAttackPhase}
              onAssignDefender={handleAssignDefender}
              onConfirmDefense={handleConfirmDefensePhase}
            />

            <Hand cards={currentPlayer.hand} />
          </View>

          <RightPanel
            player={currentPlayer}
            opponent={opponent}
            turnPhase={turnPhase}
            onEndTurn={endTurn}
            onNextPhase={nextTurnPhase}
          />
        </View>

        <GameOverModal
          visible={state.gamePhase === 'gameover' && state.winner !== null}
          winner={state.winner}
          onRestart={resetGame}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0e11',
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0c0e11',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#d4af37',
    fontSize: 18,
    fontFamily: 'Sora',
    letterSpacing: 2,
  },
  gameRow: {
    flex: 1,
    flexDirection: 'row',
  },
  centerColumn: {
    flex: 1,
  },
});
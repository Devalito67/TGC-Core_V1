import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../stores';
import { Hand, GameOverModal } from '../components';
import { BoardContainer } from '../components/BoardContainer';
import { LeftPanel } from '../components/LeftPanel';
import { RightPanel } from '../components/RightPanel';
import { lockLandscape, unlockOrientation } from '../utils';

type GameScreenProps = { onBackToHome: () => void };

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToHome }) => {
  const state = useGameStore(s => s.state);
  const endTurn = useGameStore(s => s.endTurn);
  const nextTurnPhase = useGameStore(s => s.nextTurnPhase);
  const resetGame = useGameStore(s => s.resetGame);
  const declareAttack = useGameStore(s => s.declareAttack);
  const confirmAttacks = useGameStore(s => s.confirmAttacks);

  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);

  const player1 = state.players[0];
  const player2 = state.players[1];
  const currentPlayerIndex = state.currentPlayerIndex;
  const currentPlayer = state.players[currentPlayerIndex];
  const isGameActive = state.gamePhase === 'playing';
  const turnPhase = state.turnPhase;

  useEffect(() => {
    lockLandscape();
    return () => {
      unlockOrientation();
    };
  }, []);

  useEffect(() => {
    setSelectedAttackerId(null);
  }, [state.currentPlayerIndex, state.turnPhase]);

  useEffect(() => {
    if (turnPhase !== 'attack') return;
    if (!isGameActive) return;

    const hasAvailableAttacker = currentPlayer.board.some(
      c => !c.summoningSickness && !c.tapped
    );

    if (!hasAvailableAttacker) {
      // Petit délai pour que le joueur voie la phase s'afficher
      const timer = setTimeout(() => confirmAttacks(), 600);
      return () => clearTimeout(timer);
    }
  }, [turnPhase, currentPlayer.board]);

  const handleAttackHero = () => {
    if (!selectedAttackerId) return;
    declareAttack({ attackerId: selectedAttackerId, targetType: 'hero' });
    setSelectedAttackerId(null);
  };

  if (state.gamePhase === 'home') {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Returning to Rift Sanctum...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.gameRow}>

          <LeftPanel
            player1={player1}
            player2={player2}
            turnPhase={turnPhase}
            currentPlayerIndex={currentPlayerIndex}
            selectedAttackerId={selectedAttackerId}   // ← partagé
            onAttackHero={handleAttackHero}            // ← partagé
          />

          <View style={styles.centerColumn}>
            <BoardContainer
              player1={player1}
              player2={player2}
              currentPlayerIndex={currentPlayerIndex}
              turnPhase={turnPhase}
              selectedAttackerId={selectedAttackerId}            // ← reçu
              onSelectedAttackerChange={setSelectedAttackerId}   // ← remonte
            />
            <Hand cards={currentPlayer.hand} />
          </View>

          <RightPanel
            player1={player1}
            player2={player2}
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

const styles = StyleSheet.create ({
  root: { flex: 1, backgroundColor: '#0c0e11' },
  container: { flex: 1 },
  centered: { flex: 1, backgroundColor: '#0c0e11', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#d4af37', fontSize: 18, letterSpacing: 2 },
  gameRow: { flex: 1, flexDirection: 'row' },
  centerColumn: { flex: 1 },
});
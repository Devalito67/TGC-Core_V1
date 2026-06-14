import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../stores';
import { Hand, Board, GameOverModal } from '../components';
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
  const attackWithCard = useGameStore((s) => s.attackWithCard);
  const attackPlayer = useGameStore((s) => s.attackPlayer);

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

  const handleAttackHero = (attackerId: string) => {
    attackPlayer(attackerId);
    setSelectedAttackerId(null);
  };

  const handleAttackDefender = (attackerId: string, defenderId: string) => {
    attackWithCard(attackerId, defenderId);
    setSelectedAttackerId(null);
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
            onAttackHero={handleAttackHero}
          />

          <View style={styles.centerColumn}>
            <Board
              player={currentPlayer}
              opponent={opponent}
              isCurrentPlayer={isGameActive}
              turnPhase={turnPhase}
              selectedAttackerId={selectedAttackerId}
              onSelectAttacker={setSelectedAttackerId}
              onAttackDefender={handleAttackDefender}
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
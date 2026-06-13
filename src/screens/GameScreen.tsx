import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../stores';
import { Hand, Board, GameOverModal } from '../components';
import { lockLandscape, unlockOrientation } from '../utils/lockLandcape';

type GameScreenProps = {
  onBackToHome: () => void;
};

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToHome }) => {
  const state = useGameStore((s) => s.state);

  const endTurn = useGameStore((s) => s.endTurn);
  const resetGame = useGameStore((s) => s.resetGame);
  const attackWithCard = useGameStore((s) => s.attackWithCard);
  const attackPlayer = useGameStore((s) => s.attackPlayer);
  const turnPhase = state.turnPhase;

  useEffect(() => {
    lockLandscape();
    return () => {
      unlockOrientation();
    };
  }, []);

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

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.boardWrapper}>
          <Board
            player={currentPlayer}
            opponent={opponent}
            isCurrentPlayer={isGameActive}
            turnPhase={turnPhase}
            onAttackSelf={attackWithCard}
            onAttackOpponent={attackPlayer}
            onEndTurn={endTurn}
          />
        </View>

        <View style={styles.overlayUi}>
          <View style={styles.handWrapper}>
            <Hand cards={currentPlayer.hand} />
          </View>
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
  boardWrapper: {
    flex: 1,
    zIndex: 1,
  },
  overlayUi: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    flexDirection: 'row',
    pointerEvents: 'box-none',
    zIndex: 10,
  },
  handWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
});
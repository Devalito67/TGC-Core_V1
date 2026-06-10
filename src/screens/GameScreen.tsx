import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../stores';
import { Hand, Board, GameLog, Controls, GameOverModal } from '../components';

type GameScreenProps = {
  onBackToHome: () => void;
};

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToHome }) => {
  const state = useGameStore((s) => s.state);
  const drawCard = useGameStore((s) => s.drawCard);
  const endTurn = useGameStore((s) => s.endTurn);
  const resetGame = useGameStore((s) => s.resetGame);
  const attackWithCard = useGameStore((s) => s.attackWithCard);
  const attackPlayer = useGameStore((s) => s.attackPlayer);

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
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const opponent = state.players[state.currentPlayerIndex === 0 ? 1 : 0];
  const isCurrentPlayer = state.gamePhase === 'playing';

  const canDraw = currentPlayer.hand.length < 10;
  const canEndTurn = true;

  if (state.gamePhase === 'home') {
    return <Text style={styles.empty}>Retour à l'accueil</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Board
        player={currentPlayer}
        opponent={opponent}
        isCurrentPlayer={isCurrentPlayer}
        onAttackSelf={attackWithCard}
        onAttackOpponent={attackPlayer}
      />

      <View style={styles.bottomPanel}>
        <View style={styles.handContainer}>
          <Text style={styles.handTitle}>🖐️ Ta main</Text>
          <Hand cards={currentPlayer.hand} />
        </View>

        <View style={styles.sidePanel}>
          <Controls
            onDraw={drawCard}
            onEndTurn={endTurn}
            canDraw={canDraw}
            canEndTurn={canEndTurn}
          />
          <GameLog logs={state.logs} />
        </View>
      </View>

      <GameOverModal
        visible={state.gamePhase === 'gameover'}
        winner={state.winner}
        onRestart={resetGame}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  empty: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingBottom: 6,
  },
  handContainer: {
    flex: 2,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
  handTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  sidePanel: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-start',
  },
});
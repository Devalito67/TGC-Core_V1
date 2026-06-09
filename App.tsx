import { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MenuScreen, GameScreen, DeckBuilderScreen } from './src/screens';
import { useGameStore } from './src/stores';
import { NavigationBar } from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';


type ActiveScreen = 'menu' | 'game' | 'deck';

export default function App() {
  const gamePhase = useGameStore((s) => s.state.gamePhase);
  const resetGame = useGameStore((s) => s.resetGame);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('menu');
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (gamePhase === 'playing') {
      setActiveScreen('game');
    }
    if (gamePhase === 'menu') {
      setActiveScreen('menu');
    }
  }, [gamePhase]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setHidden(true);
    }
  }, []);

  useEffect(() => {
  const updateOrientation = async () => {
    const orientation = await ScreenOrientation.getOrientationAsync();
    setIsLandscape(
      orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
      orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
    );
  };

    updateOrientation();

  const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
    const orientation = event.orientationInfo.orientation;
    setIsLandscape(
      orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
      orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
    );
  });

  return () => {
    subscription.remove();
  };
}, []);

  const handleReset = () => {
    resetGame();
    setActiveScreen('menu');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'game':
        return <GameScreen onBackToMenu={handleReset} />;
      case 'deck':
        return <DeckBuilderScreen />;
      default:
        return <MenuScreen onGoToDeck={() => setActiveScreen('deck')} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={isLandscape} style="light"/>
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {activeScreen !== 'game' && (
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => setActiveScreen('menu')}
            style={[styles.navButton, activeScreen === 'menu' && styles.navButtonActive]}
          >
            <Text style={styles.navButtonText}>🏠 Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveScreen('deck')}
            style={[styles.navButton, activeScreen === 'deck' && styles.navButtonActive]}
          >
            <Text style={styles.navButtonText}>🃏 Deck</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(78,205,196,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navButtonActive: {
    backgroundColor: 'rgba(78,205,196,0.2)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameScreen, DeckBuilderScreen, HomeScreen } from './src/screens';
import { useGameStore } from './src/stores';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

enableScreens();

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  DeckBuilder: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const resetGame = useGameStore((s) => s.resetGame);
  const [isLandscape, setIsLandscape] = useState(false);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={isLandscape} style="light" />
        <View style={styles.content}>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="Home">
                {(props) => <HomeScreen {...props} />}
              </Stack.Screen>

              <Stack.Screen name="DeckBuilder">
                {(props) => <DeckBuilderScreen {...props} />}
              </Stack.Screen>

              <Stack.Screen name="Game">
                {(props) => (
                  <GameScreen
                    {...props}
                    onBackToHome={resetGame}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
});
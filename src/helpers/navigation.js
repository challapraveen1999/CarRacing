import React from 'react';
import { View, StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import colorCodes from './colorCodes.json';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ModeSelectionScreen from '../screens/ModeSelectionScreen';
import GarageScreen from '../screens/GarageScreen';
import GameScreen from '../screens/GameScreen';
import PauseScreen from '../screens/PauseScreen';
import GameOverScreen from '../screens/GameOverScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Safe gesture-handler root view (uses native gesture handler if installed, or falls back to View)
let GestureHandlerRootView = View;
try {
  const Rngh = require('react-native-gesture-handler');
  if (Rngh && Rngh.GestureHandlerRootView) {
    GestureHandlerRootView = Rngh.GestureHandlerRootView;
  }
} catch {
  GestureHandlerRootView = View;
}

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: colorCodes.background,
      }}
      edges={[]}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor={colorCodes.White} />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          {/* <Stack.Screen name="SignUp" component={SignUp} /> */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Modes" component={ModeSelectionScreen} />
          <Stack.Screen name="Garage" component={GarageScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Pause" component={PauseScreen} />
          <Stack.Screen name="GameOver" component={GameOverScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default Navigation;

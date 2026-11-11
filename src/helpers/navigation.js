
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ModeSelectionScreen from '../screens/ModeSelectionScreen';
import GarageScreen from '../screens/GarageScreen';
import GameScreen from '../screens/GameScreen';
import PauseScreen from '../screens/PauseScreen';
import GameOverScreen from '../screens/GameOverScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}>

                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Modes" component={ModeSelectionScreen} />
                <Stack.Screen name="Garage" component={GarageScreen} />
                <Stack.Screen name="Game" component={GameScreen} />
                <Stack.Screen name="Pause" component={PauseScreen} />
                <Stack.Screen name="GameOver" component={GameOverScreen} />
                <Stack.Screen name="Results" component={ResultsScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;

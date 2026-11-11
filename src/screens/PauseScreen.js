import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { playEffect } from '../helpers/SoundManager';

const PauseScreen = ({ navigation, route }) => {
  const { onResume, onRestart } = route.params || {};

  const handleResume = () => {
    playEffect('button');
    if (onResume) onResume();
    navigation.goBack();
  };

  const handleRestart = () => {
    playEffect('button');
    if (onRestart) onRestart();
    navigation.goBack();
  };

  const handleExit = () => {
    playEffect('button');
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.overlay} />

      <View style={styles.card}>
        <Text style={styles.pauseTitle}>GAME PAUSED</Text>
        <Text style={styles.pauseSubtitle}>TAKE A BREATH, SPEEDSTER</Text>

        <TouchableOpacity
          style={[styles.menuButton, styles.resumeButton]}
          activeOpacity={0.8}
          onPress={handleResume}>
          <Text style={styles.buttonText}>▶ RESUME</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.8}
          onPress={handleRestart}>
          <Text style={styles.buttonText}>🔄 RESTART</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.8}
          onPress={() => {
            playEffect('button');
            navigation.navigate('Settings');
          }}>
          <Text style={styles.buttonText}>⚙️ SETTINGS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.exitButton]}
          activeOpacity={0.8}
          onPress={handleExit}>
          <Text style={[styles.buttonText, { color: colors.danger }]}>🚪 QUIT TO HOME</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(13, 17, 23, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  pauseSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 28,
  },
  menuButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.backgroundSurface,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resumeButton: {
    backgroundColor: colors.primaryNeon,
    borderColor: colors.primaryNeon,
  },
  exitButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
});

export default PauseScreen;


import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { loadAllGameData } from '../helpers/storage';
import {
  initializeSounds,
  setMusicEnabled,
  setEffectsEnabled,
  setVibrationEnabled,
} from '../helpers/SoundManager';

const SplashScreen = ({ navigation }) => {
  const pulseAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Initialize sounds and load storage data
    initializeSounds();

    // 2. Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.timing(needleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    // 3. Prepare game storage and transition
    const prepareGame = async () => {
      const startTime = Date.now();
      const gameData = await loadAllGameData();
      if (gameData) {
        setMusicEnabled(gameData.musicEnabled ?? true);
        setEffectsEnabled(gameData.effectsEnabled ?? true);
        setVibrationEnabled(gameData.vibrationEnabled ?? true);
      }
      const elapsed = Date.now() - startTime;
      const minDelay = 2400; // Allow splash animation to finish nicely
      const remainingTime = Math.max(0, minDelay - elapsed);

      setTimeout(() => {
        navigation.replace('Home');
      }, remainingTime);
    };

    prepareGame();
  }, [fadeAnim, needleAnim, navigation, progressAnim, pulseAnim]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const needleRotation = needleAnim.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: ['-60deg', '80deg', '40deg', '120deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Background Glow Effect */}
      <View style={styles.glowCircle} />

      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {/* Tachometer / Speed Badge */}
        <Animated.View style={[styles.badgeContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.gaugeOuter}>
            <View style={styles.gaugeInner}>
              <Animated.View
                style={[
                  styles.needle,
                  {
                    transform: [
                      { rotate: needleRotation },
                      { translateY: -22 },
                    ],
                  },
                ]}
              />
              <Text style={styles.gaugeCenterIcon}>🏎️</Text>
            </View>
          </View>
        </Animated.View>

        {/* Title Branding */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleTurbo}>TURBO</Text>
          <Text style={styles.titleRush}>RUSH</Text>
        </View>
        <Text style={styles.tagline}>EXTREME ARCADE RACING</Text>

        {/* Loading Progress Bar */}
        <View style={styles.loadingSection}>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
          </View>
          <Text style={styles.loadingText}>WARMING UP ENGINES...</Text>
        </View>
      </Animated.View>

      <Text style={styles.versionText}>v1.0.0 • REACT NATIVE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glowCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    filter: 'blur(40px)',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  badgeContainer: {
    marginBottom: 28,
  },
  gaugeOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primaryNeon,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 12,
  },
  gaugeInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  needle: {
    position: 'absolute',
    width: 3,
    height: 44,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  gaugeCenterIcon: {
    fontSize: 34,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleTurbo: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 4,
    fontStyle: 'italic',
  },
  titleRush: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.primaryNeon,
    letterSpacing: 4,
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 42, 84, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 5,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 48,
  },
  loadingSection: {
    width: '78%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryNeon,
    borderRadius: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  versionText: {
    position: 'absolute',
    bottom: 24,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
});

export default SplashScreen;


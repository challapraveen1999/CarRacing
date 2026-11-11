import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { getItem, setItem, resetGameData } from '../helpers/storage';
import { STORAGE_KEYS } from '../helpers/gameConstants';
import {
  setMusicEnabled,
  setEffectsEnabled,
  setVibrationEnabled,
  setMusicVolume,
  setEffectsVolume,
  playEffect,
  playStartSound,
  playDash,
  playBrake,
  playBlastSound,
  playHonkSound,
  playCoinSound,
  playCoinVoice,
  playCountdownSound,
} from '../helpers/SoundManager';

const SettingsScreen = ({ navigation }) => {
  const [music, setMusic] = useState(true);
  const [effects, setEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [musicVol, setMusicVol] = useState(0.7);
  const [effectsVol, setEffectsVol] = useState(0.8);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedMusic = await getItem(STORAGE_KEYS.MUSIC_ENABLED, true);
    const savedEffects = await getItem(STORAGE_KEYS.EFFECTS_ENABLED, true);
    const savedVibration = await getItem(STORAGE_KEYS.VIBRATION_ENABLED, true);
    const savedMusicVol = await getItem(STORAGE_KEYS.MUSIC_VOLUME, 0.7);
    const savedEffectsVol = await getItem(STORAGE_KEYS.EFFECTS_VOLUME, 0.8);

    setMusic(savedMusic);
    setEffects(savedEffects);
    setVibration(savedVibration);
    setMusicVol(savedMusicVol);
    setEffectsVol(savedEffectsVol);

    setMusicEnabled(savedMusic);
    setEffectsEnabled(savedEffects);
    setVibrationEnabled(savedVibration);
    setMusicVolume(savedMusicVol);
    setEffectsVolume(savedEffectsVol);
  };

  const handleToggleMusic = async (val) => {
    setMusic(val);
    setMusicEnabled(val);
    await setItem(STORAGE_KEYS.MUSIC_ENABLED, val);
  };

  const handleToggleEffects = async (val) => {
    setEffects(val);
    setEffectsEnabled(val);
    await setItem(STORAGE_KEYS.EFFECTS_ENABLED, val);
    if (val) playEffect('button');
  };

  const handleToggleVibration = async (val) => {
    setVibration(val);
    setVibrationEnabled(val);
    await setItem(STORAGE_KEYS.VIBRATION_ENABLED, val);
    if (val) playEffect('button');
  };

  const adjustMusicVolume = async (delta) => {
    const nextVal = Math.round(Math.max(0, Math.min(1, musicVol + delta)) * 10) / 10;
    setMusicVol(nextVal);
    setMusicVolume(nextVal);
    await setItem(STORAGE_KEYS.MUSIC_VOLUME, nextVal);
    playEffect('button');
  };

  const adjustEffectsVolume = async (delta) => {
    const nextVal = Math.round(Math.max(0, Math.min(1, effectsVol + delta)) * 10) / 10;
    setEffectsVol(nextVal);
    setEffectsVolume(nextVal);
    await setItem(STORAGE_KEYS.EFFECTS_VOLUME, nextVal);
    playEffect('button');
  };

  const handleResetProgress = () => {
    playEffect('button');
    Alert.alert(
      'Reset All Progress?',
      'This will delete all unlocked cars, best scores, and coins. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetGameData();
            setMusic(true);
            setEffects(true);
            setVibration(true);
            setMusicVol(0.7);
            setEffectsVol(0.8);
            setMusicEnabled(true);
            setEffectsEnabled(true);
            setVibrationEnabled(true);
            setMusicVolume(0.7);
            setEffectsVolume(0.8);
            Alert.alert('Reset Complete', 'Your game progress has been reset to defaults.');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            playEffect('button');
            navigation.goBack();
          }}>
          <Text style={styles.backButtonText}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Audio & Haptics Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>AUDIO & CONTROLS</Text>

          {/* Music Toggle */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Background Music</Text>
              <Text style={styles.settingDesc}>Arcade synthwave soundtrack</Text>
            </View>
            <Switch
              value={music}
              onValueChange={handleToggleMusic}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={music ? colors.textPrimary : colors.textSecondary}
            />
          </View>

          {/* Music Volume Slider */}
          {music && (
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabel}>Music Volume: {Math.round(musicVol * 100)}%</Text>
              <View style={styles.volumeControls}>
                <TouchableOpacity
                  style={styles.volBtn}
                  activeOpacity={0.7}
                  onPress={() => adjustMusicVolume(-0.1)}>
                  <Text style={styles.volBtnText}>-</Text>
                </TouchableOpacity>

                <View style={styles.volumeBarBg}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      { width: `${Math.round(musicVol * 100)}%` },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.volBtn}
                  activeOpacity={0.7}
                  onPress={() => adjustMusicVolume(0.1)}>
                  <Text style={styles.volBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sound Effects Toggle */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Sound Effects</Text>
              <Text style={styles.settingDesc}>Engine, collision, and coins</Text>
            </View>
            <Switch
              value={effects}
              onValueChange={handleToggleEffects}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={effects ? colors.textPrimary : colors.textSecondary}
            />
          </View>

          {/* Effects Volume Slider */}
          {effects && (
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabel}>Effects Volume: {Math.round(effectsVol * 100)}%</Text>
              <View style={styles.volumeControls}>
                <TouchableOpacity
                  style={styles.volBtn}
                  activeOpacity={0.7}
                  onPress={() => adjustEffectsVolume(-0.1)}>
                  <Text style={styles.volBtnText}>-</Text>
                </TouchableOpacity>

                <View style={styles.volumeBarBg}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      { width: `${Math.round(effectsVol * 100)}%` },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.volBtn}
                  activeOpacity={0.7}
                  onPress={() => adjustEffectsVolume(0.1)}>
                  <Text style={styles.volBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Vibration */}
          <View style={[styles.settingRow, styles.lastSettingRow]}>
            <View>
              <Text style={styles.settingTitle}>Haptic Vibration</Text>
              <Text style={styles.settingDesc}>Crash & tactile feedback</Text>
            </View>
            <Switch
              value={vibration}
              onValueChange={handleToggleVibration}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={vibration ? colors.textPrimary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Sound Effects Preview & Test Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>SOUND EFFECTS TEST & PREVIEW</Text>
          <Text style={styles.previewSubtitle}>Tap any sound effect to test playback on your device:</Text>

          <View style={styles.previewGrid}>
            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playStartSound()}>
              <Text style={styles.previewChipIcon}>🏎️</Text>
              <Text style={styles.previewChipText}>Engine Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playDash()}>
              <Text style={styles.previewChipIcon}>⚡</Text>
              <Text style={styles.previewChipText}>Dash Boost</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playBrake()}>
              <Text style={styles.previewChipIcon}>🛑</Text>
              <Text style={styles.previewChipText}>Brake Skid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playHonkSound()}>
              <Text style={styles.previewChipIcon}>🎺</Text>
              <Text style={styles.previewChipText}>Car Honk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playBlastSound()}>
              <Text style={styles.previewChipIcon}>💥</Text>
              <Text style={styles.previewChipText}>Car Blast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playCoinSound()}>
              <Text style={styles.previewChipIcon}>🪙</Text>
              <Text style={styles.previewChipText}>Coin Collect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playCoinVoice()}>
              <Text style={styles.previewChipIcon}>🗣️</Text>
              <Text style={styles.previewChipText}>Coin Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => playCountdownSound()}>
              <Text style={styles.previewChipIcon}>🏁</Text>
              <Text style={styles.previewChipText}>3,2,1 GO!</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Game Data Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>GAME STORAGE</Text>

          <TouchableOpacity
            style={styles.dangerButton}
            activeOpacity={0.8}
            onPress={handleResetProgress}>
            <Text style={styles.dangerButtonText}>⚠️ RESET PROGRESS & DATA</Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.aboutCard}>
          <Text style={styles.gameTitle}>TURBO RUSH</Text>
          <Text style={styles.gameSubtitle}>REACT NATIVE ARCADE RACER</Text>
          <Text style={styles.copyrightText}>Build 1.0.0 • Mobile Highway Racing</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: 20,
  },
  sectionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  lastSettingRow: {
    borderBottomWidth: 0,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  volumeRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  volumeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 6,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  volBtnText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  volumeBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  previewSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  previewChip: {
    width: '48%',
    backgroundColor: colors.backgroundSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  aboutCard: {
    alignItems: 'center',
    marginTop: 18,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  gameSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2,
    marginTop: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
});

export default SettingsScreen;

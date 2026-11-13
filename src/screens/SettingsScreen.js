import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { getItem, setItem, resetGameData } from '../helpers/storage';
import { STORAGE_KEYS } from '../helpers/gameConstants';
import CustomModal from '../components/CustomModal';
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
  playCollisionSound,
  playHealthSound,
  playHonkSound,
  playHornSound,
  playCoinSound,
  playCoinVoice,
  playCountdownSound,
  playBrakeSound,
} from '../helpers/SoundManager';

const SettingsScreen = ({ navigation }) => {
  const [music, setMusic] = useState(true);
  const [effects, setEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [musicVol, setMusicVol] = useState(0.7);
  const [effectsVol, setEffectsVol] = useState(0.8);
  const [activeTestSound, setActiveTestSound] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: '⚙️',
    type: 'default',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: () => {},
  });

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

  const handleTestSound = (label, filename, soundFn) => {
    try {
      soundFn(true); // force=true guarantees preview sounds play even if effects/music are toggled off
      setActiveTestSound({ label, filename });
      setTimeout(() => {
        setActiveTestSound(prev => (prev?.label === label ? null : prev));
      }, 1600);
    } catch (e) {
      console.warn('Error testing sound:', e);
    }
  };

  const handleResetProgress = () => {
    playEffect('button');
    setModalConfig({
      visible: true,
      title: 'RESET ALL PROGRESS?',
      message: 'This will delete all unlocked cars, best scores, and coins. This action cannot be undone.',
      icon: '⚠️',
      type: 'danger',
      confirmText: 'YES, RESET',
      cancelText: 'CANCEL',
      onConfirm: async () => {
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

        setTimeout(() => {
          setModalConfig({
            visible: true,
            title: 'RESET COMPLETE',
            message: 'All game data, unlocked cars, and preferences have been restored to defaults.',
            icon: '✅',
            type: 'success',
            confirmText: 'DONE',
            cancelText: null,
            onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false })),
          });
        }, 150);
      },
    });
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
          <Text style={styles.previewSubtitle}>Tap any sound effect to test playback live on your device:</Text>

          {/* Active Sound Playback Indicator */}
          {activeTestSound && (
            <View style={styles.activeTestBanner}>
              <Text style={styles.activeTestIcon}>🔊</Text>
              <Text style={styles.activeTestText}>
                PLAYING: {activeTestSound.label.toUpperCase()} ({activeTestSound.filename})
              </Text>
            </View>
          )}

          {/* User Requested Primary Audio Tests */}
          <Text style={styles.testCategoryHeader}>CORE GAME SOUNDS</Text>
          <View style={styles.primaryTestColumn}>
            {/* 1. Coin Collecting Sound */}
            <TouchableOpacity
              style={[styles.primaryTestCard, { borderColor: '#FFE600' }]}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Coin Collecting', 'coin_collecting.mp3', playCoinSound)}>
              <View style={styles.testCardLeft}>
                <Text style={styles.primaryTestIcon}>🪙</Text>
                <View>
                  <Text style={[styles.primaryTestTitle, { color: '#FFE600' }]}>Coin Collecting</Text>
                  <Text style={styles.primaryTestFile}>coin_collecting.mp3 / coin_collect.mp3</Text>
                </View>
              </View>
              <View style={[styles.testPlayBadge, { backgroundColor: 'rgba(255, 230, 0, 0.2)' }]}>
                <Text style={[styles.testPlayBadgeText, { color: '#FFE600' }]}>TEST 🔊</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Car Crash / Collision Sound (Car attacking another car) */}
            <TouchableOpacity
              style={[styles.primaryTestCard, { borderColor: colors.danger }]}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Car Crash / Collision', 'blast.mp3', playCollisionSound)}>
              <View style={styles.testCardLeft}>
                <Text style={styles.primaryTestIcon}>💥</Text>
                <View>
                  <Text style={[styles.primaryTestTitle, { color: colors.danger }]}>Car Collision / Crash</Text>
                  <Text style={styles.primaryTestFile}>Car hitting car • File: blast.mp3</Text>
                </View>
              </View>
              <View style={[styles.testPlayBadge, { backgroundColor: 'rgba(255, 23, 68, 0.2)' }]}>
                <Text style={[styles.testPlayBadgeText, { color: colors.danger }]}>TEST 🔊</Text>
              </View>
            </TouchableOpacity>

            {/* 3. Car Dash & Health Case Collecting Sound */}
            <TouchableOpacity
              style={[styles.primaryTestCard, { borderColor: '#00E676' }]}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Car Dash Boost', 'car_dash.mp3', playDash)}>
              <View style={styles.testCardLeft}>
                <Text style={styles.primaryTestIcon}>⚡</Text>
                <View>
                  <Text style={[styles.primaryTestTitle, { color: '#00E676' }]}>Car Dash & Boost</Text>
                  <Text style={styles.primaryTestFile}>Speed surge & Repair • File: car_dash.mp3</Text>
                </View>
              </View>
              <View style={[styles.testPlayBadge, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}>
                <Text style={[styles.testPlayBadgeText, { color: '#00E676' }]}>TEST 🔊</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Secondary Sound Effects Grid */}
          <Text style={[styles.testCategoryHeader, { marginTop: 12 }]}>ADDITIONAL SOUND EFFECTS</Text>
          <View style={styles.previewGrid}>
            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Engine Start', 'engine_start.mp3', playStartSound)}>
              <Text style={styles.previewChipIcon}>🏎️</Text>
              <Text style={styles.previewChipText}>Engine Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Car Horn', 'car_horn.mp3', playHornSound)}>
              <Text style={styles.previewChipIcon}>📯</Text>
              <Text style={styles.previewChipText}>Car Horn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Car Honk', 'car_honk.mp3', playHonkSound)}>
              <Text style={styles.previewChipIcon}>🎺</Text>
              <Text style={styles.previewChipText}>Car Honk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Brake Skid', 'car_break.mp3', playBrake)}>
              <Text style={styles.previewChipIcon}>🛑</Text>
              <Text style={styles.previewChipText}>Brake Skid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Break Effect', 'break_effect.mp3', playBrakeSound)}>
              <Text style={styles.previewChipIcon}>🔊</Text>
              <Text style={styles.previewChipText}>Break Effect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Health Pack', 'car_dash.mp3', playHealthSound)}>
              <Text style={styles.previewChipIcon}>❤️</Text>
              <Text style={styles.previewChipText}>Health Pack</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('Coin Voice', 'coin_collecting.mp3', playCoinVoice)}>
              <Text style={styles.previewChipIcon}>🗣️</Text>
              <Text style={styles.previewChipText}>Coin Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewChip}
              activeOpacity={0.7}
              onPress={() => handleTestSound('3,2,1 GO!', 'countdown_3_2_1_go.mp3', playCountdownSound)}>
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

      {/* In-Game Custom Modal Popup */}
      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, visible: false }))}
      />
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
    marginBottom: 12,
  },
  activeTestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  activeTestIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  activeTestText: {
    color: '#00E5FF',
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: 1,
  },
  testCategoryHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  primaryTestColumn: {
    marginBottom: 8,
  },
  primaryTestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(22, 27, 34, 0.9)',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  testCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  primaryTestIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  primaryTestTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  primaryTestFile: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  testPlayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testPlayBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
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

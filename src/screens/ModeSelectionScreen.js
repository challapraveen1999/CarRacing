import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { GAME_MODES } from '../helpers/gameConstants';
import { playEffect } from '../helpers/SoundManager';

const ModeSelectionScreen = ({ navigation }) => {
  const modesList = Object.values(GAME_MODES);

  const handleSelectMode = (modeId) => {
    playEffect('button');
    navigation.navigate('Game', { mode: modeId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            playEffect('button');
            navigation.goBack();
          }}>
          <Text style={styles.backButtonText}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RACE MODES</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenSubtitle}>
          CHOOSE YOUR CHALLENGE
        </Text>

        {modesList.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            activeOpacity={0.8}
            onPress={() => handleSelectMode(mode.id)}>
            <View style={styles.modeCardHeader}>
              <View style={styles.iconCircle}>
                <Text style={styles.modeIcon}>{mode.icon}</Text>
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeDescription}>{mode.subtitle}</Text>
              </View>
            </View>

            <View style={styles.modeCardFooter}>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>DIFFICULTY: {mode.difficulty.toUpperCase()}</Text>
              </View>
              <Text style={styles.startArrow}>START RACE ›</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.backgroundSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modeIcon: {
    fontSize: 26,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  modeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  difficultyBadge: {
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryNeon,
    letterSpacing: 1,
  },
  startArrow: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
});

export default ModeSelectionScreen;


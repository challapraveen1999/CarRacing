import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { playEffect } from '../helpers/SoundManager';

const GameOverScreen = ({ navigation, route }) => {
  const {
    score = 0,
    distance = 0,
    coinsCollected = 0,
    isNewHighScore = false,
    mode = 'endless',
  } = route.params || {};

  useEffect(() => {
    if (isNewHighScore) {
      playEffect('unlock');
    }
  }, [isNewHighScore]);

  const handlePlayAgain = () => {
    playEffect('button');
    navigation.replace('Game', { mode });
  };

  const handleDetailedResults = () => {
    playEffect('button');
    navigation.navigate('Results', {
      score,
      distance,
      coinsCollected,
      isNewHighScore,
      mode,
    });
  };

  const handleHome = () => {
    playEffect('button');
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.card}>
        <Text style={styles.crashEmoji}>💥</Text>
        <Text style={styles.titleGameOver}>CRASHED!</Text>

        {isNewHighScore && (
          <View style={styles.highScoreBadge}>
            <Text style={styles.highScoreText}>🏆 NEW HIGH SCORE!</Text>
          </View>
        )}

        {/* Stats Summary Table */}
        <View style={styles.statsTable}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>FINAL SCORE</Text>
            <Text style={styles.statValue}>{score.toLocaleString()}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{distance.toLocaleString()} m</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>COINS COLLECTED</Text>
            <Text style={[styles.statValue, styles.accentStatValue]}>
              🪙 +{coinsCollected}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.8}
          onPress={handlePlayAgain}>
          <Text style={styles.retryButtonText}>⚡ RACE AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.8}
          onPress={handleDetailedResults}>
          <Text style={styles.secondaryButtonText}>📊 RACE BREAKDOWN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.8}
          onPress={handleHome}>
          <Text style={styles.homeButtonText}>‹ BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
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
  card: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  crashEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  titleGameOver: {
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.danger,
    letterSpacing: 2,
    marginBottom: 10,
  },
  highScoreBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  highScoreText: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  statsTable: {
    width: '100%',
    backgroundColor: colors.backgroundSurface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  accentStatValue: {
    color: colors.accent,
  },
  retryButton: {
    width: '100%',
    backgroundColor: colors.primaryNeon,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: colors.backgroundSurface,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  homeButton: {
    paddingVertical: 10,
  },
  homeButtonText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
});

export default GameOverScreen;


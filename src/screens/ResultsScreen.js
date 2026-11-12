import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { playEffect } from '../helpers/SoundManager';

const ResultsScreen = ({ navigation, route }) => {
  const {
    score = 0,
    distance = 0,
    coinsCollected = 0,
    mode = 'endless',
  } = route.params || {};

  useEffect(() => {
    playEffect('race_complete');
  }, []);

  const basePoints = Math.floor(distance * 1.5);
  const coinBonus = coinsCollected * 20;

  const handleDone = () => {
    playEffect('button');
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RACE REPORT</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryTitle}>TOTAL SCORE</Text>
          <Text style={styles.summaryScore}>{score.toLocaleString()}</Text>
          <Text style={styles.modeTag}>MODE: {mode.toUpperCase()}</Text>
        </View>

        {/* Detailed Metrics */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardSectionTitle}>PERFORMANCE BREAKDOWN</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Distance Traveled</Text>
            <Text style={styles.metricValue}>{distance.toLocaleString()} m</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Distance Score</Text>
            <Text style={styles.metricValue}>+{basePoints.toLocaleString()} pts</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Coins Picked Up</Text>
            <Text style={[styles.metricValue, styles.accentMetricValue]}>
              +{coinsCollected} (🪙 {coinBonus} pts)
            </Text>
          </View>

          <View style={[styles.metricRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Reward Coins Credited</Text>
            <Text style={styles.totalCoinsText}>🪙 +{coinsCollected}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.doneButton}
          activeOpacity={0.8}
          onPress={handleDone}>
          <Text style={styles.doneButtonText}>CONTINUE TO HOME</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  summaryBadge: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  summaryScore: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.primaryNeon,
    marginVertical: 6,
  },
  modeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1.5,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  accentMetricValue: {
    color: colors.accent,
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
  },
  totalLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  totalCoinsText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primaryNeon,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
});

export default ResultsScreen;


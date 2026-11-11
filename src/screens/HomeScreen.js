import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../helpers/colorCodes.json';
import { loadAllGameData } from '../helpers/storage';
import { getCarById } from '../helpers/carsData';
import { playEffect, playMusic, pauseMusic } from '../helpers/SoundManager';
import CarSprite from '../components/CarSprite';

const HomeScreen = ({ navigation }) => {
  const [gameData, setGameData] = useState({
    bestScore: 0,
    bestDistance: 0,
    totalCoins: 0,
    selectedCar: 'car_01',
    unlockedCars: ['car_01'],
  });

  const pulsePlayAnim = useRef(new Animated.Value(1)).current;

  // Refresh saved stats every time Home screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadAllGameData().then(data => {
        if (isMounted) {
          setGameData(data);
        }
      });
      playMusic();
      return () => {
        isMounted = false;
        pauseMusic();
      };
    }, []),
  );

  // Pulse animation for the main PLAY button
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsePlayAnim, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulsePlayAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulsePlayAnim]);

  const activeCar = getCarById(gameData.selectedCar);

  const handleNav = (screenName, params) => {
    playEffect('button');
    navigation.navigate(screenName, params);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header: Coins & Settings */}
      <View style={styles.header}>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{gameData.totalCoins.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => handleNav('Settings')}
          activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Logo Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.titleTurbo}>TURBO <Text style={styles.titleRush}>RUSH</Text></Text>
          <Text style={styles.subtitle}>HIGHWAY SPEED DEMON</Text>
        </View>

        {/* Selected Car Showcase Card */}
        <TouchableOpacity
          style={styles.carShowcaseCard}
          activeOpacity={0.85}
          onPress={() => handleNav('Garage')}>
          <View style={styles.carShowcaseHeader}>
            <View>
              <Text style={styles.carCategoryText}>CURRENT VEHICLE</Text>
              <Text style={styles.carNameText}>{activeCar.name}</Text>
            </View>
            <View style={styles.garagePill}>
              <Text style={styles.garagePillText}>GARAGE ›</Text>
            </View>
          </View>

          {/* Stylized Car Graphic Preview */}
          <View style={styles.carGraphicWrapper}>
            <CarSprite
              width={76}
              height={140}
              bodyColor={activeCar.colors.body}
              stripeColor={activeCar.colors.stripes}
              roofColor={activeCar.colors.roof}
            />
          </View>

          {/* Quick Stat Bars */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SPEED</Text>
              <View style={styles.statBarBg}>
                <View
                  style={[
                    styles.statBarFill,
                    {
                      width: `${activeCar.stats.speed}%`,
                      backgroundColor: colors.primaryNeon,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>HANDLING</Text>
              <View style={styles.statBarBg}>
                <View
                  style={[
                    styles.statBarFill,
                    {
                      width: `${activeCar.stats.handling}%`,
                      backgroundColor: colors.secondary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Player Records Grid */}
        <View style={styles.recordsGrid}>
          <View style={styles.recordCard}>
            <Text style={styles.recordLabel}>BEST SCORE</Text>
            <Text style={styles.recordValue}>
              {gameData.bestScore.toLocaleString()}
            </Text>
            <Text style={styles.recordSubtext}>PTS</Text>
          </View>

          <View style={styles.recordCard}>
            <Text style={styles.recordLabel}>LONGEST RUN</Text>
            <Text style={styles.recordValue}>
              {gameData.bestDistance.toLocaleString()}
            </Text>
            <Text style={styles.recordSubtext}>METERS</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Main Play Now Button */}
          <Animated.View style={{ transform: [{ scale: pulsePlayAnim }] }}>
            <TouchableOpacity
              style={styles.playButton}
              activeOpacity={0.85}
              onPress={() => handleNav('Game', { mode: 'endless' })}>
              <Text style={styles.playButtonText}>⚡ RACE NOW</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Game Modes & Garage buttons */}
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.modeButton}
              activeOpacity={0.8}
              onPress={() => handleNav('Modes')}>
              <Text style={styles.secondaryButtonIcon}>🏁</Text>
              <Text style={styles.secondaryButtonText}>MODES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.garageButton}
              activeOpacity={0.8}
              onPress={() => handleNav('Garage')}>
              <Text style={styles.secondaryButtonIcon}>🏎️</Text>
              <Text style={styles.secondaryButtonText}>GARAGE</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coinIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  coinText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 15,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsIcon: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  bannerContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },
  titleTurbo: {
    fontSize: 38,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  titleRush: {
    color: colors.primaryNeon,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 4,
    marginTop: 4,
  },
  carShowcaseCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  carShowcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  carNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  garagePill: {
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  garagePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  carGraphicWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  carBodyOutline: {
    width: 90,
    height: 120,
    borderRadius: 18,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  carBigEmoji: {
    fontSize: 48,
  },
  carStripeDetail: {
    position: 'absolute',
    bottom: 8,
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statItem: {
    flex: 0.48,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 5,
    letterSpacing: 1,
  },
  statBarBg: {
    height: 6,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recordsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  recordCard: {
    flex: 0.48,
    backgroundColor: colors.backgroundCard,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  recordValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  recordSubtext: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  actionsContainer: {
    marginTop: 4,
  },
  playButton: {
    backgroundColor: colors.primaryNeon,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 14,
  },
  playButtonText: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  garageButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});

export default HomeScreen;


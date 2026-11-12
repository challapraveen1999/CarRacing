import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { playEffect } from '../helpers/SoundManager';
import CarSprite from '../components/CarSprite';

const hexToRgba = (hex, opacity) => {
  if (!hex || typeof hex !== 'string') return `rgba(0, 229, 255, ${opacity})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 229;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const HomeScreen = ({ navigation }) => {
  const [gameData, setGameData] = useState({
    bestScore: 0,
    bestDistance: 0,
    totalCoins: 0,
    selectedCar: 'car_01',
    unlockedCars: ['car_01'],
  });

  const pulsePlayAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  // Refresh saved stats every time Home screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadAllGameData().then(data => {
        if (isMounted) {
          setGameData(data);
        }
      });
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // Pulse animation for the main PLAY button & radiant neon underglow
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsePlayAnim, {
          toValue: 1.03,
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

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.14,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.94,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    glow.start();
    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [pulsePlayAnim, glowAnim]);

  const activeCar = getCarById(gameData.selectedCar);

  // Derive dynamic theme color matching the selected car (Cyan/Blue for Viper, Red for Apex, Yellow for Thunder)
  const carThemeColor =
    activeCar?.colors?.body &&
    activeCar.colors.body !== '#FFFFFF' &&
    activeCar.colors.body !== '#1C1E24'
      ? activeCar.colors.body
      : activeCar?.colors?.stripes && activeCar.colors.stripes !== '#FFFFFF'
      ? activeCar.colors.stripes
      : colors.primaryNeon;

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
          <Text style={styles.coinText}>{Number(gameData.totalCoins || 0).toLocaleString()}</Text>
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
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Logo Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.titleTurbo}>TURBO <Text style={[styles.titleRush, { color: carThemeColor }]}>RUSH</Text></Text>
          <Text style={styles.subtitle}>HIGHWAY SPEED DEMON</Text>
        </View>

        {/* HERO CAR: Centered with dynamic neon underglow matching active vehicle color */}
        <TouchableOpacity
          style={styles.heroCarContainer}
          activeOpacity={0.88}
          onPress={() => handleNav('Garage')}>
          {/* Active Car Name Badge */}
          <View style={[styles.activeVehicleBadge, { borderColor: carThemeColor }]}>
            <Text style={styles.activeVehicleBadgeIcon}>{activeCar?.icon || '🏎️'}</Text>
            <Text style={[styles.activeVehicleBadgeText, { color: carThemeColor }]}>
              {activeCar?.name?.toUpperCase() || 'APEX TURBO'}
            </Text>
          </View>

          {/* Subtle Road Stripes behind Car */}
          <View style={styles.subtleRoadTrack} pointerEvents="none">
            <View style={styles.subtleRoadStripe} />
            <View style={styles.subtleRoadStripe} />
            <View style={styles.subtleRoadStripe} />
            <View style={styles.subtleRoadStripe} />
          </View>

          {/* Dynamic Multi-Tier Neon Elevation & Underglow matching active vehicle color */}
          <Animated.View
            style={[
              styles.neonAuraContainer,
              { transform: [{ scale: glowAnim }] },
            ]}
            pointerEvents="none">
            {/* Tier 1: Wide diffused outer halo */}
            <View
              style={[
                styles.auraOuter,
                { backgroundColor: hexToRgba(carThemeColor, 0.08) },
              ]}
            />
            {/* Tier 2: Radiant mid diffusion aura */}
            <View
              style={[
                styles.auraMid,
                { backgroundColor: hexToRgba(carThemeColor, 0.18) },
              ]}
            />
            {/* Tier 3: Intense core underglow */}
            <View
              style={[
                styles.auraCore,
                {
                  backgroundColor: hexToRgba(carThemeColor, 0.32),
                  shadowColor: carThemeColor,
                },
              ]}
            />
            {/* Tier 4: Ground tire reflection bar directly under vehicle wheels */}
            <View
              style={[
                styles.auraGroundReflection,
                { backgroundColor: hexToRgba(carThemeColor, 0.55) },
              ]}
            />
          </Animated.View>

          {/* Supercar Hero Sprite */}
          <CarSprite
            width={92}
            height={170}
            image={activeCar?.image}
            bodyColor={activeCar?.colors?.body}
            stripeColor={activeCar?.colors?.stripes}
            roofColor={activeCar?.colors?.roof}
            vehicleType="sports"
          />
        </TouchableOpacity>

        {/* Career Records Strip (Best Score & Longest Run) */}
        <View style={styles.careerRecordsStrip}>
          <View style={styles.careerRecordBox}>
            <Text style={styles.careerRecordLabel}>BEST SCORE</Text>
            <Text style={styles.careerRecordValue}>
              {Number(gameData.bestScore || 0).toLocaleString()} <Text style={styles.careerRecordUnit}>PTS</Text>
            </Text>
          </View>
          <View style={styles.careerRecordDivider} />
          <View style={styles.careerRecordBox}>
            <Text style={styles.careerRecordLabel}>LONGEST RUN</Text>
            <Text style={styles.careerRecordValue}>
              {Number(gameData.bestDistance || 0).toLocaleString()} <Text style={styles.careerRecordUnit}>M</Text>
            </Text>
          </View>
        </View>

        {/* Action Buttons: ⚡ RACE NOW, MODES & GARAGE */}
        <View style={styles.actionsContainer}>
          {/* Main Play Now Button */}
          <Animated.View style={{ transform: [{ scale: pulsePlayAnim }] }}>
            <TouchableOpacity
              style={[
                styles.playButton,
                {
                  backgroundColor: carThemeColor,
                  shadowColor: carThemeColor,
                },
              ]}
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
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 27, 34, 0.85)',
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
    backgroundColor: 'rgba(22, 27, 34, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsIcon: {
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 32,
  },
  bannerContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  titleTurbo: {
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  titleRush: {
    color: colors.primaryNeon,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 3.5,
    marginTop: 3,
  },
  heroCarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 260,
    marginVertical: 18,
  },
  activeVehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 27, 34, 0.9)',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  activeVehicleBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  activeVehicleBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtleRoadTrack: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    width: 6,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    opacity: 0.22,
  },
  subtleRoadStripe: {
    width: 4,
    height: 32,
    backgroundColor: '#FFE600',
    borderRadius: 2,
  },
  neonAuraContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 290,
  },
  auraOuter: {
    position: 'absolute',
    width: 220,
    height: 270,
    borderRadius: 110,
  },
  auraMid: {
    position: 'absolute',
    width: 170,
    height: 220,
    borderRadius: 85,
  },
  auraCore: {
    position: 'absolute',
    width: 120,
    height: 165,
    borderRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
  },
  auraGroundReflection: {
    position: 'absolute',
    bottom: 24,
    width: 86,
    height: 12,
    borderRadius: 6,
  },
  careerRecordsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(22, 27, 34, 0.85)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(48, 54, 61, 0.7)',
    marginBottom: 14,
  },
  careerRecordBox: {
    alignItems: 'center',
    flex: 1,
  },
  careerRecordLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  careerRecordValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  careerRecordUnit: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  careerRecordDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(48, 54, 61, 0.8)',
    marginHorizontal: 8,
  },
  actionsContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  playButton: {
    backgroundColor: colors.primaryNeon,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 12,
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
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
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
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
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

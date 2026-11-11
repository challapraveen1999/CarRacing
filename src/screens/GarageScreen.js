import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { CARS } from '../helpers/carsData';
import { getItem, setSelectedCar as saveSelectedCar, unlockCar as purchaseCar } from '../helpers/storage';
import { STORAGE_KEYS } from '../helpers/gameConstants';
import { playEffect } from '../helpers/SoundManager';
import CarSprite from '../components/CarSprite';

const GarageScreen = ({ navigation }) => {
  const [totalCoins, setTotalCoins] = useState(0);
  const [unlockedCars, setUnlockedCars] = useState(['car_01']);
  const [selectedCarId, setSelectedCarId] = useState('car_01');
  const [activeCarIndex, setActiveCarIndex] = useState(0);

  useEffect(() => {
    loadGarageData();
  }, []);

  const loadGarageData = async () => {
    const coins = await getItem(STORAGE_KEYS.TOTAL_COINS, 0);
    const unlocked = await getItem(STORAGE_KEYS.UNLOCKED_CARS, ['car_01']);
    const selected = await getItem(STORAGE_KEYS.SELECTED_CAR, 'car_01');

    setTotalCoins(coins);
    setUnlockedCars(unlocked);
    setSelectedCarId(selected);

    const initialIdx = CARS.findIndex(c => c.id === selected);
    if (initialIdx >= 0) {
      setActiveCarIndex(initialIdx);
    }
  };

  const currentCar = CARS[activeCarIndex] || CARS[0];
  const isCarUnlocked = unlockedCars.includes(currentCar.id);
  const isCarSelected = selectedCarId === currentCar.id;

  const handleSelectCar = async () => {
    playEffect('button');
    setSelectedCarId(currentCar.id);
    await saveSelectedCar(currentCar.id);
  };

  const handleBuyCar = async () => {
    if (totalCoins < currentCar.price) {
      playEffect('button');
      Alert.alert('Need More Coins', `You need ${currentCar.price - totalCoins} more coins to unlock ${currentCar.name}.`);
      return;
    }

    const result = await purchaseCar(currentCar.id, currentCar.price);
    if (result.success) {
      playEffect('unlock');
      setUnlockedCars(result.unlockedCars);
      setTotalCoins(result.totalCoins);
      setSelectedCarId(currentCar.id);
      Alert.alert('Car Unlocked!', `You have unlocked ${currentCar.name}! It is now your selected vehicle.`);
    }
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
        <Text style={styles.headerTitle}>GARAGE</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{totalCoins.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Car Navigation Selector */}
        <View style={styles.carouselBar}>
          <TouchableOpacity
            style={styles.navArrowButton}
            disabled={activeCarIndex === 0}
            onPress={() => {
              playEffect('button');
              setActiveCarIndex(prev => Math.max(0, prev - 1));
            }}>
            <Text style={[styles.navArrowText, activeCarIndex === 0 && styles.disabledText]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.carouselCenter}>
            <Text style={styles.carName}>{currentCar.name}</Text>
            <Text style={styles.carTagline}>{currentCar.tagline}</Text>
          </View>

          <TouchableOpacity
            style={styles.navArrowButton}
            disabled={activeCarIndex === CARS.length - 1}
            onPress={() => {
              playEffect('button');
              setActiveCarIndex(prev => Math.min(CARS.length - 1, prev + 1));
            }}>
            <Text style={[styles.navArrowText, activeCarIndex === CARS.length - 1 && styles.disabledText]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Visual Car Stage */}
        <View style={styles.carStageContainer}>
          <View
            style={[
              styles.carPodium,
              {
                borderColor: currentCar.colors.body,
                shadowColor: currentCar.colors.body,
              },
            ]}>
            <CarSprite
              width={78}
              height={144}
              bodyColor={currentCar.colors.body}
              stripeColor={currentCar.colors.stripes}
              roofColor={currentCar.colors.roof}
            />
            {!isCarUnlocked && (
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockPriceText}>🪙 {currentCar.price}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Vehicle Performance Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsHeaderTitle}>PERFORMANCE SPECS</Text>

          {/* Speed */}
          <View style={styles.statRow}>
            <Text style={styles.statName}>TOP SPEED</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${currentCar.stats.speed}%`, backgroundColor: colors.primaryNeon }]} />
            </View>
            <Text style={styles.statNum}>{currentCar.stats.speed}</Text>
          </View>

          {/* Acceleration */}
          <View style={styles.statRow}>
            <Text style={styles.statName}>ACCELERATION</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${currentCar.stats.acceleration}%`, backgroundColor: colors.accentOrange }]} />
            </View>
            <Text style={styles.statNum}>{currentCar.stats.acceleration}</Text>
          </View>

          {/* Handling */}
          <View style={styles.statRow}>
            <Text style={styles.statName}>HANDLING</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${currentCar.stats.handling}%`, backgroundColor: colors.secondary }]} />
            </View>
            <Text style={styles.statNum}>{currentCar.stats.handling}</Text>
          </View>

          {/* Nitro */}
          <View style={styles.statRow}>
            <Text style={styles.statName}>NITRO BOOST</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${currentCar.stats.nitro}%`, backgroundColor: colors.nitro }]} />
            </View>
            <Text style={styles.statNum}>{currentCar.stats.nitro}</Text>
          </View>
        </View>

        {/* Action Button: Select, Selected, or Unlock */}
        <View style={styles.actionSection}>
          {isCarSelected ? (
            <View style={[styles.actionButton, styles.selectedBadge]}>
              <Text style={styles.selectedBadgeText}>✓ CURRENTLY SELECTED</Text>
            </View>
          ) : isCarUnlocked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.selectButton]}
              activeOpacity={0.8}
              onPress={handleSelectCar}>
              <Text style={styles.actionButtonText}>SELECT VEHICLE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.unlockButton]}
              activeOpacity={0.8}
              onPress={handleBuyCar}>
              <Text style={styles.actionButtonText}>
                UNLOCK FOR 🪙 {currentCar.price.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
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
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  coinText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  carouselBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 14,
  },
  navArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navArrowText: {
    color: colors.secondary,
    fontSize: 26,
    fontWeight: '900',
  },
  disabledText: {
    color: colors.textMuted,
  },
  carouselCenter: {
    alignItems: 'center',
  },
  carName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  carTagline: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  carStageContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  carPodium: {
    width: 140,
    height: 180,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  carDisplayEmoji: {
    fontSize: 72,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  lockPriceText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  statsCard: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  statsHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statName: {
    width: 90,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statNum: {
    width: 28,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  actionSection: {
    width: '100%',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    backgroundColor: colors.secondary,
  },
  unlockButton: {
    backgroundColor: colors.accentOrange,
  },
  selectedBadge: {
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.success,
  },
  selectedBadgeText: {
    color: colors.success,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.5,
  },
});

export default GarageScreen;


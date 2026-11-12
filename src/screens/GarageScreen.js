import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../helpers/colorCodes.json';
import { CARS } from '../helpers/carsData';
import {
  loadAllGameData,
  setSelectedCar as saveSelectedCar,
  unlockCar as purchaseCar,
} from '../helpers/storage';
import { STORAGE_KEYS } from '../helpers/gameConstants';
import { playEffect } from '../helpers/SoundManager';
import CarSprite from '../components/CarSprite';
import CustomModal from '../components/CustomModal';

const GarageScreen = ({ navigation }) => {
  const [totalCoins, setTotalCoins] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [longestRun, setLongestRun] = useState(0);
  const [unlockedCars, setUnlockedCars] = useState(['car_01']);
  const [selectedCarId, setSelectedCarId] = useState('car_01');
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: '🏎️',
    type: 'default',
    confirmText: 'OK',
  });

  const loadGarageData = async () => {
    try {
      const data = await loadAllGameData();
      const coins = Number(data[STORAGE_KEYS.TOTAL_COINS] ?? 0);
      const unlocked = data[STORAGE_KEYS.UNLOCKED_CARS] || ['car_01'];
      const selected = data[STORAGE_KEYS.SELECTED_CAR] || 'car_01';
      const bScore = Number(data[STORAGE_KEYS.BEST_SCORE] ?? 0);
      const bDist = Number(data[STORAGE_KEYS.BEST_DISTANCE] ?? 0);

      setTotalCoins(coins);
      setUnlockedCars(unlocked);
      setSelectedCarId(selected);
      setBestScore(bScore);
      setLongestRun(bDist);

      const initialIdx = CARS.findIndex(c => c.id === selected);
      if (initialIdx >= 0) {
        setActiveCarIndex(initialIdx);
      }
    } catch (e) {
      console.warn('Error loading garage data:', e);
    }
  };

  // Reload latest coins, career records and selected car every time Garage is viewed
  useFocusEffect(
    useCallback(() => {
      loadGarageData();
    }, []),
  );

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
      setModalConfig({
        visible: true,
        title: 'NEED MORE COINS',
        message: `You need ${(currentCar.price - totalCoins).toLocaleString()} more coins to unlock ${currentCar.name}. Keep racing to collect coins!`,
        icon: '🪙',
        type: 'warning',
        confirmText: 'GOT IT',
      });
      return;
    }

    const result = await purchaseCar(currentCar.id, currentCar.price);
    if (result.success) {
      playEffect('unlock');
      setUnlockedCars(result.unlockedCars);
      setTotalCoins(result.totalCoins);
      setSelectedCarId(currentCar.id);
      await saveSelectedCar(currentCar.id);
      setModalConfig({
        visible: true,
        title: 'CAR UNLOCKED!',
        message: `You unlocked ${currentCar.name}! It is now your active vehicle and ready to race.`,
        icon: '⚡',
        type: 'success',
        confirmText: "LET'S RACE!",
      });
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
          <Text style={styles.coinText}>{(totalCoins || 0).toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Career Records & Coin Balance Strip */}
        <View style={styles.walletBar}>
          <View style={styles.walletItemMain}>
            <Text style={styles.walletLabel}>COIN BALANCE</Text>
            <View style={styles.walletRow}>
              <Text style={styles.walletCoinEmoji}>🪙</Text>
              <Text style={styles.walletCoinNumber}>{(totalCoins || 0).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.walletDivider} />

          <View style={styles.walletItem}>
            <Text style={styles.walletLabel}>BEST SCORE</Text>
            <Text style={styles.walletStatNumber}>{(bestScore || 0).toLocaleString()}</Text>
            <Text style={styles.walletStatUnit}>PTS</Text>
          </View>

          <View style={styles.walletDivider} />

          <View style={styles.walletItem}>
            <Text style={styles.walletLabel}>LONGEST RUN</Text>
            <Text style={styles.walletStatNumber}>{(longestRun || 0).toLocaleString()}</Text>
            <Text style={styles.walletStatUnit}>M</Text>
          </View>
        </View>

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
              image={currentCar?.image}
              bodyColor={currentCar.colors.body}
              stripeColor={currentCar.colors.stripes}
              roofColor={currentCar.colors.roof}
            />
            {!isCarUnlocked && (
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockPriceText}>🪙 {currentCar.price.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Affordability notice for locked cars */}
          {!isCarUnlocked && (
            <View style={styles.affordabilityNotice}>
              {totalCoins >= currentCar.price ? (
                <Text style={styles.affordNoticeSuccess}>
                  ✓ You have enough coins to unlock this car!
                </Text>
              ) : (
                <Text style={styles.affordNoticeMissing}>
                  🪙 Need {(currentCar.price - totalCoins).toLocaleString()} more coins
                </Text>
              )}
            </View>
          )}
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
              style={[
                styles.actionButton,
                styles.unlockButton,
                totalCoins < currentCar.price && styles.unlockButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleBuyCar}>
              <Text style={styles.actionButtonText}>
                UNLOCK FOR 🪙 {currentCar.price.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* In-Game Custom Modal */}
      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        onConfirm={() => setModalConfig(prev => ({ ...prev, visible: false }))}
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
  unlockButtonDisabled: {
    opacity: 0.65,
  },
  walletBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  walletItemMain: {
    alignItems: 'center',
    flex: 1.2,
  },
  walletItem: {
    alignItems: 'center',
    flex: 1,
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 3,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletCoinEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  walletCoinNumber: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 16,
  },
  walletDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  walletStatNumber: {
    color: colors.primaryNeon,
    fontWeight: '900',
    fontSize: 14,
  },
  walletStatUnit: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  affordabilityNotice: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.backgroundSurface,
  },
  affordNoticeSuccess: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  affordNoticeMissing: {
    color: colors.accentOrange,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default GarageScreen;


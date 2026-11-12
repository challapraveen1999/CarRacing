import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadAllGameData,
  getItem,
  setItem,
  recordRaceResult,
  unlockCar,
  setSelectedCar,
  resetGameData,
} from '../src/helpers/storage';
import { STORAGE_KEYS } from '../src/helpers/gameConstants';

describe('Turbo Rush Storage Helper', () => {
  beforeEach(async () => {
    await resetGameData();
  });

  test('loadAllGameData returns default values initially', async () => {
    const data = await loadAllGameData();
    expect(data[STORAGE_KEYS.BEST_SCORE]).toBe(0);
    expect(data[STORAGE_KEYS.BEST_DISTANCE]).toBe(0);
    expect(data[STORAGE_KEYS.TOTAL_COINS]).toBe(0);
    expect(data[STORAGE_KEYS.SELECTED_CAR]).toBe('car_01');
    expect(data[STORAGE_KEYS.MUSIC_ENABLED]).toBe(true);
  });

  test('setItem and getItem persist correctly', async () => {
    await setItem(STORAGE_KEYS.BEST_SCORE, 1500);
    const score = await getItem(STORAGE_KEYS.BEST_SCORE, 0);
    expect(score).toBe(1500);
  });

  test('recordRaceResult detects high scores and credits coins', async () => {
    await setItem(STORAGE_KEYS.TOTAL_COINS, 0);

    const result = await recordRaceResult({
      score: 2500,
      distance: 800,
      coinsEarned: 50,
    });

    expect(result.isNewHighScore).toBe(true);
    expect(result.bestScore).toBe(2500);
    expect(result.bestDistance).toBe(800);
    expect(result.totalCoins).toBe(50); // 0 initial + 50 earned
  });

  test('unlockCar succeeds if player has enough coins', async () => {
    // Give player enough coins
    await setItem(STORAGE_KEYS.TOTAL_COINS, 1000);

    const result = await unlockCar('car_02', 500);
    expect(result.success).toBe(true);
    expect(result.unlockedCars).toContain('car_02');
    expect(result.totalCoins).toBe(500);
  });

  test('unlockCar rejects if player lacks coins', async () => {
    await setItem(STORAGE_KEYS.TOTAL_COINS, 50);

    const result = await unlockCar('car_04', 2500);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('NOT_ENOUGH_COINS');
  });

  test('setSelectedCar updates active vehicle', async () => {
    await setSelectedCar('car_02');
    const selected = await getItem(STORAGE_KEYS.SELECTED_CAR);
    expect(selected).toBe('car_02');
  });

  test('recordRaceResult accurately tracks longest run and maintains career high records', async () => {
    await setItem(STORAGE_KEYS.BEST_SCORE, 3000);
    await setItem(STORAGE_KEYS.BEST_DISTANCE, 1200);
    await setItem(STORAGE_KEYS.TOTAL_COINS, 200);

    // Run with shorter distance and score but with coin earnings
    const run1 = await recordRaceResult({
      score: 1500,
      distance: 900,
      coinsEarned: 25,
    });
    expect(run1.isNewHighScore).toBe(false);
    expect(run1.isNewBestDist).toBe(false);
    expect(run1.bestScore).toBe(3000);
    expect(run1.bestDistance).toBe(1200);
    expect(run1.totalCoins).toBe(225);

    // Run that breaks longest run record
    const run2 = await recordRaceResult({
      score: 2800,
      distance: 1850,
      coinsEarned: 40,
    });
    expect(run2.isNewHighScore).toBe(false);
    expect(run2.isNewBestDist).toBe(true);
    expect(run2.bestScore).toBe(3000);
    expect(run2.bestDistance).toBe(1850);
  });

  test('complete cycle: earn coins from race, purchase and unlock new car, persist without backend', async () => {
    // 1. Initial State: 0 coins, only car_01 unlocked
    await AsyncStorage.clear();
    const initialData = await loadAllGameData();
    expect(initialData[STORAGE_KEYS.TOTAL_COINS]).toBe(0);
    expect(initialData[STORAGE_KEYS.UNLOCKED_CARS]).toEqual(['car_01']);
    expect(initialData[STORAGE_KEYS.SELECTED_CAR]).toBe('car_01');

    // 2. Race 1: Collect 6 coins (+600 coins)
    const race1 = await recordRaceResult({
      score: 3500,
      distance: 1200,
      coinsEarned: 600,
    });
    expect(race1.totalCoins).toBe(600);
    expect(race1.bestScore).toBe(3500);
    expect(race1.bestDistance).toBe(1200);

    // 3. Buy & Unlock car_02 (Neon Viper - 500 coins)
    const buyResult = await unlockCar('car_02', 500);
    expect(buyResult.success).toBe(true);
    expect(buyResult.totalCoins).toBe(100); // 600 - 500 = 100 remaining
    expect(buyResult.unlockedCars).toContain('car_02');

    // 4. Verify local persistence: loadAllGameData reflects the purchase and active car
    const persistedData = await loadAllGameData();
    expect(persistedData[STORAGE_KEYS.TOTAL_COINS]).toBe(100);
    expect(persistedData[STORAGE_KEYS.UNLOCKED_CARS]).toEqual(['car_01', 'car_02']);
    expect(persistedData[STORAGE_KEYS.SELECTED_CAR]).toBe('car_02');
    expect(persistedData[STORAGE_KEYS.BEST_SCORE]).toBe(3500);
    expect(persistedData[STORAGE_KEYS.BEST_DISTANCE]).toBe(1200);
  });
});

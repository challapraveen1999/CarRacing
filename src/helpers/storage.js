import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './gameConstants';

const DEFAULTS = {
  [STORAGE_KEYS.BEST_SCORE]: 0,
  [STORAGE_KEYS.BEST_DISTANCE]: 0,
  [STORAGE_KEYS.TOTAL_COINS]: 100, // Starter bonus coins
  [STORAGE_KEYS.UNLOCKED_CARS]: ['car_01'],
  [STORAGE_KEYS.SELECTED_CAR]: 'car_01',
  [STORAGE_KEYS.MUSIC_ENABLED]: true,
  [STORAGE_KEYS.EFFECTS_ENABLED]: true,
  [STORAGE_KEYS.VIBRATION_ENABLED]: true,
  [STORAGE_KEYS.MUSIC_VOLUME]: 0.7,
  [STORAGE_KEYS.EFFECTS_VOLUME]: 0.8,
};

export const loadAllGameData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(keys);
    const data = { ...DEFAULTS };

    pairs.forEach(([key, value]) => {
      if (value !== null) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });

    return data;
  } catch (error) {
    console.warn('Error loading game data from storage:', error);
    return DEFAULTS;
  }
};

export const getItem = async (key, fallback = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return fallback !== null ? fallback : DEFAULTS[key];
    }
    return JSON.parse(value);
  } catch (error) {
    console.warn(`Error getting ${key} from storage:`, error);
    return fallback !== null ? fallback : DEFAULTS[key];
  }
};

export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error saving ${key} to storage:`, error);
    return false;
  }
};

export const recordRaceResult = async ({ score = 0, distance = 0, coinsEarned = 0 }) => {
  try {
    const currentBestScore = await getItem(STORAGE_KEYS.BEST_SCORE, 0);
    const currentBestDist = await getItem(STORAGE_KEYS.BEST_DISTANCE, 0);
    const currentCoins = await getItem(STORAGE_KEYS.TOTAL_COINS, 0);

    const isNewHighScore = score > currentBestScore;
    const isNewBestDist = distance > currentBestDist;

    const newBestScore = Math.max(currentBestScore, score);
    const newBestDist = Math.max(currentBestDist, distance);
    const updatedCoins = currentCoins + coinsEarned;

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.BEST_SCORE, JSON.stringify(newBestScore)],
      [STORAGE_KEYS.BEST_DISTANCE, JSON.stringify(newBestDist)],
      [STORAGE_KEYS.TOTAL_COINS, JSON.stringify(updatedCoins)],
    ]);

    return {
      isNewHighScore,
      isNewBestDist,
      bestScore: newBestScore,
      bestDistance: newBestDist,
      totalCoins: updatedCoins,
    };
  } catch (error) {
    console.warn('Error recording race result:', error);
    return {
      isNewHighScore: false,
      isNewBestDist: false,
      bestScore: score,
      bestDistance: distance,
      totalCoins: coinsEarned,
    };
  }
};

export const unlockCar = async (carId, price = 0) => {
  try {
    const unlocked = await getItem(STORAGE_KEYS.UNLOCKED_CARS, ['car_01']);
    const coins = await getItem(STORAGE_KEYS.TOTAL_COINS, 0);

    if (unlocked.includes(carId)) {
      return { success: true, alreadyUnlocked: true };
    }

    if (coins < price) {
      return { success: false, reason: 'NOT_ENOUGH_COINS' };
    }

    const updatedUnlocked = [...unlocked, carId];
    const updatedCoins = coins - price;

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.UNLOCKED_CARS, JSON.stringify(updatedUnlocked)],
      [STORAGE_KEYS.TOTAL_COINS, JSON.stringify(updatedCoins)],
    ]);

    return {
      success: true,
      unlockedCars: updatedUnlocked,
      totalCoins: updatedCoins,
    };
  } catch (error) {
    console.warn('Error unlocking car:', error);
    return { success: false, reason: 'STORAGE_ERROR' };
  }
};

export const setSelectedCar = async carId => {
  return setItem(STORAGE_KEYS.SELECTED_CAR, carId);
};

export const resetGameData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    return DEFAULTS;
  } catch (error) {
    console.warn('Error resetting game data:', error);
    return null;
  }
};

export default {
  loadAllGameData,
  getItem,
  setItem,
  recordRaceResult,
  unlockCar,
  setSelectedCar,
  resetGameData,
};


import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './gameConstants';

const DEFAULTS = {
  [STORAGE_KEYS.BEST_SCORE]: 0,
  [STORAGE_KEYS.BEST_DISTANCE]: 0,
  [STORAGE_KEYS.TOTAL_COINS]: 0, // Starts at 0, strictly accumulates earned coins
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
    const data = { ...DEFAULTS };

    // Support AsyncStorage v3 (getMany), v1/v2 (multiGet), and universal getItem fallback
    if (typeof AsyncStorage.getMany === 'function') {
      const records = await AsyncStorage.getMany(keys);
      if (records) {
        Object.entries(records).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        });
      }
    } else if (typeof AsyncStorage.multiGet === 'function') {
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });
    } else {
      for (const key of keys) {
        const val = await AsyncStorage.getItem(key);
        if (val !== null && val !== undefined) {
          try {
            data[key] = JSON.parse(val);
          } catch {
            data[key] = val;
          }
        }
      }
    }

    // Ensure numeric types for numerical records
    data[STORAGE_KEYS.BEST_SCORE] = Number(data[STORAGE_KEYS.BEST_SCORE] || 0);
    data[STORAGE_KEYS.BEST_DISTANCE] = Number(data[STORAGE_KEYS.BEST_DISTANCE] || 0);
    data[STORAGE_KEYS.TOTAL_COINS] = Number(data[STORAGE_KEYS.TOTAL_COINS] || 0);

    return data;
  } catch (error) {
    console.warn('Error loading game data from storage:', error);
    return DEFAULTS;
  }
};

export const getItem = async (key, fallback = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null || value === undefined) {
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
    const numScore = Math.max(0, Math.floor(Number(score || 0)));
    const numDist = Math.max(0, Math.floor(Number(distance || 0)));
    const numCoins = Math.max(0, Math.floor(Number(coinsEarned || 0)));

    const currentBestScore = Number(await getItem(STORAGE_KEYS.BEST_SCORE, 0)) || 0;
    const currentBestDist = Number(await getItem(STORAGE_KEYS.BEST_DISTANCE, 0)) || 0;
    const rawCoins = await getItem(STORAGE_KEYS.TOTAL_COINS);
    const currentCoins = rawCoins !== null && rawCoins !== undefined
      ? Number(rawCoins)
      : (DEFAULTS[STORAGE_KEYS.TOTAL_COINS] || 0);

    const isNewHighScore = numScore > currentBestScore;
    const isNewBestDist = numDist > currentBestDist;

    const newBestScore = Math.max(currentBestScore, numScore);
    const newBestDist = Math.max(currentBestDist, numDist);
    const updatedCoins = currentCoins + numCoins;

    // Use guaranteed individual setItem calls & batch methods for 100% compatibility across all versions
    await Promise.all([
      setItem(STORAGE_KEYS.BEST_SCORE, newBestScore),
      setItem(STORAGE_KEYS.BEST_DISTANCE, newBestDist),
      setItem(STORAGE_KEYS.TOTAL_COINS, updatedCoins),
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
      bestScore: Number(score || 0),
      bestDistance: Number(distance || 0),
      totalCoins: Number(coinsEarned || 0),
    };
  }
};

export const getBestRecords = async () => {
  try {
    const data = await loadAllGameData();
    return {
      bestScore: Number(data[STORAGE_KEYS.BEST_SCORE] || 0),
      bestDistance: Number(data[STORAGE_KEYS.BEST_DISTANCE] || 0),
      totalCoins: Number(data[STORAGE_KEYS.TOTAL_COINS] || 0),
    };
  } catch {
    return { bestScore: 0, bestDistance: 0, totalCoins: 0 };
  }
};

export const unlockCar = async (carId, price = 0) => {
  try {
    const unlocked = await getItem(STORAGE_KEYS.UNLOCKED_CARS, ['car_01']);
    const coins = await getItem(STORAGE_KEYS.TOTAL_COINS, 0);

    if (unlocked.includes(carId)) {
      await setSelectedCar(carId);
      return { success: true, alreadyUnlocked: true, unlockedCars: unlocked, totalCoins: coins };
    }

    if (coins < price) {
      return { success: false, reason: 'NOT_ENOUGH_COINS' };
    }

    const updatedUnlocked = [...unlocked, carId];
    const updatedCoins = Math.max(0, coins - price);

    await Promise.all([
      setItem(STORAGE_KEYS.UNLOCKED_CARS, updatedUnlocked),
      setItem(STORAGE_KEYS.TOTAL_COINS, updatedCoins),
      setItem(STORAGE_KEYS.SELECTED_CAR, carId),
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

export const addCoins = async (amount = 0) => {
  try {
    const currentCoins = await getItem(STORAGE_KEYS.TOTAL_COINS, 0);
    const updatedCoins = Math.max(0, Number(currentCoins || 0) + Number(amount || 0));
    await setItem(STORAGE_KEYS.TOTAL_COINS, updatedCoins);
    return updatedCoins;
  } catch (error) {
    console.warn('Error adding coins to storage:', error);
    return 0;
  }
};

export const setSelectedCar = async carId => {
  return setItem(STORAGE_KEYS.SELECTED_CAR, carId);
};

export const resetGameData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    if (typeof AsyncStorage.removeMany === 'function') {
      await AsyncStorage.removeMany(keys);
    } else if (typeof AsyncStorage.multiRemove === 'function') {
      await AsyncStorage.multiRemove(keys);
    } else {
      await Promise.all(keys.map(k => AsyncStorage.removeItem(k)));
    }
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
  addCoins,
  recordRaceResult,
  unlockCar,
  setSelectedCar,
  resetGameData,
};


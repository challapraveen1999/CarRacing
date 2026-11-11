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
    expect(data[STORAGE_KEYS.TOTAL_COINS]).toBe(100);
    expect(data[STORAGE_KEYS.SELECTED_CAR]).toBe('car_01');
    expect(data[STORAGE_KEYS.MUSIC_ENABLED]).toBe(true);
  });

  test('setItem and getItem persist correctly', async () => {
    await setItem(STORAGE_KEYS.BEST_SCORE, 1500);
    const score = await getItem(STORAGE_KEYS.BEST_SCORE, 0);
    expect(score).toBe(1500);
  });

  test('recordRaceResult detects high scores and credits coins', async () => {
    await setItem(STORAGE_KEYS.TOTAL_COINS, 100);

    const result = await recordRaceResult({
      score: 2500,
      distance: 800,
      coinsEarned: 50,
    });

    expect(result.isNewHighScore).toBe(true);
    expect(result.bestScore).toBe(2500);
    expect(result.bestDistance).toBe(800);
    expect(result.totalCoins).toBe(150); // 100 bonus + 50 earned
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
});

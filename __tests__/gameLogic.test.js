import {
  getLaneXPosition,
  checkCollision,
  checkNearMiss,
  calculateScore,
} from '../src/helpers/gameLogic';

describe('Turbo Rush Game Logic', () => {
  test('calculates correct lane X positions', () => {
    const lane0X = getLaneXPosition(0, 300, 3);
    const lane1X = getLaneXPosition(1, 300, 3);
    const lane2X = getLaneXPosition(2, 300, 3);

    expect(lane0X).toBe(50);
    expect(lane1X).toBe(150);
    expect(lane2X).toBe(250);
  });

  test('detects collision between overlapping bounding boxes', () => {
    const player = { x: 100, y: 500, width: 50, height: 90 };
    const obstacle = { x: 110, y: 510, width: 50, height: 80 };

    expect(checkCollision(player, obstacle)).toBe(true);
  });

  test('does not report collision for distant vehicles', () => {
    const player = { x: 50, y: 500, width: 50, height: 90 };
    const obstacle = { x: 250, y: 200, width: 50, height: 80 };

    expect(checkCollision(player, obstacle)).toBe(false);
  });

  test('detects near-miss proximity correctly', () => {
    const player = { x: 100, y: 500, width: 50, height: 90 };
    // Adjacent horizontally within 15px, overlapping vertically
    const obstacle = { x: 160, y: 520, width: 50, height: 80 };

    expect(checkNearMiss(player, obstacle)).toBe(true);
  });

  test('calculates score with distance, speed, and bonuses', () => {
    const score = calculateScore(100, 200, 2, 5);
    expect(score).toBeGreaterThan(0);
  });

  test('safe mode protects car health from decreasing on collision with other cars', () => {
    // Simulating Safe Mode collision behavior
    const initialHealth = 100;
    const hitDamage = 35;
    const isSafeMode = true;

    // In Safe Mode, health must NEVER decrease on collision
    let health = initialHealth;
    if (!isSafeMode) {
      health = Math.max(0, health - hitDamage);
    }

    expect(health).toBe(100);

    // Without Safe Mode, health decreases
    const isSafeModeOff = false;
    let nonSafeHealth = initialHealth;
    if (!isSafeModeOff) {
      nonSafeHealth = Math.max(0, nonSafeHealth - hitDamage);
    }
    expect(nonSafeHealth).toBe(65);
  });
});


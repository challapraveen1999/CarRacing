import { ROAD_CONFIG, CAR_CONFIG, NEAR_MISS } from './gameConstants';

/**
 * Calculates the horizontal X center position for a given lane index (0 to lanesCount - 1).
 */
export const getLaneXPosition = (
  laneIndex,
  roadWidth = ROAD_CONFIG.ROAD_WIDTH,
  lanesCount = ROAD_CONFIG.LANES_COUNT,
) => {
  const laneWidth = roadWidth / lanesCount;
  return laneWidth * laneIndex + laneWidth / 2;
};

/**
 * Axis-Aligned Bounding Box (AABB) collision check with adjustable tolerance margin.
 */
export const checkCollision = (rectA, rectB, marginRatio = 0.15) => {
  if (!rectA || !rectB) return false;

  const marginX_A = rectA.width * marginRatio;
  const marginY_A = rectA.height * marginRatio;
  const marginX_B = rectB.width * marginRatio;
  const marginY_B = rectB.height * marginRatio;

  const aLeft = rectA.x + marginX_A;
  const aRight = rectA.x + rectA.width - marginX_A;
  const aTop = rectA.y + marginY_A;
  const aBottom = rectA.y + rectA.height - marginY_A;

  const bLeft = rectB.x + marginX_B;
  const bRight = rectB.x + rectB.width - marginX_B;
  const bTop = rectB.y + marginY_B;
  const bBottom = rectB.y + rectB.height - marginY_B;

  return !(
    aRight < bLeft ||
    aLeft > bRight ||
    aBottom < bTop ||
    aTop > bBottom
  );
};

/**
 * Checks if player passed an obstacle very closely without colliding (Near-Miss detection).
 */
export const checkNearMiss = (playerRect, obstacleRect) => {
  if (!playerRect || !obstacleRect) return false;

  // Vertical overlap check
  const verticalOverlap =
    playerRect.y < obstacleRect.y + obstacleRect.height &&
    playerRect.y + playerRect.height > obstacleRect.y;

  if (!verticalOverlap) return false;

  // Horizontal proximity
  const pRight = playerRect.x + playerRect.width;
  const pLeft = playerRect.x;
  const oRight = obstacleRect.x + obstacleRect.width;
  const oLeft = obstacleRect.x;

  const distRight = Math.abs(oLeft - pRight);
  const distLeft = Math.abs(pLeft - oRight);

  const minHorizontalDist = Math.min(distRight, distLeft);

  return minHorizontalDist > 0 && minHorizontalDist <= NEAR_MISS.HORIZONTAL_THRESHOLD;
};

/**
 * Checks if the player collected a coin or powerup.
 */
export const checkCoinCollection = (playerRect, coinRect) => {
  return checkCollision(playerRect, coinRect, 0.05);
};

/**
 * Calculates score earned based on distance traveled, speed, and bonuses.
 */
export const calculateScore = (distance, currentSpeed, nearMissCount = 0, coinsCount = 0) => {
  const baseScore = Math.floor(distance * 1.5);
  const speedBonus = Math.floor(currentSpeed * 0.25);
  const nearMissBonus = nearMissCount * NEAR_MISS.BONUS_SCORE;
  const coinBonus = coinsCount * 25;
  return baseScore + speedBonus + nearMissBonus + coinBonus;
};

/**
 * Computes dynamic speed scaling based on distance.
 */
export const getScaledSpeed = (baseSpeed, distance, maxSpeed = CAR_CONFIG.MAX_SPEED) => {
  const progressRatio = Math.min(distance / 6000, 1);
  return Math.floor(baseSpeed + (maxSpeed - baseSpeed) * progressRatio);
};

export default {
  getLaneXPosition,
  checkCollision,
  checkNearMiss,
  checkCoinCollection,
  calculateScore,
  getScaledSpeed,
};

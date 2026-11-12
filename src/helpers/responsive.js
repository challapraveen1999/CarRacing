import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Base guideline dimensions (standard mobile reference: iPhone 13/14 / modern Android)
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

/**
 * Responsive horizontal scaling
 */
export const scale = (size) => (WINDOW_WIDTH / GUIDELINE_BASE_WIDTH) * size;

/**
 * Responsive vertical scaling
 */
export const verticalScale = (size) => (WINDOW_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Moderate scaling with configurable factor
 * @param {number} size
 * @param {number} factor - Defaults to 0.5
 */
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Moderate vertical scaling with configurable factor
 */
export const moderateVerticalScale = (size, factor = 0.5) =>
  size + (verticalScale(size) - size) * factor;

/**
 * Device classifications
 */
export const isSmallDevice = WINDOW_WIDTH <= 360;
export const isShortDevice = WINDOW_HEIGHT <= 700;
export const isTablet = WINDOW_WIDTH >= 600;
export const isTallDevice = WINDOW_HEIGHT / WINDOW_WIDTH >= 2.1; // 21:9 or taller

/**
 * Dynamic Road & Lane configuration tailored to any device dimension
 */
export const getResponsiveRoadConfig = (screenWidth = WINDOW_WIDTH, screenHeight = WINDOW_HEIGHT) => {
  const lanesCount = 3;
  // Road occupies 90% of screen width on phones, capped at 420px on tablets to keep racing focused
  const maxRoadWidth = Math.min(screenWidth * 0.92, 420);
  const roadWidth = isSmallDevice ? screenWidth * 0.94 : maxRoadWidth;
  const laneWidth = roadWidth / lanesCount;
  const roadLeft = (screenWidth - roadWidth) / 2;

  // Car scales slightly on small screens to maintain easy dodging
  const carWidth = isSmallDevice ? 46 : 52;
  const carHeight = isSmallDevice ? 86 : 96;

  return {
    screenWidth,
    screenHeight,
    lanesCount,
    roadWidth,
    laneWidth,
    roadLeft,
    carWidth,
    carHeight,
  };
};

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  isSmallDevice,
  isShortDevice,
  isTablet,
  isTallDevice,
  getResponsiveRoadConfig,
};


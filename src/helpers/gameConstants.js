import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const STORAGE_KEYS = {
  BEST_SCORE: 'bestScore',
  BEST_DISTANCE: 'bestDistance',
  TOTAL_COINS: 'totalCoins',
  UNLOCKED_CARS: 'unlockedCars',
  SELECTED_CAR: 'selectedCar',
  MUSIC_ENABLED: 'musicEnabled',
  EFFECTS_ENABLED: 'effectsEnabled',
  VIBRATION_ENABLED: 'vibrationEnabled',
  MUSIC_VOLUME: 'musicVolume',
  EFFECTS_VOLUME: 'effectsVolume',
};

export const GAME_MODES = {
  ENDLESS: {
    id: 'endless',
    title: 'Endless Highway',
    subtitle: 'Drive as far as you can without crashing',
    icon: '🛣️',
    difficulty: 'Normal',
    speedMultiplier: 1.0,
    timeLimit: null,
  },
  TIME_ATTACK: {
    id: 'time_attack',
    title: 'Time Attack',
    subtitle: 'Reach checkpoints before the timer expires',
    icon: '⏱️',
    difficulty: 'Hard',
    speedMultiplier: 1.25,
    timeLimit: 45, // seconds
    checkpointBonus: 10,
  },
  SPEED_RUSH: {
    id: 'speed_rush',
    title: 'Speed Rush',
    subtitle: 'High density traffic at intense speeds',
    icon: '⚡',
    difficulty: 'Extreme',
    speedMultiplier: 1.5,
    timeLimit: null,
  },
};

export const ROAD_CONFIG = {
  LANES_COUNT: 4, // Spacious 4-lane open highway
  ROAD_WIDTH: Math.min(SCREEN_WIDTH * 0.94, 420),
  STRIPE_HEIGHT: 48,
  STRIPE_GAP: 32,
  SHOULDER_WIDTH: 12,
};

export const CAR_CONFIG = {
  WIDTH: 52,
  HEIGHT: 96,
  BASE_SPEED: 200,
  MAX_SPEED: 320,
  NITRO_SPEED: 400,
  ACCELERATION_RATE: 28,
  DECELERATION_RATE: 35,
};

export const BOOST_CONFIG = {
  RECHARGE_RATE: 14, // % per second recharged when idle
  CONSUMPTION_RATE: 24, // % per second consumed when dragging UP
  MAX_BOOST_SPEED: 390,
  MIN_BRAKE_SPEED: 110,
  CRUISE_SPEED: 220,
};

export const SAFE_ZONE_CONFIG = {
  ZONE_HEIGHT: 280, // Height of glowing road safe field
  SPAWN_INTERVAL_METERS: 400, // Distance interval between safe zones
  SHIELD_DURATION_S: 10,
  COLOR: '#00E5FF',
  GLOW: 'rgba(0, 229, 255, 0.35)',
};

export const OBSTACLE_CONFIG = {
  WIDTH: 48,
  HEIGHT: 88,
  SPAWN_INTERVAL_MS: 1500,
  MIN_SPAWN_INTERVAL_MS: 650,
};

export const COIN_CONFIG = {
  SIZE: 28,
  VALUE: 100, // 100 coins per pickup matching voiceover/notification
  SPAWN_INTERVAL_MS: 2000,
};

export const POWERUPS = {
  SHIELD: {
    id: 'shield',
    icon: '🛡️',
    title: 'Safe Mode',
    duration: 10, // seconds - strictly 10s safe zone
    color: '#00E5FF',
  },
  MAGNET: {
    id: 'magnet',
    icon: '🧲',
    title: 'Magnet',
    duration: 8, // seconds
    color: '#FFD700',
    attractRadius: 180,
  },
  NITRO_TANK: {
    id: 'nitro_tank',
    icon: '⚡',
    title: 'Nitro Refill',
    instant: true,
    color: '#00F0FF',
  },
  HEALTH_PACK: {
    id: 'health_pack',
    icon: '❤️',
    title: 'Health Repair',
    healAmount: 35,
    color: '#4CAF50',
  },
};

export const NEAR_MISS = {
  HORIZONTAL_THRESHOLD: 18,
  BONUS_SCORE: 150,
  NITRO_BONUS: 15,
};

export const SCREEN_DIMENSIONS = {
  WIDTH: SCREEN_WIDTH,
  HEIGHT: SCREEN_HEIGHT,
};

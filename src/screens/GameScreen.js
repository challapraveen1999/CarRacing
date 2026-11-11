import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import {
  CAR_CONFIG,
  ROAD_CONFIG,
  GAME_MODES,
  POWERUPS,
  STORAGE_KEYS,
  NEAR_MISS,
} from '../helpers/gameConstants';
import { getCarById } from '../helpers/carsData';
import { getItem, recordRaceResult } from '../helpers/storage';
import {
  checkCollision,
  checkNearMiss,
  checkCoinCollection,
  calculateScore,
} from '../helpers/gameLogic';
import {
  playEffect,
  playBrake,
  stopBrake,
  playDash,
  playCrashSound,
  playAccidentSound,
  playCoinVoice,
  playCountdownSound,
  startEngineLoop,
  stopEngineLoop,
  updateMovingSpeed,
} from '../helpers/SoundManager';
import CarSprite from '../components/CarSprite';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LANE_COUNT = ROAD_CONFIG.LANES_COUNT;
const ROAD_WIDTH = ROAD_CONFIG.ROAD_WIDTH;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
const ROAD_LEFT = (SCREEN_WIDTH - ROAD_WIDTH) / 2;

const PLAYER_WIDTH = CAR_CONFIG.WIDTH;
const PLAYER_HEIGHT = CAR_CONFIG.HEIGHT;
const PLAYER_Y = SCREEN_HEIGHT - PLAYER_HEIGHT - 130;

// Precomputed speed warp streak lines for Dash mode
const WARP_STREAKS = [
  { x: ROAD_LEFT - 14, offset: 40, length: 110, opacity: 0.7 },
  { x: ROAD_LEFT - 6, offset: 220, length: 150, opacity: 0.9 },
  { x: ROAD_LEFT + 12, offset: 450, length: 80, opacity: 0.6 },
  { x: ROAD_LEFT + ROAD_WIDTH - 20, offset: 120, length: 90, opacity: 0.6 },
  { x: ROAD_LEFT + ROAD_WIDTH + 6, offset: 330, length: 160, opacity: 0.9 },
  { x: ROAD_LEFT + ROAD_WIDTH + 16, offset: 510, length: 120, opacity: 0.7 },
  { x: ROAD_LEFT - 22, offset: 600, length: 140, opacity: 0.8 },
  { x: ROAD_LEFT + ROAD_WIDTH + 24, offset: 180, length: 130, opacity: 0.8 },
];

const GameScreen = ({ navigation, route }) => {
  const selectedModeKey = route.params?.mode || 'endless';
  const modeConfig = GAME_MODES[selectedModeKey.toUpperCase()] || GAME_MODES.ENDLESS;

  // Selected player car
  const [selectedCar, setSelectedCar] = useState(getCarById('car_01'));

  // HUD & Dashboard State
  const [hudSpeed, setHudSpeed] = useState(CAR_CONFIG.BASE_SPEED);
  const [hudDistance, setHudDistance] = useState(0);
  const [hudScore, setHudScore] = useState(0);
  const [hudCoins, setHudCoins] = useState(0);
  const [hudHealth, setHudHealth] = useState(100);
  const [nitroFuel, setNitroFuel] = useState(100); // 0 - 100%
  const [activeShield, setActiveShield] = useState(false);
  const [activeMagnet, setActiveMagnet] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(modeConfig.timeLimit);
  const [floatingNotification, setFloatingNotification] = useState(null);
  const [countdownText, setCountdownText] = useState('3');
  const [isCountingDown, setIsCountingDown] = useState(true);

  // Gameplay state flags
  const [isPaused, setIsPaused] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const [isNitro, setIsNitro] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [isSmashed, setIsSmashed] = useState(false);
  const [showFogEffects, setShowFogEffects] = useState(false);
  const [isAccidentFlashing, setIsAccidentFlashing] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [isBlast, setIsBlast] = useState(false);
  const crashAnim = useRef(new Animated.Value(0)).current;
  const fogAnim = useRef(new Animated.Value(0)).current;
  const blastAnim = useRef(new Animated.Value(0)).current;

  // Break & Dash Visual Systems
  const [skidMarks, setSkidMarks] = useState([]);
  const [comboCount, setComboCount] = useState(1);
  const [comboActive, setComboActive] = useState(false);

  // Animated Lane Transitions & Tilting
  const playerLaneRef = useRef(1); // 0: left, 1: center, 2: right
  const playerXAnim = useRef(new Animated.Value(1 * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2)).current;
  const playerTiltAnim = useRef(new Animated.Value(0)).current; // -1: left, 0: center, 1: right

  // Road Stripe Animation
  const [roadOffset, setRoadOffset] = useState(0);

  // Entities in race (State for React rendering + Refs for synchronous 60 FPS physics)
  const [obstacles, setObstacles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [powerupItems, setPowerupItems] = useState([]);
  const obstaclesRef = useRef([]);
  const coinsRef = useRef([]);
  const powerupItemsRef = useRef([]);
  const shiftLaneRef = useRef(null);
  const hasSwipedInCurrentGesture = useRef(false);
  const isGameOverProcessedRef = useRef(false);

  // Mutable Game Loop State in Refs (for smooth 60 FPS performance)
  const stateRef = useRef({
    distance: 0,
    score: 0,
    coinsCollected: 0,
    nearMissCount: 0,
    comboStreak: 1,
    nitroFuel: 100,
    health: 100,
    invulnerableTimer: 0,
    isNitro: false,
    isBraking: false,
    speed: CAR_CONFIG.BASE_SPEED * modeConfig.speedMultiplier,
    shield: false,
    shieldTimer: 0,
    magnet: false,
    magnetTimer: 0,
    timeRemaining: modeConfig.timeLimit,
    checkpointTarget: 500,
    isGameOver: false,
    isPaused: false,
  });

  const nextId = useRef(1);
  const lastTimeRef = useRef(null);
  const timeSinceObstacle = useRef(0);
  const timeSinceCoin = useRef(0);
  const timeSincePowerup = useRef(0);
  const timeSinceSkid = useRef(0);
  const comboTimerRef = useRef(null);
  const loopIdRef = useRef(null);
  const hudThrottleRef = useRef(0);

  // Load Selected Car from storage and run 3, 2, 1, GO sound flow
  useEffect(() => {
    getItem(STORAGE_KEYS.SELECTED_CAR, 'car_01').then(carId => {
      setSelectedCar(getCarById(carId));
    });

    // Play full "3, 2, 1, GO!" voice clip
    playCountdownSound();

    const t1 = setTimeout(() => {
      setCountdownText('2');
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdownText('1');
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdownText('GO!');
      startEngineLoop();
    }, 3000);

    const t4 = setTimeout(() => {
      setIsCountingDown(false);
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      stopEngineLoop();
      if (loopIdRef.current) {
        cancelAnimationFrame(loopIdRef.current);
      }
    };
  }, []);

  // Smooth lane shift with tilt animation
  const shiftLane = useCallback((targetLane) => {
    if (stateRef.current.isGameOver || stateRef.current.isPaused) return;
    const clampedLane = Math.max(0, Math.min(LANE_COUNT - 1, targetLane));
    if (clampedLane === playerLaneRef.current) return;

    playEffect('button');
    const direction = clampedLane > playerLaneRef.current ? 1 : -1;
    playerLaneRef.current = clampedLane;

    const targetX = clampedLane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;

    // Tilt into turn then return to level
    Animated.sequence([
      Animated.timing(playerTiltAnim, {
        toValue: direction * 12,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(playerTiltAnim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Smooth lateral slide
    Animated.spring(playerXAnim, {
      toValue: targetX,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [playerTiltAnim, playerXAnim]);

  shiftLaneRef.current = shiftLane;

  // Dash Boost Handlers
  const handleNitroPressIn = useCallback(() => {
    if (isCountingDown) return;
    if (stateRef.current.nitroFuel > 5) {
      stateRef.current.isNitro = true;
      setIsNitro(true);
      playDash();
    }
  }, [isCountingDown]);

  const handleNitroPressOut = useCallback(() => {
    stateRef.current.isNitro = false;
    setIsNitro(false);
  }, []);

  // Brake Handlers
  const handleBrakePressIn = useCallback(() => {
    if (isCountingDown) return;
    stateRef.current.isBraking = true;
    setIsBraking(true);
    playBrake();
  }, [isCountingDown]);

  const handleBrakePressOut = useCallback(() => {
    stateRef.current.isBraking = false;
    setIsBraking(false);
    stopBrake();
  }, []);

  // Swipe gesture handling for fluid controls (horizontal track shift & vertical dash/brake)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 12;
      },
      onPanResponderGrant: () => {
        hasSwipedInCurrentGesture.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (hasSwipedInCurrentGesture.current) return;
        const { dx, dy } = gestureState;

        // Instant track switch as user swipes their finger
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 18) {
            hasSwipedInCurrentGesture.current = true;
            if (shiftLaneRef.current) shiftLaneRef.current(playerLaneRef.current + 1);
          } else if (dx < -18) {
            hasSwipedInCurrentGesture.current = true;
            if (shiftLaneRef.current) shiftLaneRef.current(playerLaneRef.current - 1);
          }
        } else {
          // Vertical swipe gestures
          if (dy < -26) {
            hasSwipedInCurrentGesture.current = true;
            handleNitroPressIn();
            setTimeout(handleNitroPressOut, 750);
          } else if (dy > 26) {
            hasSwipedInCurrentGesture.current = true;
            handleBrakePressIn();
            setTimeout(handleBrakePressOut, 600);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!hasSwipedInCurrentGesture.current) {
          const { dx, dy } = gestureState;
          if (Math.abs(dx) > Math.abs(dy)) {
            // Quick flick track change
            if (dx > 14) {
              if (shiftLaneRef.current) shiftLaneRef.current(playerLaneRef.current + 1);
            } else if (dx < -14) {
              if (shiftLaneRef.current) shiftLaneRef.current(playerLaneRef.current - 1);
            }
          } else if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
            // Tap-to-steer fallback: tap left moves left, tap right moves right
            const touchX = evt.nativeEvent.pageX || evt.nativeEvent.locationX;
            if (touchX < SCREEN_WIDTH / 2) {
              if (shiftLaneRef.current) shiftLaneRef.current(playerLaneRef.current - 1);
            } else {
              if (shiftLaneRef.current) shiftLaneRef.current(playerLaneRef.current + 1);
            }
          }
        }
        hasSwipedInCurrentGesture.current = false;
      },
    }),
  ).current;

  // Combo Multiplier Trigger
  const triggerCombo = useCallback(() => {
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    const nextCombo = Math.min(5, (stateRef.current.comboStreak || 1) + 1);
    stateRef.current.comboStreak = nextCombo;
    setComboCount(nextCombo);
    setComboActive(true);

    comboTimerRef.current = setTimeout(() => {
      stateRef.current.comboStreak = 1;
      setComboCount(1);
      setComboActive(false);
    }, 2800);
  }, []);

  // Temporary Notification Banner (Near miss, Shield, Checkpoint)
  const triggerNotification = (text, color = colors.secondary) => {
    setFloatingNotification({ text, color });
    setTimeout(() => {
      setFloatingNotification(null);
    }, 1200);
  };

  // Crash / Game Over sequence with Explosive Car Blast & Fog Effects
  const handleGameOver = useCallback(() => {
    if (isGameOverProcessedRef.current) return;
    isGameOverProcessedRef.current = true;
    stateRef.current.isGameOver = true;
    stateRef.current.speed = 0;
    setHudSpeed(0);
    setIsBlast(true);
    setIsCrashed(true);
    setIsSmashed(true);
    setShowFogEffects(true);
    stopEngineLoop();
    playCrashSound();
    triggerNotification('💥 CAR BLASTED! GAME OVER! 💥', colors.danger);

    // Hard-stop the requestAnimationFrame game loop immediately
    if (loopIdRef.current) {
      cancelAnimationFrame(loopIdRef.current);
      loopIdRef.current = null;
    }

    // Explosive Fireball Blast & Billowing Fog Animation
    Animated.parallel([
      Animated.timing(blastAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(fogAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(crashAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(crashAnim, {
          toValue: 2,
          duration: 440,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const finalScore = stateRef.current.score;
    const finalDistance = Math.floor(stateRef.current.distance);
    const finalCoins = stateRef.current.coinsCollected;

    // Save race result in background without blocking screen transition
    recordRaceResult({
      score: finalScore,
      distance: finalDistance,
      coinsEarned: finalCoins,
    }).then(result => {
      setTimeout(() => {
        navigation.replace('GameOver', {
          score: finalScore,
          distance: finalDistance,
          coinsCollected: finalCoins,
          isNewHighScore: result?.isNewHighScore || false,
          mode: selectedModeKey,
        });
      }, 1000);
    }).catch(() => {
      setTimeout(() => {
        navigation.replace('GameOver', {
          score: finalScore,
          distance: finalDistance,
          coinsCollected: finalCoins,
          isNewHighScore: false,
          mode: selectedModeKey,
        });
      }, 1000);
    });
  }, [navigation, selectedModeKey, blastAnim, crashAnim, fogAnim]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (isPaused) return;

    const loop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const state = stateRef.current;
      if (state.isGameOver) {
        return;
      }
      if (state.isPaused || isCountingDown) {
        loopIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Hard safety check: If car health reached 0, trigger Game Over and stop immediately!
      if (state.health <= 0) {
        handleGameOver();
        return;
      }

      // 1. Calculate Player Speed & Dash/Nitro Consumption
      let targetSpeed = CAR_CONFIG.BASE_SPEED * modeConfig.speedMultiplier;

      if (state.isNitro && state.nitroFuel > 0) {
        targetSpeed = CAR_CONFIG.NITRO_SPEED;
        state.nitroFuel = Math.max(0, state.nitroFuel - 22 * delta);
        if (state.nitroFuel === 0) {
          state.isNitro = false;
          setIsNitro(false);
        }
      } else if (state.isBraking) {
        targetSpeed = Math.max(90, targetSpeed - 95);
      } else {
        // Slowly recharge dash energy
        state.nitroFuel = Math.min(100, state.nitroFuel + 3.8 * delta);
      }

      state.speed = targetSpeed;

      // 2. Distance & Road Scrolling
      const metersThisTick = (state.speed * delta) / 3.6;
      state.distance += metersThisTick;
      setRoadOffset(prev => (prev + state.speed * delta) % 80);

      // 3. Asphalt Tire Skid Marks Generation (when braking)
      if (state.isBraking && !state.isGameOver) {
        timeSinceSkid.current += delta;
        if (timeSinceSkid.current >= 0.045) {
          timeSinceSkid.current = 0;
          const currentCarX = ROAD_LEFT + playerLaneRef.current * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
          setSkidMarks(prev => [
            ...prev.slice(-20),
            {
              id: nextId.current++,
              leftX: currentCarX + 7,
              rightX: currentCarX + PLAYER_WIDTH - 15,
              y: PLAYER_Y + PLAYER_HEIGHT - 6,
              opacity: 0.85,
            },
          ]);
        }
      }

      // Scroll existing skid marks down road
      setSkidMarks(prev => {
        if (prev.length === 0) return prev;
        const scrollAmount = state.speed * 1.15 * delta;
        return prev
          .map(sm => ({
            ...sm,
            y: sm.y + scrollAmount,
            opacity: sm.opacity - 0.22 * delta,
          }))
          .filter(sm => sm.y < SCREEN_HEIGHT + 30 && sm.opacity > 0.06);
      });

      // 4. Time Attack Checkpoints
      if (modeConfig.timeLimit !== null) {
        state.timeRemaining -= delta;
        if (state.timeRemaining <= 0) {
          handleGameOver();
          return;
        }

        if (state.distance >= state.checkpointTarget) {
          state.timeRemaining += modeConfig.checkpointBonus;
          state.checkpointTarget += 500;
          playEffect('unlock');
          triggerNotification(`CHECKPOINT! +${modeConfig.checkpointBonus}s 🏁`, colors.accent);
        }
      }

      // 5. Active Buff Timers
      if (state.shield) {
        state.shieldTimer -= delta;
        if (state.shieldTimer <= 0) {
          state.shield = false;
          setActiveShield(false);
        }
      }

      if (state.magnet) {
        state.magnetTimer -= delta;
        if (state.magnetTimer <= 0) {
          state.magnet = false;
          setActiveMagnet(false);
        }
      }

      // 6. Spawn Traffic Obstacles
      timeSinceObstacle.current += delta;
      const dynamicSpawnRate = Math.max(0.7, 1.6 - (state.distance / 4000) * 0.7);
      if (timeSinceObstacle.current > dynamicSpawnRate) {
        timeSinceObstacle.current = 0;
        const randomLane = Math.floor(Math.random() * LANE_COUNT);
        const trafficColors = [colors.danger, colors.warning, '#9C27B0', '#FF9800', '#4CAF50'];
        const randomColor = trafficColors[Math.floor(Math.random() * trafficColors.length)];

        obstaclesRef.current.push({
          id: nextId.current++,
          lane: randomLane,
          y: -100,
          color: randomColor,
          hasTriggeredNearMiss: false,
        });
      }

      // 7. Spawn Coins
      timeSinceCoin.current += delta;
      if (timeSinceCoin.current > 1.8) {
        timeSinceCoin.current = 0;
        const randomLane = Math.floor(Math.random() * LANE_COUNT);
        coinsRef.current.push({
          id: nextId.current++,
          lane: randomLane,
          y: -40,
        });
      }

      // 8. Spawn Powerups & Revive Health Points
      timeSincePowerup.current += delta;
      if (timeSincePowerup.current > 7.0) {
        timeSincePowerup.current = 0;
        // If player took damage, spawn health repair packs more frequently on track!
        const pTypes = state.health < 100
          ? [POWERUPS.HEALTH_PACK, POWERUPS.HEALTH_PACK, POWERUPS.SHIELD, POWERUPS.MAGNET, POWERUPS.NITRO_TANK]
          : [POWERUPS.SHIELD, POWERUPS.MAGNET, POWERUPS.NITRO_TANK, POWERUPS.HEALTH_PACK];
        const randomPower = pTypes[Math.floor(Math.random() * pTypes.length)];
        const randomLane = Math.floor(Math.random() * LANE_COUNT);

        powerupItemsRef.current.push({
          id: nextId.current++,
          lane: randomLane,
          y: -60,
          def: randomPower,
        });
      }

      // 9. Synchronous Update & Collision of Obstacles (Car Health & Accident System)
      const currentLane = playerLaneRef.current;
      const playerX = ROAD_LEFT + currentLane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
      const playerRect = {
        x: playerX,
        y: PLAYER_Y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      };

      if (state.invulnerableTimer > 0) {
        state.invulnerableTimer -= delta;
      }

      let didCrash = false;
      const nextObstacles = [];

      for (const obs of obstaclesRef.current) {
        const nextY = obs.y + state.speed * 1.15 * delta;
        const obsX = ROAD_LEFT + obs.lane * LANE_WIDTH + (LANE_WIDTH - 46) / 2;
        const obsRect = {
          x: obsX,
          y: nextY,
          width: 46,
          height: 82,
        };

        // Collision Check
        if (checkCollision(playerRect, obsRect, 0.12)) {
          if (state.shield) {
            state.shield = false;
            setActiveShield(false);
            playEffect('collision');
            triggerNotification('SHIELD BROKEN! 💥', colors.warning);
            continue; // Destroy obstacle
          } else if (state.invulnerableTimer > 0) {
            // Post-accident recovery grace window
            continue;
          } else {
            // ACCIDENT: Subtract Car Health!
            const hitDamage = 35;
            state.health = Math.max(0, state.health - hitDamage);
            setHudHealth(state.health);

            if (state.health > 0) {
              // Non-fatal accident: damage car, play accident sound, screen flash & jolt
              playAccidentSound();
              setIsDamaged(true);
              state.invulnerableTimer = 1.35;
              setIsAccidentFlashing(true);
              setTimeout(() => setIsAccidentFlashing(false), 300);

              // Car jolt animation
              Animated.sequence([
                Animated.timing(playerTiltAnim, { toValue: -14, duration: 60, useNativeDriver: true }),
                Animated.timing(playerTiltAnim, { toValue: 14, duration: 60, useNativeDriver: true }),
                Animated.timing(playerTiltAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
              ]).start();

              triggerNotification(
                `💥 ACCIDENT! -${hitDamage} HP (${state.health}% REMAINING)`,
                colors.danger,
              );

              // Knock hit car away
              continue;
            } else {
              // FATAL HIT: Health is 0 -> Trigger immediate Game Over!
              state.health = 0;
              setHudHealth(0);
              didCrash = true;
              break;
            }
          }
        }

        // Near-Miss Check
        if (!obs.hasTriggeredNearMiss && checkNearMiss(playerRect, obsRect)) {
          obs.hasTriggeredNearMiss = true;
          state.nearMissCount += 1;
          state.nitroFuel = Math.min(100, state.nitroFuel + NEAR_MISS.NITRO_BONUS);
          playEffect('button');
          triggerCombo();
          const multiplier = state.comboStreak || 1;
          triggerNotification(`⚡ CLOSE CALL! +${NEAR_MISS.BONUS_SCORE * multiplier}`, colors.accent);
        }

        if (nextY < SCREEN_HEIGHT + 120) {
          nextObstacles.push({ ...obs, y: nextY });
        }
      }

      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);

      // IMMEDIATE GAME OVER WHEN CAR HEALTH IS 0
      if (didCrash || state.health <= 0) {
        handleGameOver();
        return;
      }

      // 10. Update & Collect Coins with Voiceover
      const nextCoins = [];
      for (const coin of coinsRef.current) {
        let nextY = coin.y + state.speed * 1.25 * delta;
        let coinLane = coin.lane;

        // Magnet Attraction
        if (state.magnet) {
          const coinX = ROAD_LEFT + coinLane * LANE_WIDTH + LANE_WIDTH / 2;
          const dist = Math.hypot(coinX - (playerX + PLAYER_WIDTH / 2), nextY - PLAYER_Y);
          if (dist < POWERUPS.MAGNET.attractRadius) {
            if (coinLane < currentLane) coinLane += 1;
            else if (coinLane > currentLane) coinLane -= 1;
            nextY += 120 * delta;
          }
        }

        const coinX = ROAD_LEFT + coinLane * LANE_WIDTH + (LANE_WIDTH - 28) / 2;
        const coinRect = {
          x: coinX,
          y: nextY,
          width: 28,
          height: 28,
        };

        if (checkCoinCollection(playerRect, coinRect)) {
          playEffect('coin');
          playCoinVoice();
          state.coinsCollected += 1;
          state.nitroFuel = Math.min(100, state.nitroFuel + 2);
          triggerCombo();
          triggerNotification('🗣️ "COIN COLLECTED!" +100', colors.accent);
        } else if (nextY < SCREEN_HEIGHT + 60) {
          nextCoins.push({ ...coin, y: nextY, lane: coinLane });
        }
      }
      coinsRef.current = nextCoins;
      setCoins(nextCoins);

      // 11. Update & Collect Powerup Items and Review Health Points
      const nextPowerups = [];
      for (const item of powerupItemsRef.current) {
        const nextY = item.y + state.speed * 1.15 * delta;
        const itemX = ROAD_LEFT + item.lane * LANE_WIDTH + (LANE_WIDTH - 36) / 2;
        const itemRect = {
          x: itemX,
          y: nextY,
          width: 36,
          height: 36,
        };

        if (checkCollision(playerRect, itemRect, 0.05)) {
          playEffect('unlock');
          if (item.def.id === 'health_pack') {
            // Restore Health Points!
            const heal = item.def.healAmount || 35;
            state.health = Math.min(100, state.health + heal);
            setHudHealth(state.health);
            if (state.health >= 70) {
              setIsDamaged(false);
            }
            triggerNotification(`❤️ HEALTH REPAIRED! +${heal} HP (${state.health}%)`, '#4CAF50');
          } else if (item.def.id === 'shield') {
            state.shield = true;
            state.shieldTimer = item.def.duration;
            setActiveShield(true);
            triggerNotification('SHIELD ACTIVATED! 🛡️', colors.secondary);
          } else if (item.def.id === 'magnet') {
            state.magnet = true;
            state.magnetTimer = item.def.duration;
            setActiveMagnet(true);
            triggerNotification('COIN MAGNET ON! 🧲', colors.accent);
          } else if (item.def.id === 'nitro_tank') {
            state.nitroFuel = 100;
            triggerNotification('DASH TANK FULL! ⚡', colors.nitro);
          }
        } else if (nextY < SCREEN_HEIGHT + 60) {
          nextPowerups.push({ ...item, y: nextY });
        }
      }
      powerupItemsRef.current = nextPowerups;
      setPowerupItems(nextPowerups);

      // 12. Score computation & Throttled HUD update
      state.score = calculateScore(
        state.distance,
        state.speed,
        state.nearMissCount,
        state.coinsCollected,
      );
      if (state.comboStreak > 1) {
        state.score += Math.floor((state.comboStreak - 1) * 20 * delta * 10);
      }

      hudThrottleRef.current += delta;
      if (hudThrottleRef.current > 0.08) {
        hudThrottleRef.current = 0;
        updateMovingSpeed(state.speed / 380);
        setHudSpeed(Math.floor(state.speed));
        setHudDistance(Math.floor(state.distance));
        setHudScore(state.score);
        setHudCoins(state.coinsCollected);
        setNitroFuel(Math.floor(state.nitroFuel));
        if (state.timeRemaining !== null) {
          setTimeRemaining(Math.ceil(state.timeRemaining));
        }
      }

      loopIdRef.current = requestAnimationFrame(loop);
    };

    loopIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (loopIdRef.current) {
        cancelAnimationFrame(loopIdRef.current);
      }
    };
  }, [isPaused, modeConfig, handleGameOver, isCountingDown, triggerCombo, playerTiltAnim]);

  // Pause Menu Handler
  const handlePause = () => {
    stateRef.current.isPaused = true;
    setIsPaused(true);
    stopEngineLoop();
    playEffect('button');

    navigation.navigate('Pause', {
      onResume: () => {
        stateRef.current.isPaused = false;
        setIsPaused(false);
        lastTimeRef.current = null;
        startEngineLoop();
      },
      onRestart: () => {
        stateRef.current.isPaused = false;
        stateRef.current.isGameOver = false;
        stateRef.current.distance = 0;
        stateRef.current.score = 0;
        stateRef.current.coinsCollected = 0;
        stateRef.current.nearMissCount = 0;
        stateRef.current.comboStreak = 1;
        stateRef.current.nitroFuel = 100;
        stateRef.current.health = 100;
        stateRef.current.invulnerableTimer = 0;
        stateRef.current.shield = false;
        stateRef.current.magnet = false;
        stateRef.current.timeRemaining = modeConfig.timeLimit;
        setIsPaused(false);
        setIsCrashed(false);
        setIsBlast(false);
        setIsDamaged(false);
        setIsSmashed(false);
        setShowFogEffects(false);
        setHudHealth(100);
        crashAnim.setValue(0);
        fogAnim.setValue(0);
        blastAnim.setValue(0);
        isGameOverProcessedRef.current = false;
        obstaclesRef.current = [];
        coinsRef.current = [];
        powerupItemsRef.current = [];
        setObstacles([]);
        setCoins([]);
        setPowerupItems([]);
        setSkidMarks([]);
        shiftLane(1);
        lastTimeRef.current = null;
        startEngineLoop();
      },
    });
  };

  const interpolatedTilt = playerTiltAnim.interpolate({
    inputRange: [-12, 12],
    outputRange: ['-12deg', '12deg'],
  });

  const interpolatedCrashSpin = crashAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '45deg', '140deg'],
  });

  // Derived Dashboard Metrics
  const rpm = Math.min(9000, Math.floor(1400 + (hudSpeed / 390) * 7600));
  const currentGear =
    hudSpeed < 65
      ? '1'
      : hudSpeed < 120
        ? '2'
        : hudSpeed < 175
          ? '3'
          : hudSpeed < 230
            ? '4'
            : hudSpeed < 290
              ? '5'
              : isNitro
                ? 'TURBO'
                : '6';
  const isRedline = rpm >= 7600;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={colors.roadAsphalt} />

      {/* Red Screen Flash on Accident */}
      {(isAccidentFlashing || isCrashed) && (
        <View style={styles.accidentFlash} pointerEvents="none" />
      )}

      {/* Explosive Blast Flash (Yellow-Orange to Red) */}
      {isBlast && (
        <Animated.View
          style={[
            styles.blastScreenFlash,
            {
              opacity: blastAnim.interpolate({
                inputRange: [0, 0.25, 1],
                outputRange: [0.85, 0.65, 0],
              }),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Smashed Accident Dense Fog Blanket Over Asphalt */}
      {showFogEffects && (
        <Animated.View
          style={[
            styles.roadFogOverlay,
            {
              opacity: fogAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.88],
              }),
            },
          ]}
          pointerEvents="none">
          <View style={styles.roadFogBandTop} />
          <View style={styles.roadFogBandMiddle} />
          <View style={styles.roadFogBandBottom} />
        </Animated.View>
      )}

      {/* Highway Road Canvas */}
      <View style={[styles.road, { width: ROAD_WIDTH, left: ROAD_LEFT }]}>
        {/* Red & White Asphalt Curbs / Rumble Strips (Left & Right) */}
        <View style={styles.curbLeft}>
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.curbStripe,
                (i + Math.floor(roadOffset / 20)) % 2 === 0 ? styles.curbRed : styles.curbWhite,
              ]}
            />
          ))}
        </View>

        <View style={styles.curbRight}>
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.curbStripe,
                (i + Math.floor(roadOffset / 20)) % 2 === 0 ? styles.curbRed : styles.curbWhite,
              ]}
            />
          ))}
        </View>

        {/* Animated Dashed Lane Dividers */}
        <View style={[styles.laneDivider, { left: LANE_WIDTH, top: roadOffset - 80 }]}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.stripe} />
          ))}
        </View>

        <View style={[styles.laneDivider, { left: LANE_WIDTH * 2, top: roadOffset - 80 }]}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.stripe} />
          ))}
        </View>

        {/* Real Rubber Tire Skid Marks on Asphalt (Braking System) */}
        {skidMarks.map(sm => (
          <React.Fragment key={sm.id}>
            <View
              style={[
                styles.skidMark,
                {
                  left: sm.leftX - ROAD_LEFT,
                  top: sm.y,
                  opacity: sm.opacity,
                },
              ]}
            />
            <View
              style={[
                styles.skidMark,
                {
                  left: sm.rightX - ROAD_LEFT,
                  top: sm.y,
                  opacity: sm.opacity,
                },
              ]}
            />
          </React.Fragment>
        ))}

        {/* Collectible Coins */}
        {coins.map(c => {
          const coinX = c.lane * LANE_WIDTH + (LANE_WIDTH - 28) / 2;
          return (
            <View
              key={c.id}
              style={[
                styles.coinItem,
                { left: coinX, top: c.y },
              ]}>
              <Text style={styles.coinEmoji}>🪙</Text>
            </View>
          );
        })}

        {/* Collectible Power-ups & Review Health Points */}
        {powerupItems.map(p => {
          const pX = p.lane * LANE_WIDTH + (LANE_WIDTH - 36) / 2;
          const isHealth = p.def.id === 'health_pack';
          return (
            <View
              key={p.id}
              style={[
                styles.powerupItem,
                isHealth
                  ? styles.healthItemCard
                  : {
                    borderColor: p.def.color,
                    shadowColor: p.def.color,
                  },
                {
                  left: pX,
                  top: p.y,
                },
              ]}>
              <Text style={isHealth ? styles.healthPackIcon : styles.powerupIcon}>
                {p.def.icon}
              </Text>
              {isHealth && <Text style={styles.healthPackSub}>+HP</Text>}
            </View>
          );
        })}

        {/* Traffic Obstacles */}
        {obstacles.map(obs => {
          const obsX = obs.lane * LANE_WIDTH + (LANE_WIDTH - 46) / 2;
          return (
            <View
              key={obs.id}
              style={[
                styles.trafficCarWrapper,
                {
                  left: obsX,
                  top: obs.y,
                },
              ]}>
              <CarSprite
                width={46}
                height={82}
                bodyColor={obs.color}
                stripeColor="#21262D"
                roofColor="#0D1117"
                vehicleType="sports"
              />
            </View>
          );
        })}

        {/* Player Car with Headlight Beams & Underglow */}
        <Animated.View
          style={[
            styles.playerCarWrapper,
            {
              top: PLAYER_Y,
              transform: [
                { translateX: playerXAnim },
                { rotate: isCrashed ? interpolatedCrashSpin : interpolatedTilt },
              ],
            },
          ]}>
          {/* Headlight beams projected onto road (broken if smashed) */}
          {!isSmashed && <View style={styles.headlightBeams} />}

          {/* Shield Dome (if active) */}
          {activeShield && <View style={styles.shieldHalo} />}

          {/* Magnet Field (if active) */}
          {activeMagnet && <View style={styles.magnetHalo} />}

          {/* Brake Light Road Glow (when braking) */}
          {isBraking && !isSmashed && <View style={styles.brakeRoadGlow} />}

          {/* Dynamic Sports Car Chassis */}
          <CarSprite
            width={PLAYER_WIDTH}
            height={PLAYER_HEIGHT}
            bodyColor={selectedCar.colors.body}
            stripeColor={selectedCar.colors.stripes}
            roofColor={selectedCar.colors.roof}
            isBraking={isBraking}
            isNitro={isNitro}
            isDamaged={isDamaged || hudHealth < 100}
            isSmashed={isSmashed}
            vehicleType="sports"
          />

          {/* Explosive Car Blast / Fireball Shockwave */}
          {isBlast && (
            <Animated.View
              style={[
                styles.blastContainer,
                {
                  transform: [
                    {
                      scale: blastAnim.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [0.35, 1.9, 2.5],
                      }),
                    },
                  ],
                  opacity: blastAnim.interpolate({
                    inputRange: [0, 0.2, 0.75, 1],
                    outputRange: [0.95, 1, 0.8, 0],
                  }),
                },
              ]}
              pointerEvents="none">
              <View style={styles.blastRingOuter} />
              <View style={styles.blastRingMid} />
              <View style={styles.blastCoreFireball}>
                <Text style={styles.blastEmoji}>💥</Text>
              </View>
              <View style={[styles.blastSpark, styles.spark1]} />
              <View style={[styles.blastSpark, styles.spark2]} />
              <View style={[styles.blastSpark, styles.spark3]} />
              <View style={[styles.blastSpark, styles.spark4]} />
            </Animated.View>
          )}

          {/* Billowing Fog & Smoke Clouds from Smashed Car Hood & Engine */}
          {showFogEffects && (
            <Animated.View
              style={[
                styles.smashedFogCluster,
                {
                  opacity: fogAnim.interpolate({
                    inputRange: [0, 0.35, 1],
                    outputRange: [0.3, 0.9, 1],
                  }),
                  transform: [
                    {
                      scale: fogAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.4],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents="none">
              <View style={[styles.fogCloud, styles.fogCloud1]} />
              <View style={[styles.fogCloud, styles.fogCloud2]} />
              <View style={[styles.fogCloud, styles.fogCloud3]} />
              <View style={[styles.fogCloud, styles.fogCloud4]} />
              <View style={[styles.fogCloud, styles.fogCloud5]} />
              <View style={[styles.fogCloud, styles.fogCloud6]} />
              <View style={styles.fogEmberCore} />
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Hyperspace Speed Warp Streaks during Dash */}
      {isNitro && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {WARP_STREAKS.map((streak, idx) => (
            <View
              key={idx}
              style={[
                styles.warpStreak,
                {
                  left: streak.x,
                  top: (roadOffset * 3.4 + streak.offset) % SCREEN_HEIGHT,
                  height: streak.length,
                  opacity: streak.opacity,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Floating Center Notification */}
      {floatingNotification && (
        <View style={styles.notificationBubble}>
          <Text
            style={[
              styles.notificationText,
              { color: floatingNotification.color },
            ]}>
            {floatingNotification.text}
          </Text>
        </View>
      )}

      {/* Dynamic Combo Multiplier Banner */}
      {comboActive && comboCount > 1 && (
        <View style={styles.comboBanner}>
          <Text style={styles.comboBannerText}>
            🔥 COMBO x{comboCount}! (+{(comboCount - 1) * 25}% PTS)
          </Text>
        </View>
      )}

      {/* 3, 2, 1, GO Arcade Countdown Overlay */}
      {isCountingDown && (
        <View style={styles.countdownOverlay}>
          <Text
            style={[
              styles.countdownBigText,
              countdownText === 'GO!' ? styles.countdownGoText : styles.countdownNumText,
            ]}>
            {countdownText}
          </Text>
        </View>
      )}

      {/* Arcade Cockpit Dashboard Cluster */}
      <View style={styles.dashboardContainer}>
        {/* Main Dashboard Cluster */}
        <View style={styles.dashCluster}>
          {/* Left: Speedometer & Gear */}
          <View style={styles.dashLeft}>
            <View style={styles.gearBadge}>
              <Text style={styles.gearLabel}>GEAR</Text>
              <Text style={[styles.gearValue, isNitro && styles.gearValueTurbo]}>
                {currentGear}
              </Text>
            </View>
            <View style={styles.speedCol}>
              <Text style={[styles.speedNum, isNitro && styles.speedNumNitro]}>
                {hudSpeed}
              </Text>
              <Text style={styles.speedUnit}>KM/H</Text>
            </View>
          </View>

          {/* Center: Score, Distance & Timer */}
          <View style={styles.dashCenter}>
            <Text style={styles.scoreText}>{hudScore.toLocaleString()}</Text>
            <View style={styles.distanceRow}>
              <Text style={styles.distText}>{hudDistance} M</Text>
              {timeRemaining !== null && (
                <Text
                  style={[
                    styles.timerBadge,
                    timeRemaining <= 10 && styles.timerWarning,
                  ]}>
                  ⏱️ {timeRemaining}s
                </Text>
              )}
            </View>
          </View>

          {/* Right: Coins & Pause */}
          <View style={styles.dashRight}>
            <View style={styles.coinPill}>
              <Text style={styles.coinPillText}>🪙 {hudCoins}</Text>
            </View>
            <TouchableOpacity
              style={styles.pauseCircle}
              activeOpacity={0.7}
              onPress={handlePause}>
              <Text style={styles.pauseCircleText}>⏸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Car Health Bar (Accident & Damage Indicator) */}
        <View style={styles.healthContainer}>
          <View style={styles.healthHeader}>
            <Text style={styles.healthLabel}>❤️ CAR HEALTH</Text>
            <Text
              style={[
                styles.healthPercent,
                hudHealth <= 35
                  ? styles.healthPercentDanger
                  : hudHealth <= 65
                    ? styles.healthPercentWarn
                    : styles.healthPercentGood,
              ]}>
              {hudHealth}% HP {isDamaged ? '⚠️ DAMAGED' : ''}
            </Text>
          </View>
          <View style={styles.healthBarBg}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${hudHealth}%` },
                hudHealth <= 35
                  ? styles.healthFillDanger
                  : hudHealth <= 65
                    ? styles.healthFillWarn
                    : styles.healthFillGood,
              ]}
            />
          </View>
        </View>

        {/* Tachometer RPM & Dash Boost Bar */}
        <View style={styles.tachometerRow}>
          {/* RPM LED Bar */}
          <View style={styles.rpmContainer}>
            <View style={styles.rpmHeader}>
              <Text style={styles.rpmLabel}>RPM</Text>
              <Text style={[styles.rpmValue, isRedline && styles.rpmRedline]}>
                {rpm.toLocaleString()} {isRedline ? '🔥 REDLINE' : ''}
              </Text>
            </View>
            <View style={styles.rpmBarBg}>
              {Array.from({ length: 12 }).map((_, i) => {
                const segActive = (i + 1) / 12 <= rpm / 9000;
                const isRedSeg = i >= 9;
                const isYellowSeg = i >= 6 && i < 9;
                return (
                  <View
                    key={i}
                    style={[
                      styles.rpmSegment,
                      segActive &&
                      (isRedSeg
                        ? styles.rpmSegRed
                        : isYellowSeg
                          ? styles.rpmSegYellow
                          : styles.rpmSegGreen),
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Dash Boost Fuel Reservoir */}
          <View style={styles.dashFuelContainer}>
            <View style={styles.dashFuelHeader}>
              <Text style={styles.dashFuelLabel}>⚡ DASH</Text>
              <Text
                style={[
                  styles.dashFuelPercent,
                  isNitro && styles.dashFuelPercentActive,
                ]}>
                {nitroFuel}%
              </Text>
            </View>
            <View style={styles.dashFuelBg}>
              <View
                style={[
                  styles.dashFuelFill,
                  { width: `${nitroFuel}%` },
                  isNitro && styles.dashFuelFillPulsing,
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Active Buffs (Shield / Magnet) */}
      {(activeShield || activeMagnet) && (
        <View style={styles.buffsRow}>
          {activeShield && (
            <View style={styles.buffBadge}>
              <Text style={styles.buffText}>🛡️ SHIELD</Text>
            </View>
          )}
          {activeMagnet && (
            <View style={[styles.buffBadge, { borderColor: colors.accent }]}>
              <Text style={[styles.buffText, { color: colors.accent }]}>
                🧲 MAGNET
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Arcade Controls: Steering + BRAKE + DASH Pedals */}
      <View style={styles.bottomControlsContainer}>
        {/* Left: Brake Pedal */}
        <TouchableOpacity
          style={[
            styles.pedalButton,
            styles.brakePedal,
            isBraking && styles.brakePedalActive,
          ]}
          activeOpacity={0.7}
          onPressIn={handleBrakePressIn}
          onPressOut={handleBrakePressOut}>
          <View style={styles.pedalGrooves}>
            <View style={styles.pedalGrooveLine} />
            <View style={styles.pedalGrooveLine} />
            <View style={styles.pedalGrooveLine} />
          </View>
          <Text style={styles.brakePedalText}>🛑 BRAKE</Text>
          <Text style={styles.pedalSubtext}>STOP</Text>
        </TouchableOpacity>

        {/* Center: Left & Right Track Steer Buttons */}
        <View style={styles.steeringGroup}>
          <TouchableOpacity
            style={styles.steerCircle}
            activeOpacity={0.6}
            onPress={() => shiftLane(playerLaneRef.current - 1)}>
            <Text style={styles.steerArrow}>◀</Text>
            <Text style={styles.steerSubtext}>TRACK</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.steerCircle}
            activeOpacity={0.6}
            onPress={() => shiftLane(playerLaneRef.current + 1)}>
            <Text style={styles.steerArrow}>▶</Text>
            <Text style={styles.steerSubtext}>TRACK</Text>
          </TouchableOpacity>
        </View>

        {/* Right: Dash Boost Pedal */}
        <TouchableOpacity
          style={[
            styles.pedalButton,
            styles.dashPedal,
            isNitro && styles.dashPedalActive,
            nitroFuel <= 5 && styles.dashPedalDisabled,
          ]}
          activeOpacity={0.7}
          onPressIn={handleNitroPressIn}
          onPressOut={handleNitroPressOut}>
          <View style={styles.pedalGrooves}>
            <View style={styles.pedalGrooveLineCyan} />
            <View style={styles.pedalGrooveLineCyan} />
            <View style={styles.pedalGrooveLineCyan} />
          </View>
          <Text style={styles.dashPedalText}>⚡ DASH</Text>
          <Text style={styles.pedalSubtextCyan}>BOOST</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  accidentFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 23, 68, 0.35)',
    zIndex: 99,
  },
  blastScreenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 61, 0, 0.48)',
    zIndex: 98,
  },
  blastContainer: {
    position: 'absolute',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  blastRingOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF3D00',
    backgroundColor: 'rgba(255, 61, 0, 0.25)',
  },
  blastRingMid: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD600',
    backgroundColor: 'rgba(255, 214, 0, 0.35)',
  },
  blastCoreFireball: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF1744',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  blastEmoji: {
    fontSize: 32,
  },
  blastSpark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF59D',
  },
  spark1: { top: 8, left: 16 },
  spark2: { top: 12, right: 18 },
  spark3: { bottom: 10, left: 22 },
  spark4: { bottom: 14, right: 16 },
  roadFogOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'space-around',
  },
  roadFogBandTop: {
    width: '100%',
    height: '28%',
    backgroundColor: 'rgba(200, 215, 230, 0.35)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  roadFogBandMiddle: {
    width: '100%',
    height: '35%',
    backgroundColor: 'rgba(220, 230, 245, 0.45)',
    borderRadius: 40,
  },
  roadFogBandBottom: {
    width: '100%',
    height: '25%',
    backgroundColor: 'rgba(180, 195, 210, 0.38)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  smashedFogCluster: {
    position: 'absolute',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fogCloud: {
    position: 'absolute',
    borderRadius: 50,
  },
  fogCloud1: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(230, 235, 245, 0.78)',
    top: -25,
    left: 10,
  },
  fogCloud2: {
    width: 85,
    height: 85,
    backgroundColor: 'rgba(160, 175, 195, 0.72)',
    top: -40,
    left: 45,
  },
  fogCloud3: {
    width: 65,
    height: 65,
    backgroundColor: 'rgba(210, 220, 230, 0.68)',
    top: 20,
    left: 15,
  },
  fogCloud4: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(120, 135, 150, 0.75)',
    top: -10,
    left: 30,
  },
  fogCloud5: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(80, 90, 100, 0.62)',
    top: 35,
    left: 45,
  },
  fogCloud6: {
    width: 75,
    height: 75,
    backgroundColor: 'rgba(240, 245, 255, 0.72)',
    top: -50,
    left: 20,
  },
  fogEmberCore: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF5722',
    shadowColor: '#FF3D00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  road: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.roadAsphalt,
    overflow: 'hidden',
  },
  curbLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 8,
    flexDirection: 'column',
  },
  curbRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 8,
    flexDirection: 'column',
  },
  curbStripe: {
    width: 8,
    height: 48,
  },
  curbRed: {
    backgroundColor: '#E53935',
  },
  curbWhite: {
    backgroundColor: '#FFFFFF',
  },
  laneDivider: {
    position: 'absolute',
    width: 4,
    height: SCREEN_HEIGHT * 2,
  },
  stripe: {
    width: 4,
    height: ROAD_CONFIG.STRIPE_HEIGHT,
    backgroundColor: colors.roadStripe,
    marginBottom: ROAD_CONFIG.STRIPE_GAP,
    borderRadius: 2,
  },
  skidMark: {
    position: 'absolute',
    width: 7,
    height: 18,
    backgroundColor: '#0A0D12',
    borderRadius: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#161B22',
  },
  warpStreak: {
    position: 'absolute',
    width: 3,
    backgroundColor: colors.nitro,
    borderRadius: 1.5,
    shadowColor: colors.nitro,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  playerCarWrapper: {
    position: 'absolute',
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headlightBeams: {
    position: 'absolute',
    top: -110,
    width: 46,
    height: 110,
    backgroundColor: 'rgba(255, 248, 220, 0.08)',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  shieldHalo: {
    position: 'absolute',
    width: PLAYER_WIDTH + 24,
    height: PLAYER_HEIGHT + 24,
    borderRadius: (PLAYER_HEIGHT + 24) / 2,
    borderWidth: 2,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  magnetHalo: {
    position: 'absolute',
    width: PLAYER_WIDTH + 34,
    height: PLAYER_HEIGHT + 34,
    borderRadius: (PLAYER_HEIGHT + 34) / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.09)',
  },
  brakeRoadGlow: {
    position: 'absolute',
    bottom: -22,
    width: PLAYER_WIDTH + 14,
    height: 32,
    backgroundColor: 'rgba(255, 23, 68, 0.28)',
    borderRadius: 16,
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  trafficCarWrapper: {
    position: 'absolute',
    width: 46,
    height: 82,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinItem: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 22,
  },
  powerupItem: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  powerupIcon: {
    fontSize: 18,
  },
  healthItemCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(27, 94, 32, 0.92)',
    shadowColor: '#4CAF50',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 9,
  },
  healthPackIcon: {
    fontSize: 16,
  },
  healthPackSub: {
    position: 'absolute',
    bottom: -9,
    fontSize: 7,
    fontWeight: '900',
    color: '#4CAF50',
    backgroundColor: '#0D1117',
    paddingHorizontal: 3,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  notificationBubble: {
    position: 'absolute',
    top: 108,
    alignSelf: 'center',
    backgroundColor: 'rgba(13, 17, 23, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationText: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  comboBanner: {
    position: 'absolute',
    top: 142,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 110, 0, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFA000',
    shadowColor: '#FF6E00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  comboBannerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  countdownOverlay: {
    position: 'absolute',
    top: '36%',
    alignSelf: 'center',
    backgroundColor: 'rgba(13, 17, 23, 0.88)',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  countdownBigText: {
    fontSize: 52,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  countdownNumText: {
    color: colors.accent,
  },
  countdownGoText: {
    color: colors.success,
  },
  // Cockpit Dashboard Cluster
  dashboardContainer: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
  },
  dashCluster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearBadge: {
    backgroundColor: '#0D1117',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  gearLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  gearValue: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.accent,
  },
  gearValueTurbo: {
    color: colors.nitro,
  },
  speedCol: {
    alignItems: 'flex-start',
  },
  speedNum: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  speedNumNitro: {
    color: colors.nitro,
  },
  speedUnit: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dashCenter: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 1,
    marginRight: 6,
  },
  timerBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.accent,
  },
  timerWarning: {
    color: colors.danger,
  },
  dashRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinPill: {
    backgroundColor: '#0D1117',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  coinPillText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 12,
  },
  pauseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseCircleText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  healthContainer: {
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 5,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  healthLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  healthPercent: {
    fontSize: 9,
    fontWeight: '900',
  },
  healthPercentGood: {
    color: '#4CAF50',
  },
  healthPercentWarn: {
    color: '#FFB300',
  },
  healthPercentDanger: {
    color: '#FF1744',
  },
  healthBarBg: {
    height: 5,
    backgroundColor: '#0D1117',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthFillGood: {
    backgroundColor: '#4CAF50',
  },
  healthFillWarn: {
    backgroundColor: '#FFB300',
  },
  healthFillDanger: {
    backgroundColor: '#FF1744',
  },
  tachometerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rpmContainer: {
    flex: 1.1,
    backgroundColor: 'rgba(22, 27, 34, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  rpmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  rpmLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  rpmValue: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  rpmRedline: {
    color: colors.danger,
  },
  rpmBarBg: {
    flexDirection: 'row',
    height: 5,
    backgroundColor: '#0D1117',
    borderRadius: 3,
    padding: 1,
    justifyContent: 'space-between',
  },
  rpmSegment: {
    flex: 1,
    marginHorizontal: 0.5,
    backgroundColor: '#21262D',
    borderRadius: 1,
  },
  rpmSegGreen: {
    backgroundColor: '#4CAF50',
  },
  rpmSegYellow: {
    backgroundColor: '#FFEB3B',
  },
  rpmSegRed: {
    backgroundColor: '#FF1744',
  },
  dashFuelContainer: {
    flex: 0.9,
    backgroundColor: 'rgba(22, 27, 34, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashFuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  dashFuelLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.nitro,
    letterSpacing: 0.8,
  },
  dashFuelPercent: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  dashFuelPercentActive: {
    color: colors.nitro,
  },
  dashFuelBg: {
    height: 5,
    backgroundColor: '#0D1117',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dashFuelFill: {
    height: '100%',
    backgroundColor: colors.nitro,
    borderRadius: 3,
  },
  dashFuelFillPulsing: {
    backgroundColor: '#FFFFFF',
    shadowColor: colors.nitro,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  buffsRow: {
    position: 'absolute',
    top: 96,
    left: 14,
    flexDirection: 'row',
  },
  buffBadge: {
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginRight: 6,
  },
  buffText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondary,
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 22,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pedalButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  brakePedal: {
    backgroundColor: 'rgba(183, 28, 28, 0.88)',
    borderWidth: 2,
    borderColor: '#E53935',
  },
  brakePedalActive: {
    backgroundColor: '#D32F2F',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  pedalGrooves: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pedalGrooveLine: {
    width: 3,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  pedalGrooveLineCyan: {
    width: 3,
    height: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  brakePedalText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  pedalSubtext: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  steeringGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  steerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginHorizontal: 5,
  },
  steerArrow: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  steerSubtext: {
    fontSize: 6.5,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  dashPedal: {
    backgroundColor: 'rgba(0, 151, 167, 0.88)',
    borderWidth: 2,
    borderColor: colors.nitro,
  },
  dashPedalActive: {
    backgroundColor: colors.nitro,
    shadowColor: colors.nitro,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  dashPedalDisabled: {
    opacity: 0.4,
  },
  dashPedalText: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  pedalSubtextCyan: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});

export default GameScreen;

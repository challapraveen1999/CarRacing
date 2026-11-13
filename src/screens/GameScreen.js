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
  Modal,
  BackHandler,
  ScrollView,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import {
  CAR_CONFIG,
  ROAD_CONFIG,
  BOOST_CONFIG,
  GAME_MODES,
  POWERUPS,
  STORAGE_KEYS,
  NEAR_MISS,
  COIN_CONFIG,
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
  playHealthSound,
  playCrashSound,
  playAccidentSound,
  playCollisionSound,
  playHonkSound,
  playCoinSound,
  playCoinVoice,
  playCountdownSound,
  playStartSound,
  playBoostSound,
  stopBoostSound,
  playMusic,
  stopMusic,
  pauseMusic,
  startEngineLoop,
  stopEngineLoop,
  updateMovingSpeed,
  stopAll,
  setDrivingActive,
  stopDrivingSounds,
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
const MIN_PLAYER_X = 10;
const MAX_PLAYER_X = ROAD_WIDTH - PLAYER_WIDTH - 10;
const INITIAL_PLAYER_X = (ROAD_WIDTH - PLAYER_WIDTH) / 2;

const formatSurvivalTime = totalSecs => {
  const mins = Math.floor((totalSecs || 0) / 60);
  const secs = (totalSecs || 0) % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
  const [shieldTimeRemaining, setShieldTimeRemaining] = useState(0);
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
  const [isAccidentFlashing, setIsAccidentFlashing] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [isBlast, setIsBlast] = useState(false);
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);
  const [gameOverData, setGameOverData] = useState({
    score: 0,
    distance: 0,
    coinsCollected: 0,
    isNewHighScore: false,
    isNewBestDist: false,
    bestScore: 0,
    bestDistance: 0,
    totalCoins: 0,
  });
  const crashAnim = useRef(new Animated.Value(0)).current;
  const fogAnim = useRef(new Animated.Value(0)).current;
  const blastAnim = useRef(new Animated.Value(0)).current;

  // Real Moving Smoke Plume & Blast Pulse Animations
  const smokePuffAnim1 = useRef(new Animated.Value(0)).current;
  const smokePuffAnim2 = useRef(new Animated.Value(0)).current;
  const smokePuffAnim3 = useRef(new Animated.Value(0)).current;
  const blastWavePulse = useRef(new Animated.Value(0)).current;

  // Break & Dash Visual Systems
  const [skidMarks, setSkidMarks] = useState([]);
  const [comboCount, setComboCount] = useState(1);
  const [comboActive, setComboActive] = useState(false);

  // Animated Lane Transitions & Tilting (Continuous Free-Steering System)
  const playerLaneRef = useRef(1); // 0: left, 1: center, 2: right (legacy compatibility)
  const playerXRef = useRef(INITIAL_PLAYER_X);
  const playerXAnim = useRef(new Animated.Value(INITIAL_PLAYER_X)).current;
  const playerTiltAnim = useRef(new Animated.Value(0)).current; // dynamic car steering tilt

  // Continuous Finger Drag Touch Refs
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const carStartXRef = useRef(INITIAL_PLAYER_X);
  const isDraggingRef = useRef(false);

  // Survival Clock System
  const [survivalSeconds, setSurvivalSeconds] = useState(0);
  const survivalTimeRef = useRef(0);
  const lastSurvivalSecRef = useRef(0);

  // First 5-10 Seconds Interactive Tutorial Overlay
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialCountdown, setTutorialCountdown] = useState(7);
  const showTutorialRef = useRef(true);
  const tutorialHandAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Road Stripe Animation
  const [roadOffset, setRoadOffset] = useState(0);

  // Entities in race (State for React rendering + Refs for synchronous 60 FPS physics)
  const [obstacles, setObstacles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [powerupItems, setPowerupItems] = useState([]);
  const [launchedVehicles, setLaunchedVehicles] = useState([]);
  const obstaclesRef = useRef([]);
  const coinsRef = useRef([]);
  const powerupItemsRef = useRef([]);
  const launchedVehiclesRef = useRef([]);
  const safeHitCounterRef = useRef(0);
  const playerHopAnim = useRef(new Animated.Value(1)).current;
  const shieldBurstAnim = useRef(new Animated.Value(0)).current;
  const shiftLaneRef = useRef(null);
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
  const countdownTimersRef = useRef([]);

  // Load Selected Car from storage and run 3, 2, 1, GO sound flow
  useEffect(() => {
    const currentGameState = stateRef.current;
    getItem(STORAGE_KEYS.SELECTED_CAR, 'car_01').then(carId => {
      setSelectedCar(getCarById(carId));
    });

    // Ensure driving audio is blocked during pre-race countdown
    setDrivingActive(false);
    stopDrivingSounds();

    // Play full "3, 2, 1, GO!" voice clip
    playCountdownSound();

    const t1 = setTimeout(() => {
      setCountdownText('2');
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdownText('1');
      playStartSound(); // Ignition revs at 1!
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdownText('GO!');
      setDrivingActive(true); // Car is now actively driving on track!
      startEngineLoop(); // Engine loop takes over cleanly at GO!
      playMusic();
    }, 3000);

    const t4 = setTimeout(() => {
      setIsCountingDown(false);
    }, 4000);

    countdownTimersRef.current = [t1, t2, t3, t4];

    return () => {
      countdownTimersRef.current.forEach(t => clearTimeout(t));
      countdownTimersRef.current = [];
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      setDrivingActive(false);
      stopDrivingSounds();
      stopEngineLoop();
      stopMusic();
      stopAll();
      if (loopIdRef.current) {
        cancelAnimationFrame(loopIdRef.current);
      }

      // Progress safeguard on unmount
      const finalScore = currentGameState.score || 0;
      const finalDistance = Math.floor(currentGameState.distance || 0);
      const finalCoins = currentGameState.coinsCollected || 0;
      if (!isGameOverProcessedRef.current && (finalScore > 0 || finalDistance > 0 || finalCoins > 0)) {
        isGameOverProcessedRef.current = true;
        recordRaceResult({
          score: finalScore,
          distance: finalDistance,
          coinsEarned: finalCoins,
        }).catch(() => { });
      }
    };
  }, []);

  // First 5-10 Seconds Interactive Tutorial Gesture & Auto-Dismiss Timer
  useEffect(() => {
    const handLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tutorialHandAnim, { toValue: { x: 0, y: -26 }, duration: 650, useNativeDriver: true }),
        Animated.timing(tutorialHandAnim, { toValue: { x: 0, y: 26 }, duration: 650, useNativeDriver: true }),
        Animated.timing(tutorialHandAnim, { toValue: { x: -30, y: 0 }, duration: 650, useNativeDriver: true }),
        Animated.timing(tutorialHandAnim, { toValue: { x: 30, y: 0 }, duration: 650, useNativeDriver: true }),
        Animated.timing(tutorialHandAnim, { toValue: { x: 0, y: 0 }, duration: 450, useNativeDriver: true }),
      ]),
    );
    handLoop.start();

    const tInterval = setInterval(() => {
      setTutorialCountdown(prev => {
        if (prev <= 1) {
          clearInterval(tInterval);
          setShowTutorial(false);
          showTutorialRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      handLoop.stop();
      clearInterval(tInterval);
    };
  }, [tutorialHandAnim]);

  const handleSkipTutorial = useCallback(() => {
    playEffect('button');
    setShowTutorial(false);
    showTutorialRef.current = false;
  }, []);

  // Real Moving Smoke Plume & Blast Animation Loop (runs dynamically on crash)
  useEffect(() => {
    if (isCrashed) {
      const loopSmoke1 = Animated.loop(
        Animated.sequence([
          Animated.timing(smokePuffAnim1, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(smokePuffAnim1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      const loopSmoke2 = Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(smokePuffAnim2, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(smokePuffAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      const loopSmoke3 = Animated.loop(
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(smokePuffAnim3, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(smokePuffAnim3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      const loopBlast = Animated.loop(
        Animated.sequence([
          Animated.timing(blastWavePulse, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(blastWavePulse, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      );

      loopSmoke1.start();
      loopSmoke2.start();
      loopSmoke3.start();
      loopBlast.start();

      return () => {
        loopSmoke1.stop();
        loopSmoke2.stop();
        loopSmoke3.stop();
        loopBlast.stop();
      };
    }
  }, [isCrashed, smokePuffAnim1, smokePuffAnim2, smokePuffAnim3, blastWavePulse]);

  // Center or reposition vehicle smoothly (used on reset)
  const shiftLane = useCallback((targetLane) => {
    if (stateRef.current.isGameOver || stateRef.current.isPaused) return;
    const clampedLane = Math.max(0, Math.min(LANE_COUNT - 1, targetLane));
    playerLaneRef.current = clampedLane;
    const targetX = clampedLane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    playerXRef.current = targetX;
    Animated.spring(playerXAnim, {
      toValue: targetX,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [playerXAnim]);

  shiftLaneRef.current = shiftLane;

  // 100% Touch & Drag Driving Control System (Free Track Steering + Gesture Boost/Brake)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (evt) => {
        if (stateRef.current.isGameOver || stateRef.current.isPaused) return;
        touchStartXRef.current = evt.nativeEvent.pageX || 0;
        touchStartYRef.current = evt.nativeEvent.pageY || 0;
        carStartXRef.current = playerXRef.current;
        isDraggingRef.current = true;

        if (showTutorialRef.current) {
          setShowTutorial(false);
          showTutorialRef.current = false;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (stateRef.current.isGameOver || stateRef.current.isPaused) return;
        const { dx, dy } = gestureState;

        // 1. Free Continuous Lateral Steering across entire highway (Left, Right & Diagonals)
        const targetX = Math.max(MIN_PLAYER_X, Math.min(MAX_PLAYER_X, carStartXRef.current + dx * 1.22));
        playerXRef.current = targetX;
        playerXAnim.setValue(targetX);

        // Smooth dynamic car tilt based on lateral velocity
        const targetTilt = Math.max(-14, Math.min(14, dx / 8));
        playerTiltAnim.setValue(targetTilt);

        // 2. Gesture Acceleration & Braking: Drag UP = Boost / Accelerate, Drag DOWN = Brake / Slow
        if (dy < -22) {
          // Drag UP = Accelerate & Boost
          if (!stateRef.current.isNitro && stateRef.current.nitroFuel > 4) {
            stateRef.current.isNitro = true;
            stateRef.current.isBraking = false;
            setIsNitro(true);
            setIsBraking(false);
            playDash();
            playBoostSound();
          }
        } else if (dy > 22) {
          // Drag DOWN = Brake & Slow down
          if (!stateRef.current.isBraking) {
            stateRef.current.isBraking = true;
            stateRef.current.isNitro = false;
            setIsBraking(true);
            setIsNitro(false);
            stopBoostSound();
            playBrake();
          }
        } else {
          // Neutral Vertical = Cruise speed & naturally recharge boost energy
          if (stateRef.current.isNitro) {
            stateRef.current.isNitro = false;
            setIsNitro(false);
            stopBoostSound();
          }
          if (stateRef.current.isBraking) {
            stateRef.current.isBraking = false;
            setIsBraking(false);
            stopBrake();
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDraggingRef.current = false;
        // Tap Gesture (no drag): Sound Car Horn / Honk!
        const dragDist = Math.hypot(gestureState.dx || 0, gestureState.dy || 0);
        if (dragDist < 12 && !stateRef.current.isGameOver && !stateRef.current.isPaused) {
          playHonkSound();
          triggerNotification('🎺 BEEP BEEP!', '#FFD700');
        }
        if (stateRef.current.isNitro) {
          stateRef.current.isNitro = false;
          setIsNitro(false);
          stopBoostSound();
        }
        if (stateRef.current.isBraking) {
          stateRef.current.isBraking = false;
          setIsBraking(false);
          stopBrake();
        }
        Animated.spring(playerTiltAnim, {
          toValue: 0,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        if (stateRef.current.isNitro) {
          stateRef.current.isNitro = false;
          setIsNitro(false);
          stopBoostSound();
        }
        if (stateRef.current.isBraking) {
          stateRef.current.isBraking = false;
          setIsBraking(false);
          stopBrake();
        }
        playerTiltAnim.setValue(0);
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

  // Safe Zone Collision: Player Car Shockwave Hop & Kinetic Pulse
  const triggerPlayerRamHop = useCallback(() => {
    Animated.sequence([
      Animated.timing(playerHopAnim, {
        toValue: 1.18,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.spring(playerHopAnim, {
        toValue: 1.0,
        friction: 4,
        tension: 130,
        useNativeDriver: true,
      }),
    ]).start();

    shieldBurstAnim.setValue(0);
    Animated.timing(shieldBurstAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [playerHopAnim, shieldBurstAnim]);

  // Temporary Notification Banner (Near miss, Shield, Checkpoint)
  const triggerNotification = (text, color = colors.secondary) => {
    setFloatingNotification({ text, color });
    setTimeout(() => {
      setFloatingNotification(null);
    }, 1200);
  };

  // Crash / Game Over sequence with Explosive Car Blast & Fog Effects
  const handleGameOver = useCallback(async () => {
    if (isGameOverProcessedRef.current) return;
    isGameOverProcessedRef.current = true;
    stateRef.current.isGameOver = true;
    stateRef.current.speed = 0;
    setHudSpeed(0);
    setIsBlast(true);
    setIsCrashed(true);
    setIsSmashed(true);

    // Cancel all queued countdown & combo timers immediately
    countdownTimersRef.current.forEach(t => clearTimeout(t));
    countdownTimersRef.current = [];
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    // Hard-deactivate driving mode and immediately silence all driving sounds
    setDrivingActive(false);
    stopDrivingSounds();
    stopEngineLoop();
    stopMusic();
    stopBoostSound();
    stopBrake();

    // Trigger one-shot crash blast sound for impact feedback
    playCrashSound();
    triggerNotification('💥 CAR BLASTED! GAME OVER! 💥', colors.danger);

    // Hard-stop the requestAnimationFrame game loop immediately
    if (loopIdRef.current) {
      cancelAnimationFrame(loopIdRef.current);
      loopIdRef.current = null;
    }

    // Explosive Fireball Blast & Crash Animation
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

    // Use current state or HUD state to guarantee non-zero metrics
    const finalScore = stateRef.current.score || hudScore || 0;
    const finalDistance = Math.floor(stateRef.current.distance || hudDistance || 0);
    const finalCoins = stateRef.current.coinsCollected || hudCoins || 0;

    // IMMEDIATE SYNCHRONOUS ASYNCSTORAGE SAVE
    try {
      const result = await recordRaceResult({
        score: finalScore,
        distance: finalDistance,
        coinsEarned: finalCoins,
      });

      setGameOverData({
        score: finalScore,
        distance: finalDistance,
        coinsCollected: finalCoins,
        isNewHighScore: Boolean(result?.isNewHighScore),
        isNewBestDist: Boolean(result?.isNewBestDist),
        bestScore: result?.bestScore ?? finalScore,
        bestDistance: result?.bestDistance ?? finalDistance,
        totalCoins: result?.totalCoins ?? finalCoins,
      });

      if (result?.isNewHighScore || result?.isNewBestDist) {
        playEffect('unlock');
      }
    } catch (err) {
      console.warn('Error recording race result on crash:', err);
      setGameOverData({
        score: finalScore,
        distance: finalDistance,
        coinsCollected: finalCoins,
        isNewHighScore: false,
        isNewBestDist: false,
        bestScore: finalScore,
        bestDistance: finalDistance,
        totalCoins: finalCoins,
      });
    }

    // Present user-friendly on-track Game Over Modal
    setTimeout(() => {
      setShowGameOverOverlay(true);
    }, 600);
  }, [blastAnim, crashAnim, fogAnim, hudDistance, hudScore, hudCoins]);

  // Restart game directly on the road track
  const handleRestartGame = useCallback(() => {
    playEffect('button');
    setShowGameOverOverlay(false);
    countdownTimersRef.current.forEach(t => clearTimeout(t));
    countdownTimersRef.current = [];
    setDrivingActive(false);
    stopDrivingSounds();
    stopAll();
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
    stateRef.current.speed = CAR_CONFIG.BASE_SPEED * modeConfig.speedMultiplier;
    stateRef.current.timeRemaining = modeConfig.timeLimit;
    setIsPaused(false);
    setIsCrashed(false);
    setIsBlast(false);
    setIsDamaged(false);
    setIsSmashed(false);
    setHudHealth(100);
    setHudScore(0);
    setHudDistance(0);
    setHudCoins(0);
    setNitroFuel(100);
    crashAnim.setValue(0);
    fogAnim.setValue(0);
    blastAnim.setValue(0);
    smokePuffAnim1.setValue(0);
    smokePuffAnim2.setValue(0);
    smokePuffAnim3.setValue(0);
    blastWavePulse.setValue(0);
    isGameOverProcessedRef.current = false;
    obstaclesRef.current = [];
    coinsRef.current = [];
    powerupItemsRef.current = [];
    launchedVehiclesRef.current = [];
    safeHitCounterRef.current = 0;
    survivalTimeRef.current = 0;
    setSurvivalSeconds(0);
    setShowTutorial(false);
    showTutorialRef.current = false;
    setObstacles([]);
    setCoins([]);
    setPowerupItems([]);
    setLaunchedVehicles([]);
    setSkidMarks([]);
    playerXRef.current = INITIAL_PLAYER_X;
    playerXAnim.setValue(INITIAL_PLAYER_X);
    playerTiltAnim.setValue(0);
    lastTimeRef.current = null;

    // Start 3-2-1-GO flow on the road track
    countdownTimersRef.current.forEach(t => clearTimeout(t));
    setIsCountingDown(true);
    setCountdownText('3');
    playCountdownSound();

    const rt1 = setTimeout(() => setCountdownText('2'), 1000);
    const rt2 = setTimeout(() => {
      setCountdownText('1');
      playStartSound(); // Ignition revs at 1!
    }, 2000);
    const rt3 = setTimeout(() => {
      setCountdownText('GO!');
      setDrivingActive(true); // Car is now actively driving on track!
      startEngineLoop(); // Clean engine takeover at GO!
      playMusic();
    }, 3000);
    const rt4 = setTimeout(() => setIsCountingDown(false), 4000);
    countdownTimersRef.current = [rt1, rt2, rt3, rt4];
  }, [
    modeConfig,
    crashAnim,
    fogAnim,
    blastAnim,
    blastWavePulse,
    smokePuffAnim1,
    smokePuffAnim2,
    smokePuffAnim3,
    playerTiltAnim,
    playerXAnim,
  ]);

  // Pause Drive Mode and display in-game popup modal
  const handlePauseGame = useCallback(() => {
    if (stateRef.current.isGameOver) return;
    playEffect('button');
    stateRef.current.isPaused = true;
    setIsPaused(true);
    countdownTimersRef.current.forEach(t => clearTimeout(t));
    countdownTimersRef.current = [];
    setDrivingActive(false);
    stopDrivingSounds();
    stopEngineLoop();
    pauseMusic();
    stopBoostSound();
    stopBrake();
  }, []);

  // Continue / Resume Drive Mode
  const handleResumeGame = useCallback(() => {
    playEffect('button');
    stateRef.current.isPaused = false;
    setIsPaused(false);
    lastTimeRef.current = null;
    if (!isCountingDown) {
      setDrivingActive(true);
      startEngineLoop();
      playMusic();
    }
  }, [isCountingDown]);

  // Restart Race from Pause Modal
  const handleRestartFromPause = useCallback(() => {
    setIsPaused(false);
    stateRef.current.isPaused = false;
    setDrivingActive(false);
    stopDrivingSounds();
    stopEngineLoop();
    stopMusic();
    stopAll();
    handleRestartGame();
  }, [handleRestartGame]);

  // Back to Home from Pause Modal
  const handleHomeFromPause = useCallback(async () => {
    playEffect('button');
    setIsPaused(false);
    stateRef.current.isPaused = false;
    countdownTimersRef.current.forEach(t => clearTimeout(t));
    countdownTimersRef.current = [];
    setDrivingActive(false);
    stopDrivingSounds();
    stopEngineLoop();
    stopMusic();
    stopAll();

    const finalCoins = stateRef.current.coinsCollected || hudCoins || 0;
    const finalScore = stateRef.current.score || hudScore || 0;
    const finalDistance = Math.floor(stateRef.current.distance || hudDistance || 0);

    if (!isGameOverProcessedRef.current && (finalCoins > 0 || finalScore > 0 || finalDistance > 0)) {
      isGameOverProcessedRef.current = true;
      try {
        await recordRaceResult({
          score: finalScore,
          distance: finalDistance,
          coinsEarned: finalCoins,
        });
      } catch (e) {
        console.warn('Error saving race result on Home nav:', e);
      }
    }
    navigation.navigate('Home');
  }, [hudCoins, hudScore, hudDistance, navigation]);

  // Intercept back option in app and hardware/gesture navigation
  useEffect(() => {
    const onBackPress = () => {
      // 1. If Game Over overlay is active, save stats and go Home
      if (stateRef.current.isGameOver || showGameOverOverlay) {
        (async () => {
          const finalScore = stateRef.current.score || hudScore || 0;
          const finalDistance = Math.floor(stateRef.current.distance || hudDistance || 0);
          const finalCoins = stateRef.current.coinsCollected || hudCoins || 0;
          if (!isGameOverProcessedRef.current && (finalScore > 0 || finalDistance > 0 || finalCoins > 0)) {
            isGameOverProcessedRef.current = true;
            try {
              await recordRaceResult({
                score: finalScore,
                distance: finalDistance,
                coinsEarned: finalCoins,
              });
            } catch (e) {
              console.warn('Error saving race result on back press:', e);
            }
          }
          setDrivingActive(false);
          stopDrivingSounds();
          stopEngineLoop();
          stopMusic();
          stopAll();
          setShowGameOverOverlay(false);
          navigation.navigate('Home');
        })();
        return true;
      }

      // 2. If Pause Modal is already open, resume drive mode (Continue)
      if (stateRef.current.isPaused || isPaused) {
        handleResumeGame();
        return true;
      }

      // 3. During active Drive Mode: Pause the game, stop driving sounds, and show the Pause Modal!
      handlePauseGame();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation, showGameOverOverlay, isPaused, hudScore, hudDistance, hudCoins, handlePauseGame, handleResumeGame]);

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

      // 1. Calculate Player Speed & Boost Energy (Drag UP: Accelerate & Boost, Drag DOWN: Brake, Neutral: Cruise)
      let targetSpeed = BOOST_CONFIG.CRUISE_SPEED * modeConfig.speedMultiplier;

      if (state.isNitro && state.nitroFuel > 0) {
        targetSpeed = BOOST_CONFIG.MAX_BOOST_SPEED;
        state.nitroFuel = Math.max(0, state.nitroFuel - BOOST_CONFIG.CONSUMPTION_RATE * delta);
        if (state.nitroFuel <= 2) {
          state.isNitro = false;
          setIsNitro(false);
          stopBoostSound();
        }
      } else if (state.isBraking) {
        targetSpeed = BOOST_CONFIG.MIN_BRAKE_SPEED;
      } else {
        // Naturally recharge boost energy when not boosting
        state.nitroFuel = Math.min(100, state.nitroFuel + BOOST_CONFIG.RECHARGE_RATE * delta);
      }

      state.speed = targetSpeed;

      // Survival Timer Counter
      survivalTimeRef.current += delta;
      const currentSurvivalSecs = Math.floor(survivalTimeRef.current);
      if (currentSurvivalSecs !== lastSurvivalSecRef.current) {
        lastSurvivalSecRef.current = currentSurvivalSecs;
        setSurvivalSeconds(currentSurvivalSecs);
      }

      // 2. Distance & Road Scrolling
      const metersThisTick = (state.speed * delta) / 3.6;
      state.distance += metersThisTick;
      setRoadOffset(prev => (prev + state.speed * delta) % 80);

      // 4. Asphalt Tire Skid Marks Generation (when braking)
      if (state.isBraking && !state.isGameOver) {
        timeSinceSkid.current += delta;
        if (timeSinceSkid.current >= 0.045) {
          timeSinceSkid.current = 0;
          const currentCarX = ROAD_LEFT + playerXRef.current;
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

      // 5. Time Attack Checkpoints
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

      // 6. Active Buff Timers
      if (state.shield) {
        state.shieldTimer -= delta;
        setShieldTimeRemaining(Math.max(0, Math.ceil(state.shieldTimer)));
        if (state.shieldTimer <= 0) {
          state.shield = false;
          setActiveShield(false);
          setShieldTimeRemaining(0);
          state.invulnerableTimer = 2.5; // 2.5s extended grace recovery window after safe mode expires
          triggerNotification('🛡️ SAFE MODE EXPIRED (GRACE SHIELD ON)', colors.warning);
        }
      }

      if (state.magnet) {
        state.magnetTimer -= delta;
        if (state.magnetTimer <= 0) {
          state.magnet = false;
          setActiveMagnet(false);
        }
      }

      // 7. Spawn Dynamic Opponent Traffic across entire track with AI
      timeSinceObstacle.current += delta;
      const survivalDensity = Math.min(0.65, (survivalTimeRef.current / 120) * 0.65);
      const dynamicSpawnRate = Math.max(0.65, 1.55 - survivalDensity);
      if (timeSinceObstacle.current > dynamicSpawnRate) {
        timeSinceObstacle.current = 0;
        const trafficColors = [colors.danger, colors.warning, '#9C27B0', '#FF9800', '#4CAF50', '#00BCD4', '#E91E63', '#3F51B5'];
        const randomColor = trafficColors[Math.floor(Math.random() * trafficColors.length)];

        // Traffic variety: Sports Cars, Nimble Motorbikes, Delivery Vans, Cargo Trucks, Transit Buses
        const vehicleTypes = ['sports', 'sports', 'bike', 'van', 'truck', 'bus'];
        const chosenType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        let width = 46;
        let height = 82;
        let vehicleImage = null;
        if (chosenType === 'bike') {
          width = 36;
          height = 72;
          vehicleImage = require('../assets/bike.png');
        } else if (chosenType === 'truck') {
          width = 48;
          height = 110;
          vehicleImage = require('../assets/truck.png');
        } else if (chosenType === 'van') {
          width = 48;
          height = 88;
        } else if (chosenType === 'bus') {
          width = 50;
          height = 114;
        } else if (chosenType === 'sports') {
          const sportsImages = [
            require('../assets/blue-car.png'),
            require('../assets/yellow-car.png'),
            require('../assets/white-car.png'),
            require('../assets/red-car.png'),
          ];
          vehicleImage = sportsImages[Math.floor(Math.random() * sportsImages.length)];
        }

        // Discrete Lane Spawning (Lane 0, 1, 2, or 3) - Traffic vehicles follow strict lane discipline
        const spawnLane = Math.floor(Math.random() * LANE_COUNT);
        const laneCenterX = spawnLane * LANE_WIDTH + (LANE_WIDTH - width) / 2;

        // Occasional single lane switch setup (~15% chance for 1 or 2 cars/bikes to switch lanes once)
        const willSwitchLane = Math.random() < 0.15;
        let targetLane = spawnLane;
        if (willSwitchLane) {
          if (spawnLane === 0) targetLane = 1;
          else if (spawnLane === LANE_COUNT - 1) targetLane = LANE_COUNT - 2;
          else targetLane = Math.random() < 0.5 ? spawnLane - 1 : spawnLane + 1;
        }
        const targetLaneX = targetLane * LANE_WIDTH + (LANE_WIDTH - width) / 2;

        obstaclesRef.current.push({
          id: nextId.current++,
          x: laneCenterX,
          y: -130,
          color: randomColor,
          vehicleType: chosenType,
          image: vehicleImage,
          width,
          height,
          lane: spawnLane,
          willSwitchLane,
          targetLane,
          targetLaneX,
          switchAtY: Math.random() * 220 + 70,
          hasSwitched: false,
          speedMult: chosenType === 'bike' ? 1.18 : 1.0,
          hasTriggeredNearMiss: false,
        });
      }

      // 8. Spawn Collectible Coins across entire highway
      timeSinceCoin.current += delta;
      if (timeSinceCoin.current > 1.7) {
        timeSinceCoin.current = 0;
        const coinX = Math.random() * (ROAD_WIDTH - 44) + 12;
        coinsRef.current.push({
          id: nextId.current++,
          x: coinX,
          y: -40,
        });
      }

      // 9. Spawn Powerups & Health Repair Kits across entire highway
      timeSincePowerup.current += delta;
      if (timeSincePowerup.current > 4.2) {
        timeSincePowerup.current = 0;
        const pTypes = state.health < 100
          ? [POWERUPS.HEALTH_PACK, POWERUPS.SHIELD, POWERUPS.HEALTH_PACK, POWERUPS.MAGNET, POWERUPS.NITRO_TANK]
          : [POWERUPS.SHIELD, POWERUPS.MAGNET, POWERUPS.NITRO_TANK, POWERUPS.HEALTH_PACK];
        const randomPower = pTypes[Math.floor(Math.random() * pTypes.length)];
        const powerX = Math.random() * (ROAD_WIDTH - 50) + 12;

        powerupItemsRef.current.push({
          id: nextId.current++,
          x: powerX,
          y: -60,
          def: randomPower,
        });
      }

      // 10. Synchronous Update & Collision of Dynamic Obstacles (AI + Continuous Free Steering)
      const playerX = playerXRef.current;
      const playerRect = {
        x: ROAD_LEFT + playerX,
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
        let obsX = obs.x;
        const obsWidth = obs.width || 46;
        const obsHeight = obs.height || 82;

        // Lane Discipline: Opposite/traffic vehicles stay strictly inside their designated lanes!
        // They do NOT continuously cross lines. Only occasionally (~15% chance, 1 or 2 cars/bikes)
        // a vehicle executes a single smooth lane transition to an adjacent lane and remains there.
        if (obs.willSwitchLane && !obs.hasSwitched && obs.y >= (obs.switchAtY || 100)) {
          const diff = obs.targetLaneX - obsX;
          if (Math.abs(diff) <= 2) {
            obsX = obs.targetLaneX;
            obs.lane = obs.targetLane;
            obs.hasSwitched = true;
          } else {
            obsX += Math.sign(diff) * Math.min(Math.abs(diff), 1.25 * delta * 60);
          }
        }
        // Clamp opponent strictly within playable track boundaries
        obsX = Math.max(10, Math.min(ROAD_WIDTH - obsWidth - 10, obsX));
        obs.x = obsX;

        const nextY = obs.y + state.speed * 1.15 * (obs.speedMult || 1.0) * delta;
        const obsRect = {
          x: ROAD_LEFT + obsX,
          y: nextY,
          width: obsWidth,
          height: obsHeight,
        };

        // Collision Check
        if (checkCollision(playerRect, obsRect, 0.12)) {
          if (state.shield || activeShield) {
            // SAFE MODE ACTIVE: Car health is 100% protected and NEVER decreased!
            // Catapult & launch obstacle airborne, jumping completely out of the track!
            playCollisionSound();
            playDash();

            // Determine sideways launch trajectory: strictly alternate Left (-1) and Right (+1) on each hit!
            safeHitCounterRef.current += 1;
            const isLeft = safeHitCounterRef.current % 2 === 1;
            const launchSide = isLeft ? -1 : 1;
            const launchVx = launchSide * (340 + Math.random() * 120);
            const launchVy = -180 - Math.random() * 100;

            launchedVehiclesRef.current.push({
              id: nextId.current++,
              x: ROAD_LEFT + obsX,
              y: nextY,
              vx: launchVx,
              vy: launchVy,
              rotation: 0,
              rotSpeed: launchSide * (640 + Math.random() * 220),
              scale: 1.0,
              maxLife: 0.95,
              life: 0.95,
              color: obs.color,
              vehicleType: obs.vehicleType || 'sports',
              image: obs.image,
              width: obsWidth,
              height: obsHeight,
            });

            // Player car suspension hop & shield kinetic burst
            triggerPlayerRamHop();

            state.score += 100; // Takedown reward bonus score
            state.nitroFuel = Math.min(100, state.nitroFuel + 15); // Reward +15% nitro fuel
            const label = obs.vehicleType === 'bike' ? '🏍️ MOTORBIKE' : obs.vehicleType === 'truck' ? '🚚 TRUCK' : obs.vehicleType === 'bus' ? '🚌 BUS' : obs.vehicleType === 'van' ? '🚐 VAN' : '🚗 TRAFFIC';
            const directionLabel = isLeft ? 'LEFT ⬅️' : 'RIGHT ➡️';
            triggerNotification(`🛡️ SAFE ZONE PROTECTED! ${label} JUMPED ${directionLabel} OUT OF TRACK! (+100 PTS)`, '#00E5FF');
            continue; // Safely deflect and eliminate obstacle, zero damage to car
          } else if (state.invulnerableTimer > 0) {
            // Post-accident recovery grace window: zero damage
            continue;
          } else {
            // ACCIDENT: Subtract Car Health!
            const hitDamage = 30;
            state.health = Math.max(0, state.health - hitDamage);
            setHudHealth(state.health);

            if (state.health > 0) {
              // Non-fatal accident: damage car, play accident sound, screen flash & jolt
              playAccidentSound();
              setIsDamaged(true);
              state.invulnerableTimer = 1.4;
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
          nextObstacles.push({ ...obs, y: nextY, x: obsX });
        }
      }

      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);

      // Synchronous Update for Airborne Launched Vehicles (Safe Zone Takedown Jump Physics)
      const nextLaunched = [];
      for (const lv of launchedVehiclesRef.current) {
        lv.life -= delta;
        if (lv.life > 0) {
          lv.x += lv.vx * delta;
          lv.y += lv.vy * delta;
          lv.rotation += lv.rotSpeed * delta;
          const progress = 1 - (lv.life / lv.maxLife);
          // Parabolic jump arc: zooms up to 1.7x at apex, casting shadow below, then flies off track
          lv.scale = 1.0 + Math.sin(progress * Math.PI) * 0.7;
          nextLaunched.push(lv);
        }
      }
      launchedVehiclesRef.current = nextLaunched;
      setLaunchedVehicles(nextLaunched);

      // IMMEDIATE GAME OVER WHEN CAR HEALTH IS 0
      if (didCrash || state.health <= 0) {
        handleGameOver();
        return;
      }

      // 11. Update & Collect Coins with continuous coordinates & Magnet Attraction
      const nextCoins = [];
      for (const coin of coinsRef.current) {
        let coinX = coin.x;
        let nextY = coin.y + state.speed * 1.25 * delta;

        // Magnet Attraction
        if (state.magnet) {
          const dx = playerX + PLAYER_WIDTH / 2 - (coinX + 14);
          const dy = PLAYER_Y + PLAYER_HEIGHT / 2 - (nextY + 14);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < (POWERUPS.MAGNET.attractRadius || 180) && dist > 1) {
            coinX += (dx / dist) * 260 * delta;
            nextY += (dy / dist) * 260 * delta;
          }
        }

        const coinRect = {
          x: ROAD_LEFT + coinX,
          y: nextY,
          width: 28,
          height: 28,
        };

        if (checkCoinCollection(playerRect, coinRect)) {
          playCoinSound();
          playCoinVoice();
          const earned = COIN_CONFIG.VALUE || 100;
          state.coinsCollected += earned;
          state.nitroFuel = Math.min(100, state.nitroFuel + 2);
          triggerCombo();
          triggerNotification(`🗣️ "COIN COLLECTED!" +${earned}`, colors.accent);
        } else if (nextY < SCREEN_HEIGHT + 60) {
          nextCoins.push({ ...coin, x: coinX, y: nextY });
        }
      }
      coinsRef.current = nextCoins;
      setCoins(nextCoins);

      // 12. Update & Collect Powerup Items and Revive Health Points
      const nextPowerups = [];
      for (const item of powerupItemsRef.current) {
        const nextY = item.y + state.speed * 1.15 * delta;
        const itemRect = {
          x: ROAD_LEFT + item.x,
          y: nextY,
          width: 36,
          height: 36,
        };

        if (checkCollision(playerRect, itemRect, 0.05)) {
          if (item.def.id === 'health_pack') {
            // Restore Health Points with distinct health collection audio!
            playHealthSound();
            const heal = item.def.healAmount || 35;
            state.health = Math.min(100, state.health + heal);
            setHudHealth(state.health);
            if (state.health >= 70) {
              setIsDamaged(false);
            }
            triggerNotification(`❤️ HEALTH REPAIRED! +${heal} HP (${state.health}%)`, '#4CAF50');
          } else {
            playEffect('unlock');
          }
          if (item.def.id === 'shield') {
            state.shield = true;
            const shieldDur = item.def.duration || 10;
            state.shieldTimer = shieldDur;
            setActiveShield(true);
            setShieldTimeRemaining(shieldDur);
            triggerNotification(`🛡️ SAFE MODE ACTIVATED! (${shieldDur}s)`, colors.secondary);
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
  }, [isPaused, modeConfig, handleGameOver, isCountingDown, triggerCombo, triggerPlayerRamHop, playerTiltAnim, activeShield]);

  const interpolatedTilt = playerTiltAnim.interpolate({
    inputRange: [-12, 12],
    outputRange: ['-12deg', '12deg'],
  });

  const interpolatedCrashSpin = crashAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '45deg', '140deg'],
  });

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

      {/* Highway Road Canvas */}
      <View style={[styles.road, { width: ROAD_WIDTH, left: ROAD_LEFT }]}>
        {/* White & Black Racing Track Dividers / Curbs (Left & Right) */}
        <View style={styles.curbLeft}>
          {Array.from({ length: 24 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.curbStripe,
                (i + Math.floor(roadOffset / 24)) % 2 === 0 ? styles.curbBlack : styles.curbWhite,
              ]}
            />
          ))}
        </View>

        <View style={styles.curbRight}>
          {Array.from({ length: 24 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.curbStripe,
                (i + Math.floor(roadOffset / 24)) % 2 === 0 ? styles.curbBlack : styles.curbWhite,
              ]}
            />
          ))}
        </View>

        {/* Animated Dashed Lane Dividers (Spacious 4-Lane Highway) */}
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

        <View style={[styles.laneDivider, { left: LANE_WIDTH * 3, top: roadOffset - 80 }]}>
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

        {/* Collectible Coins across full track width */}
        {coins.map(c => (
          <View
            key={c.id}
            style={[
              styles.coinItem,
              { left: c.x, top: c.y },
            ]}>
            <Text style={styles.coinEmoji}>🪙</Text>
          </View>
        ))}

        {/* Collectible Power-ups & Review Health Points */}
        {powerupItems.map(p => {
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
                  left: p.x,
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

        {/* Dynamic Opponent Traffic Vehicles across entire track */}
        {obstacles.map(obs => {
          const obsWidth = obs.width || 46;
          const obsHeight = obs.height || 82;
          return (
            <View
              key={obs.id}
              style={[
                styles.trafficCarWrapper,
                {
                  left: obs.x,
                  top: obs.y,
                  width: obsWidth,
                  height: obsHeight,
                },
              ]}>
              <CarSprite
                width={obsWidth}
                height={obsHeight}
                image={obs.image}
                bodyColor={obs.color}
                stripeColor="#21262D"
                roofColor="#0D1117"
                vehicleType={obs.vehicleType || 'sports'}
                showHeadlights={false}
              />
            </View>
          );
        })}

        {/* Airborne Launched Vehicles (Safe Zone Takedown Jump Physics) */}
        {launchedVehicles.map(lv => {
          const shadowOffset = (lv.scale - 1.0) * 38;
          return (
            <React.Fragment key={lv.id}>
              {/* 3D Ground Shadow below jumping vehicle */}
              <View
                style={[
                  styles.launchedVehicleShadow,
                  {
                    left: lv.x + shadowOffset * 0.4,
                    top: lv.y + shadowOffset,
                    width: lv.width * 0.9,
                    height: lv.height * 0.4,
                    opacity: Math.max(0.12, 0.45 - (lv.scale - 1.0) * 0.35),
                  },
                ]}
              />

              {/* Airborne Vehicle: Jumping, Spinning & Flying out of track */}
              <View
                style={[
                  styles.launchedVehicleWrapper,
                  {
                    left: lv.x,
                    top: lv.y,
                    transform: [
                      { scale: lv.scale },
                      { rotate: `${Math.round(lv.rotation)}deg` },
                    ],
                  },
                ]}>
                <View style={styles.launchedSparksAura} />
                <CarSprite
                  width={lv.width}
                  height={lv.height}
                  image={lv.image}
                  bodyColor={lv.color}
                  stripeColor="#FFFFFF"
                  roofColor="#0D1117"
                  vehicleType={lv.vehicleType}
                  showHeadlights={false}
                  isDamaged={true}
                  isSmashed={true}
                />
              </View>
            </React.Fragment>
          );
        })}

        {/* Player Car with Dynamic 3D Ground Shadow, Headlights & Underglow */}
        <Animated.View
          style={[
            styles.playerCarWrapper,
            {
              top: PLAYER_Y,
              transform: [
                { translateX: playerXAnim },
                { rotate: isCrashed ? interpolatedCrashSpin : interpolatedTilt },
                { scale: playerHopAnim },
              ],
            },
          ]}>
          {/* Shield Kinetic Burst Ring on ramming */}
          <Animated.View
            style={[
              styles.shieldBurstRing,
              {
                opacity: shieldBurstAnim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.9, 0],
                }),
                transform: [
                  {
                    scale: shieldBurstAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 2.8],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Shield Forcefield Dome (when safe mode active) */}
          {activeShield && <View style={styles.shieldHalo} />}

          {/* Magnet Field (if active) */}
          {activeMagnet && <View style={styles.magnetHalo} />}

          {/* Brake Light Road Glow (when braking) */}
          {isBraking && !isSmashed && <View style={styles.brakeRoadGlow} />}

          {/* Dynamic 5G/6G Supercar Model */}
          <CarSprite
            width={PLAYER_WIDTH}
            height={PLAYER_HEIGHT}
            image={selectedCar?.image}
            bodyColor={selectedCar.colors.body}
            stripeColor={selectedCar.colors.stripes}
            roofColor={selectedCar.colors.roof}
            isBraking={isBraking}
            isNitro={isNitro}
            isDamaged={isDamaged || hudHealth < 100}
            isSmashed={isSmashed}
            isShielded={activeShield}
            showHeadlights={!isSmashed}
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

          {/* Real Moving Billowing Fog & Smoke Clouds rising from Smashed Engine */}
          {isCrashed && (
            <View style={styles.smashedFogCluster} pointerEvents="none">
              {/* Flickering Fire/Ember glow under hood */}
              <Animated.View
                style={[
                  styles.fireGlowCore,
                  {
                    transform: [
                      {
                        scale: blastWavePulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.85, 1.25],
                        }),
                      },
                    ],
                    opacity: blastWavePulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0.95],
                    }),
                  },
                ]}
              />

              {/* Moving Smoke Puff 1: Billows upwards & drifts left */}
              <Animated.View
                style={[
                  styles.movingSmokePuff,
                  styles.smokePuffColor1,
                  {
                    transform: [
                      {
                        translateY: smokePuffAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -75],
                        }),
                      },
                      {
                        translateX: smokePuffAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -22],
                        }),
                      },
                      {
                        scale: smokePuffAnim1.interpolate({
                          inputRange: [0, 0.3, 1],
                          outputRange: [0.5, 1.2, 2.1],
                        }),
                      },
                    ],
                    opacity: smokePuffAnim1.interpolate({
                      inputRange: [0, 0.2, 0.7, 1],
                      outputRange: [0.3, 0.85, 0.6, 0],
                    }),
                  },
                ]}
              />

              {/* Moving Smoke Puff 2: Billows upwards & drifts right */}
              <Animated.View
                style={[
                  styles.movingSmokePuff,
                  styles.smokePuffColor2,
                  {
                    transform: [
                      {
                        translateY: smokePuffAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -88],
                        }),
                      },
                      {
                        translateX: smokePuffAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 24],
                        }),
                      },
                      {
                        scale: smokePuffAnim2.interpolate({
                          inputRange: [0, 0.35, 1],
                          outputRange: [0.6, 1.4, 2.3],
                        }),
                      },
                    ],
                    opacity: smokePuffAnim2.interpolate({
                      inputRange: [0, 0.2, 0.75, 1],
                      outputRange: [0.35, 0.8, 0.5, 0],
                    }),
                  },
                ]}
              />

              {/* Moving Smoke Puff 3: Large dense plume floating center */}
              <Animated.View
                style={[
                  styles.movingSmokePuff,
                  styles.smokePuffColor3,
                  {
                    transform: [
                      {
                        translateY: smokePuffAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -96],
                        }),
                      },
                      {
                        translateX: smokePuffAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 4],
                        }),
                      },
                      {
                        scale: smokePuffAnim3.interpolate({
                          inputRange: [0, 0.3, 1],
                          outputRange: [0.5, 1.3, 2.4],
                        }),
                      },
                    ],
                    opacity: smokePuffAnim3.interpolate({
                      inputRange: [0, 0.25, 0.8, 1],
                      outputRange: [0.4, 0.9, 0.55, 0],
                    }),
                  },
                ]}
              />
            </View>
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

      {/* Sleek Minimalist Modern 5G/6G HUD Cluster */}
      <View style={styles.modernHudContainer} pointerEvents="box-none">
        {/* Top Control & Metric Cluster */}
        <View style={styles.hudTopCluster}>
          {/* In-App Back Navigation Button */}
          <TouchableOpacity
            style={styles.hudCircleButton}
            activeOpacity={0.7}
            onPress={handlePauseGame}
            accessibilityLabel="Back or Pause">
            <Text style={styles.hudBackIcon}>‹</Text>
          </TouchableOpacity>

          {/* Car Health Bar */}
          <View style={styles.hudGaugeCluster}>
            <View style={styles.hudGaugeHeader}>
              <Text style={styles.hudGaugeIcon}>❤️</Text>
              <Text
                style={[
                  styles.hudGaugeValueText,
                  hudHealth <= 30
                    ? styles.hudHealthDanger
                    : hudHealth <= 60
                    ? styles.hudHealthWarn
                    : styles.hudHealthGood,
                ]}>
                {hudHealth}%
              </Text>
            </View>
            <View style={styles.hudGaugeBarBg}>
              <View
                style={[
                  styles.hudGaugeBarFill,
                  { width: `${hudHealth}%` },
                  hudHealth <= 30
                    ? styles.hudFillDanger
                    : hudHealth <= 60
                    ? styles.hudFillWarn
                    : styles.hudFillGood,
                ]}
              />
            </View>
          </View>

          {/* Center Speedometer & Survival Time */}
          <View style={styles.hudCenterGauge}>
            <View style={styles.hudSpeedRow}>
              <Text style={[styles.hudSpeedValue, isNitro && styles.hudSpeedNitro]}>
                {hudSpeed}
              </Text>
              <Text style={styles.hudSpeedUnit}>KM/H</Text>
            </View>
            <Text style={styles.hudTimerValue}>
              {modeConfig.timeLimit !== null
                ? `⏱️ ${timeRemaining}s`
                : `⏱️ ${formatSurvivalTime(survivalSeconds)}`}
            </Text>
          </View>

          {/* Boost Energy Meter */}
          <View style={styles.hudGaugeCluster}>
            <View style={styles.hudGaugeHeader}>
              <Text style={styles.hudGaugeIcon}>⚡</Text>
              <Text style={[styles.hudGaugeValueText, styles.hudBoostText]}>
                {Math.round(nitroFuel)}%
              </Text>
            </View>
            <View style={styles.hudGaugeBarBg}>
              <View
                style={[
                  styles.hudGaugeBarFill,
                  styles.hudBoostFill,
                  { width: `${nitroFuel}%` },
                  isNitro && styles.hudBoostFillPulsing,
                ]}
              />
            </View>
          </View>

          {/* Coin Counter Pill */}
          <View style={styles.hudCoinBadge}>
            <Text style={styles.hudCoinIcon}>🪙</Text>
            <Text style={styles.hudCoinValue}>{hudCoins}</Text>
          </View>

          {/* Pause Button */}
          <TouchableOpacity
            style={styles.hudCircleButton}
            activeOpacity={0.7}
            onPress={handlePauseGame}
            accessibilityLabel="Pause Game">
            <Text style={styles.hudPauseIcon}>⏸</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Status Badges Row (Safe Zone & Critical Warning) */}
        <View style={styles.hudStatusRow} pointerEvents="none">
          {activeShield && (
            <View style={styles.safeZoneHudPill}>
              <Text style={styles.safeZoneHudPillIcon}>🛡️</Text>
              <Text style={styles.safeZoneHudPillText}>
                SAFE MODE ({shieldTimeRemaining}s)
              </Text>
            </View>
          )}

          {activeMagnet && (
            <View style={styles.magnetHudPill}>
              <Text style={styles.magnetHudPillText}>🧲 COIN MAGNET ACTIVE</Text>
            </View>
          )}

          {hudHealth <= 30 && hudHealth > 0 && (
            <View style={styles.criticalWarningPill}>
              <Text style={styles.criticalWarningText}>
                ⚠️ CRITICAL DAMAGE! FIND REPAIR KIT ❤️
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* First 5-10 Seconds Interactive Tutorial Overlay */}
      {showTutorial && !isPaused && !isCrashed && (
        <View style={styles.tutorialOverlay} pointerEvents="box-none">
          <View style={styles.tutorialCard}>
            {/* Header: Title and SKIP Button */}
            <View style={styles.tutorialHeader}>
              <View style={styles.tutorialTitleBadge}>
                <Text style={styles.tutorialTitleIcon}>🎮</Text>
                <Text style={styles.tutorialTitleText}>HOW TO PLAY</Text>
              </View>
              <TouchableOpacity
                style={styles.tutorialSkipButton}
                activeOpacity={0.75}
                onPress={handleSkipTutorial}>
                <Text style={styles.tutorialSkipText}>SKIP ›</Text>
              </TouchableOpacity>
            </View>

            {/* Gesture Demonstrator & Instructions */}
            <View style={styles.tutorialGesturesContainer}>
              <Animated.View
                style={[
                  styles.tutorialHandCircle,
                  {
                    transform: [
                      { translateX: tutorialHandAnim.x },
                      { translateY: tutorialHandAnim.y },
                    ],
                  },
                ]}>
                <Text style={styles.tutorialHandEmoji}>👆</Text>
              </Animated.View>

              <View style={styles.tutorialInstructionList}>
                <View style={styles.tutorialInstructionItem}>
                  <Text style={styles.tutorialItemIcon}>⬆️</Text>
                  <Text style={styles.tutorialItemText}>
                    Drag <Text style={styles.tutorialHighlight}>UP</Text> to Accelerate & Boost
                  </Text>
                </View>
                <View style={styles.tutorialInstructionItem}>
                  <Text style={styles.tutorialItemIcon}>⬇️</Text>
                  <Text style={styles.tutorialItemText}>
                    Drag <Text style={styles.tutorialHighlight}>DOWN</Text> to Brake & Slow Down
                  </Text>
                </View>
                <View style={styles.tutorialInstructionItem}>
                  <Text style={styles.tutorialItemIcon}>↔️</Text>
                  <Text style={styles.tutorialItemText}>
                    Drag <Text style={styles.tutorialHighlight}>LEFT / RIGHT</Text> to Steer Freely
                  </Text>
                </View>
                <View style={styles.tutorialInstructionItem}>
                  <Text style={styles.tutorialItemIcon}>🛡️</Text>
                  <Text style={styles.tutorialItemText}>
                    Enter <Text style={styles.tutorialHighlightCyan}>SAFE ZONES</Text> for 0 Damage Shield
                  </Text>
                </View>
                <View style={styles.tutorialInstructionItem}>
                  <Text style={styles.tutorialItemIcon}>❤️</Text>
                  <Text style={styles.tutorialItemText}>
                    Collect <Text style={styles.tutorialHighlightGreen}>REPAIR KITS</Text> & <Text style={styles.tutorialHighlightGold}>COINS</Text>
                  </Text>
                </View>
                <View style={styles.tutorialInstructionItem}>
                  <Text style={styles.tutorialItemIcon}>🎺</Text>
                  <Text style={styles.tutorialItemText}>
                    Tap screen to sound <Text style={styles.tutorialHighlightGold}>CAR HORN</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Countdown Footer */}
            <Text style={styles.tutorialCountdownFooter}>
              Auto-starting in {tutorialCountdown}s... (touch & drag anywhere to drive)
            </Text>
          </View>
        </View>
      )}

      {/* In-Game Pause ("game push") Popup Modal */}
      <Modal
        visible={isPaused && !showGameOverOverlay}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleResumeGame}>
        <View style={styles.modalBackdrop}>
          <View style={styles.trackPauseCard}>
            {/* Header Icon */}
            <View style={styles.pauseIconBadge}>
              <Text style={styles.pauseIconBadgeEmoji}>⏸️</Text>
            </View>

            {/* Modal Title & Subtitle */}
            <Text style={styles.trackPauseTitle}>GAME PAUSED</Text>
            <Text style={styles.trackPauseSubtitle}>DRIVE MODE SUSPENDED</Text>

            {/* Live Run Performance Strip */}
            <View style={styles.pauseStatsContainer}>
              <View style={styles.pauseStatBox}>
                <Text style={styles.pauseStatLabel}>SCORE</Text>
                <Text style={[styles.pauseStatValue, { color: colors.primaryNeon }]}>
                  {Number(hudScore || 0).toLocaleString()}
                </Text>
                <Text style={styles.pauseStatUnit}>PTS</Text>
              </View>

              <View style={styles.pauseStatDivider} />

              <View style={styles.pauseStatBox}>
                <Text style={styles.pauseStatLabel}>DISTANCE</Text>
                <Text style={[styles.pauseStatValue, { color: colors.secondary }]}>
                  {Number(hudDistance || 0).toLocaleString()}
                </Text>
                <Text style={styles.pauseStatUnit}>METERS</Text>
              </View>

              <View style={styles.pauseStatDivider} />

              <View style={styles.pauseStatBox}>
                <Text style={styles.pauseStatLabel}>COINS</Text>
                <Text style={[styles.pauseStatValue, { color: colors.accent }]}>
                  +{hudCoins}
                </Text>
                <Text style={styles.pauseStatUnit}>EARNED</Text>
              </View>
            </View>

            {/* 3 Explicit Action Buttons: CONTINUE, RESTART, BACK TO HOME */}
            <View style={styles.pauseActionsColumn}>
              {/* 1. CONTINUE Option */}
              <TouchableOpacity
                style={styles.pauseContinueButton}
                activeOpacity={0.85}
                onPress={handleResumeGame}>
                <Text style={styles.pauseContinueButtonText}>▶ CONTINUE</Text>
              </TouchableOpacity>

              {/* 2. RESTART Option */}
              <TouchableOpacity
                style={styles.pauseRestartButton}
                activeOpacity={0.85}
                onPress={handleRestartFromPause}>
                <Text style={styles.pauseRestartButtonText}>🔄 RESTART</Text>
              </TouchableOpacity>

              {/* 3. BACK TO HOME Option */}
              <TouchableOpacity
                style={styles.pauseHomeButton}
                activeOpacity={0.85}
                onPress={handleHomeFromPause}>
                <Text style={styles.pauseHomeButtonText}>🏠 BACK TO HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* On-Track Game Over & Coin Collection Modal */}
      <Modal
        visible={showGameOverOverlay}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleRestartGame}>
        <View style={styles.modalBackdrop}>
          <View style={styles.trackGameOverCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              style={{ width: '100%' }}>
              <View style={styles.blastBadge}>
                <Text style={styles.blastBadgeEmoji}>💥</Text>
              </View>

              <Text style={styles.trackGameOverTitle}>CAR BLASTED!</Text>
              <Text style={styles.trackGameOverSubtitle}>SMASHED ON HIGHWAY ASPHALT</Text>

              {gameOverData.isNewHighScore && (
                <View style={styles.highScoreTrackBadge}>
                  <Text style={styles.highScoreTrackBadgeText}>🏆 NEW BEST SCORE!</Text>
                </View>
              )}
              {gameOverData.isNewBestDist && (
                <View style={styles.longestRunTrackBadge}>
                  <Text style={styles.longestRunTrackBadgeText}>🚀 NEW LONGEST RUN!</Text>
                </View>
              )}

              {/* Coins Collected Card */}
              <View style={styles.coinsShowcaseCard}>
                <Text style={styles.coinsShowcaseLabel}>COINS COLLECTED</Text>
                <View style={styles.coinsShowcaseRow}>
                  <Text style={styles.coinsShowcaseIcon}>🪙</Text>
                  <Text style={styles.coinsShowcaseValue}>+{gameOverData.coinsCollected}</Text>
                </View>
                <Text style={styles.coinsSavedNote}>
                  ✓ Stored in AsyncStorage • Wallet: 🪙 {Number(gameOverData.totalCoins || 0).toLocaleString()}
                </Text>
              </View>

              {/* Run Stats Breakdown: Score and Distance Prominently Displayed */}
              <View style={styles.trackStatsGrid}>
                <View style={[styles.trackStatBox, styles.trackStatBoxHighlight]}>
                  <Text style={styles.trackStatBoxLabel}>FINAL SCORE</Text>
                  <Text style={[styles.trackStatBoxValue, { color: colors.primaryNeon, fontSize: 20 }]}>
                    {Number(gameOverData.score || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.trackStatUnitLabel}>POINTS</Text>
                </View>

                <View style={[styles.trackStatBox, styles.trackStatBoxHighlight]}>
                  <Text style={styles.trackStatBoxLabel}>DISTANCE</Text>
                  <Text style={[styles.trackStatBoxValue, { color: colors.secondary, fontSize: 20 }]}>
                    {Number(gameOverData.distance || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.trackStatUnitLabel}>METERS</Text>
                </View>

                <View style={styles.trackStatBox}>
                  <Text style={styles.trackStatBoxLabel}>BEST SCORE</Text>
                  <Text style={styles.trackStatBoxValue}>
                    {Number(gameOverData.bestScore || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.trackStatBox}>
                  <Text style={styles.trackStatBoxLabel}>LONGEST RUN</Text>
                  <Text style={styles.trackStatBoxValue}>
                    {Number(gameOverData.bestDistance || 0).toLocaleString()} m
                  </Text>
                </View>
              </View>

              {/* Action Buttons: RETRY and BACK TO HOME (Garage option removed) */}
              <TouchableOpacity
                style={styles.trackPlayAgainButton}
                activeOpacity={0.85}
                onPress={handleRestartGame}>
                <Text style={styles.trackPlayAgainText}>🔄 RETRY RACE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.trackBackHomeFullButton}
                activeOpacity={0.8}
                onPress={async () => {
                  playEffect('button');
                  setDrivingActive(false);
                  stopDrivingSounds();
                  stopAll();
                  setShowGameOverOverlay(false);
                  const finalCoins = stateRef.current.coinsCollected || hudCoins || 0;
                  const finalScore = stateRef.current.score || hudScore || 0;
                  const finalDistance = Math.floor(stateRef.current.distance || hudDistance || 0);
                  if (!isGameOverProcessedRef.current && (finalCoins > 0 || finalScore > 0 || finalDistance > 0)) {
                    isGameOverProcessedRef.current = true;
                    try {
                      await recordRaceResult({
                        score: finalScore,
                        distance: finalDistance,
                        coinsEarned: finalCoins,
                      });
                    } catch (e) {
                      console.warn('Error saving race result on Home nav:', e);
                    }
                  }
                  navigation.navigate('Home');
                }}>
                <Text style={styles.trackSecondaryButtonText}>🏠 BACK TO HOME</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  smashedFogCluster: {
    position: 'absolute',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 26,
    top: -20,
  },
  movingSmokePuff: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  smokePuffColor1: {
    backgroundColor: 'rgba(215, 225, 240, 0.65)',
  },
  smokePuffColor2: {
    backgroundColor: 'rgba(165, 180, 200, 0.72)',
  },
  smokePuffColor3: {
    backgroundColor: 'rgba(125, 140, 160, 0.78)',
  },
  fireGlowCore: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3D00',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
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
    top: -40,
    bottom: -40,
    left: 0,
    width: 9,
    flexDirection: 'column',
    borderRightWidth: 1,
    borderColor: '#30363D',
  },
  curbRight: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    right: 0,
    width: 9,
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderColor: '#30363D',
  },
  curbStripe: {
    width: 9,
    height: 38,
  },
  curbBlack: {
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderColor: '#21262D',
  },
  curbWhite: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E6EDF3',
  },
  laneDivider: {
    position: 'absolute',
    width: 4,
    height: SCREEN_HEIGHT * 2,
  },
  stripe: {
    width: 4,
    height: ROAD_CONFIG.STRIPE_HEIGHT,
    backgroundColor: '#FFFFFF',
    marginBottom: ROAD_CONFIG.STRIPE_GAP,
    borderRadius: 2,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  launchedVehicleShadow: {
    position: 'absolute',
    backgroundColor: '#000000',
    borderRadius: 20,
    zIndex: 2,
  },
  launchedVehicleWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  launchedSparksAura: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 230, 0, 0.8)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  shieldBurstRing: {
    position: 'absolute',
    width: PLAYER_WIDTH * 1.5,
    height: PLAYER_HEIGHT * 1.5,
    borderRadius: PLAYER_HEIGHT * 0.75,
    borderWidth: 3,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    zIndex: 8,
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
    left: -12,
    top: -12,
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
    left: -17,
    top: -17,
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
  hudBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  hudBackButtonIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: -2,
  },
  settingsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  settingsCircleText: {
    fontSize: 13,
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
  safeModeBadgeActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  buffText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondary,
  },

  // Minimalist Modern 5G/6G HUD Cluster
  modernHudContainer: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    zIndex: 50,
  },
  hudTopCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(13, 17, 23, 0.88)',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(48, 54, 61, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 8,
  },
  hudCircleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(33, 38, 45, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(48, 54, 61, 0.9)',
  },
  hudBackIcon: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  hudPauseIcon: {
    fontSize: 14,
  },
  hudGaugeCluster: {
    width: 68,
  },
  hudGaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  hudGaugeIcon: {
    fontSize: 10,
  },
  hudGaugeValueText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudHealthGood: {
    color: '#00E676',
  },
  hudHealthWarn: {
    color: '#FFD600',
  },
  hudHealthDanger: {
    color: '#FF1744',
  },
  hudBoostText: {
    color: '#00F0FF',
  },
  hudGaugeBarBg: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hudGaugeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hudFillGood: {
    backgroundColor: '#00E676',
  },
  hudFillWarn: {
    backgroundColor: '#FFD600',
  },
  hudFillDanger: {
    backgroundColor: '#FF1744',
  },
  hudBoostFill: {
    backgroundColor: '#00F0FF',
  },
  hudBoostFillPulsing: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#00F0FF',
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  hudCenterGauge: {
    alignItems: 'center',
    minWidth: 70,
  },
  hudSpeedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hudSpeedValue: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  hudSpeedNitro: {
    color: '#00F0FF',
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  hudSpeedUnit: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.secondary,
    marginLeft: 2,
  },
  hudTimerValue: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 1,
  },
  hudCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  hudCoinIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  hudCoinValue: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 11,
  },
  hudStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    justifyContent: 'center',
  },
  safeZoneHudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    marginHorizontal: 4,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 4,
  },
  safeZoneHudPillIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  safeZoneHudPillText: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 9.5,
    letterSpacing: 1,
  },
  magnetHudPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  magnetHudPillText: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 9,
  },
  criticalWarningPill: {
    backgroundColor: 'rgba(255, 23, 68, 0.3)',
    borderWidth: 1.5,
    borderColor: '#FF1744',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  criticalWarningText: {
    color: '#FF6B81',
    fontWeight: '900',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },

  // First 5-10 Seconds Interactive Tutorial Overlay
  tutorialOverlay: {
    position: 'absolute',
    top: 75,
    left: 18,
    right: 18,
    zIndex: 90,
    alignItems: 'center',
  },
  tutorialCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(22, 27, 34, 0.96)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.55)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tutorialTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorialTitleIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tutorialTitleText: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  tutorialSkipButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tutorialSkipText: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
  tutorialGesturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tutorialHandCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 229, 255, 0.14)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorialHandEmoji: {
    fontSize: 24,
  },
  tutorialInstructionList: {
    flex: 1,
  },
  tutorialInstructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  tutorialItemIcon: {
    fontSize: 11,
    marginRight: 6,
  },
  tutorialItemText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  tutorialHighlight: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tutorialHighlightCyan: {
    color: '#00E5FF',
    fontWeight: '900',
  },
  tutorialHighlightGreen: {
    color: '#00E676',
    fontWeight: '900',
  },
  tutorialHighlightGold: {
    color: '#FFD700',
    fontWeight: '900',
  },
  tutorialCountdownFooter: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  trackPauseCard: {
    width: '100%',
    maxWidth: 355,
    backgroundColor: 'rgba(22, 27, 34, 0.98)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.5)',
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 16,
  },
  pauseIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pauseIconBadgeEmoji: {
    fontSize: 26,
  },
  trackPauseTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  trackPauseSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 2.5,
    marginTop: 4,
    marginBottom: 18,
  },
  pauseStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(48, 54, 61, 0.7)',
    marginBottom: 20,
  },
  pauseStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  pauseStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  pauseStatValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  pauseStatUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  pauseStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(48, 54, 61, 0.8)',
  },
  pauseActionsColumn: {
    width: '100%',
    gap: 10,
  },
  pauseContinueButton: {
    backgroundColor: colors.primaryNeon,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  pauseContinueButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  pauseRestartButton: {
    backgroundColor: 'rgba(33, 38, 45, 0.95)',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  pauseRestartButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pauseHomeButton: {
    backgroundColor: 'rgba(255, 23, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 23, 68, 0.45)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  pauseHomeButtonText: {
    color: '#FF6B81',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modalScrollContent: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  trackGameOverCard: {
    width: '100%',
    maxWidth: 355,
    maxHeight: '90%',
    backgroundColor: 'rgba(22, 27, 34, 0.98)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.danger,
    padding: 18,
    alignItems: 'center',
    elevation: 16,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  blastBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 23, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  blastBadgeEmoji: {
    fontSize: 28,
  },
  trackGameOverTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.danger,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  trackGameOverSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 2,
    marginBottom: 10,
  },
  highScoreTrackBadge: {
    backgroundColor: 'rgba(255, 214, 0, 0.18)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  highScoreTrackBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1,
  },
  longestRunTrackBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  longestRunTrackBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.secondary,
    letterSpacing: 1,
  },
  coinsShowcaseCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  coinsShowcaseLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  coinsShowcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  coinsShowcaseIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  coinsShowcaseValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1,
  },
  coinsSavedNote: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  trackStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackStatBox: {
    width: '48.5%',
    backgroundColor: colors.backgroundSurface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  trackStatBoxLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  trackStatBoxValue: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  trackStatBoxHighlight: {
    borderColor: 'rgba(0, 229, 255, 0.3)',
    backgroundColor: 'rgba(15, 23, 36, 0.95)',
  },
  trackStatUnitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  trackPlayAgainButton: {
    width: '100%',
    backgroundColor: colors.primaryNeon,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  trackPlayAgainText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  trackBackHomeFullButton: {
    width: '100%',
    backgroundColor: colors.backgroundSurface,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackNavButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  trackSecondaryButton: {
    flex: 1,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackSecondaryButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
});

export default GameScreen;

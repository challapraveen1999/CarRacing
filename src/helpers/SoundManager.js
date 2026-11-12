import { Vibration, Platform, AppState } from 'react-native';

let Sound = null;
try {
  const SoundLib = require('react-native-sound');
  Sound = SoundLib && SoundLib.default ? SoundLib.default : SoundLib;
  if (Sound && typeof Sound.setCategory === 'function') {
    Sound.setCategory('Playback', true);
  }
} catch (e) {
  console.log('[SoundManager] Native Sound module running in fallback mode', e);
}

const sounds = {};

let musicEnabled = true;
let effectsEnabled = true;
let vibrationEnabled = true;
let musicVolume = 0.7;
let effectsVolume = 0.8;

let isAppActive = true;
let wasMusicPlayingBeforeBackground = false;
let wasEnginePlayingBeforeBackground = false;

// Guarantee audio NEVER plays when app is minimized or phone is locked/in background
if (AppState && typeof AppState.addEventListener === 'function') {
  AppState.addEventListener('change', (nextAppState) => {
    const isForeground = nextAppState === 'active';
    if (!isForeground) {
      isAppActive = false;
      wasMusicPlayingBeforeBackground = Boolean(sounds['racing.mp3']);
      wasEnginePlayingBeforeBackground = Boolean(sounds['car_engine2.mp3']);

      if (sounds['racing.mp3']) {
        try { sounds['racing.mp3'].pause(); } catch {}
      }
      if (sounds['car_engine2.mp3']) {
        try { sounds['car_engine2.mp3'].pause(); } catch {}
      }
    } else {
      isAppActive = true;
      if (wasMusicPlayingBeforeBackground && musicEnabled && sounds['racing.mp3']) {
        try { sounds['racing.mp3'].play(); } catch {}
      }
      if (wasEnginePlayingBeforeBackground && effectsEnabled && sounds['car_engine2.mp3']) {
        try { sounds['car_engine2.mp3'].play(); } catch {}
      }
      wasMusicPlayingBeforeBackground = false;
      wasEnginePlayingBeforeBackground = false;
    }
  });
}

// Normalized filename mapping: Strictly mapped to user's 10 maintained sound files
const SOUND_FILES = {
  // 1. Blast (blast.mp3)
  blast: 'blast.mp3',
  car_blast: 'blast.mp3',
  blasted: 'blast.mp3',
  crash: 'blast.mp3',
  car_crash: 'blast.mp3',
  crash_sound: 'blast.mp3',
  blast_sound: 'blast.mp3',
  gameover: 'blast.mp3',
  crashing: 'blast.mp3',
  car_crashing: 'blast.mp3',
  accident: 'blast.mp3',
  acedant: 'blast.mp3',
  car_accident: 'blast.mp3',
  car_acedant: 'blast.mp3',
  collision: 'blast.mp3',
  car_collision: 'blast.mp3',
  accident_sound: 'blast.mp3',
  acedant_sound: 'blast.mp3',
  crash_accident: 'blast.mp3',

  // 2. Car Boosting (car_boosting.mp3)
  car_boosting: 'car_boosting.mp3',
  boost: 'car_boosting.mp3',
  boosting: 'car_boosting.mp3',
  nitro: 'car_boosting.mp3',

  // 3. Car Break (car_break.mp3)
  car_break: 'car_break.mp3',
  brake: 'car_break.mp3',
  break: 'car_break.mp3',
  brake_sound: 'car_break.mp3',
  break_sound: 'car_break.mp3',
  skid: 'car_break.mp3',
  tire_skid: 'car_break.mp3',

  // 4. Car Dash & Health Case Collection (car_dash.mp3)
  car_dash: 'car_dash.mp3',
  dash: 'car_dash.mp3',
  dash_sound: 'car_dash.mp3',
  health: 'car_dash.mp3',
  health_pack: 'car_dash.mp3',
  health_sound: 'car_dash.mp3',
  health_case: 'car_dash.mp3',
  healthcase: 'car_dash.mp3',
  heal: 'car_dash.mp3',
  repair: 'car_dash.mp3',

  // 5. Car Engine2 (car_engine2.mp3)
  car_engine2: 'car_engine2.mp3',
  car_engine: 'car_engine2.mp3',
  engine: 'car_engine2.mp3',
  engine_loop: 'car_engine2.mp3',

  // 6. Car Honk (car_honk.mp3)
  car_honk: 'car_honk.mp3',
  honk: 'car_honk.mp3',
  horn: 'car_honk.mp3',

  // 7. Coin Collecting (coin_collecting.mp3)
  coin_collecting: 'coin_collecting.mp3',
  coin: 'coin_collecting.mp3',
  coin_collect: 'coin_collecting.mp3',
  coin_sound: 'coin_collecting.mp3',
  coin_voice: 'coin_collecting.mp3',
  collected_voice: 'coin_collecting.mp3',
  voice_coin: 'coin_collecting.mp3',
  voice_collected: 'coin_collecting.mp3',
  button: 'coin_collecting.mp3',
  click: 'coin_collecting.mp3',
  button_click: 'coin_collecting.mp3',
  unlock: 'coin_collecting.mp3',
  race_complete: 'coin_collecting.mp3',

  // 8. Countdown 3-2-1-GO (countdown_3_2_1_go.mp3)
  countdown_3_2_1_go: 'countdown_3_2_1_go.mp3',
  countdown: 'countdown_3_2_1_go.mp3',
  countdown_go: 'countdown_3_2_1_go.mp3',
  countdown_beep: 'countdown_3_2_1_go.mp3',
  countdown_sound: 'countdown_3_2_1_go.mp3',
  '321go': 'countdown_3_2_1_go.mp3',
  '321_go': 'countdown_3_2_1_go.mp3',
  '3_2_1_go': 'countdown_3_2_1_go.mp3',
  countdown321go: 'countdown_3_2_1_go.mp3',

  // 9. Engine Start (engine_start.mp3)
  engine_start: 'engine_start.mp3',
  start: 'engine_start.mp3',
  start_sound: 'engine_start.mp3',
  game_start: 'engine_start.mp3',

  // 10. Racing (racing.mp3)
  racing: 'racing.mp3',
  race_car: 'racing.mp3',
  moving: 'racing.mp3',
  car_moving: 'racing.mp3',
  moving_sound: 'racing.mp3',
  acceleration: 'racing.mp3',
  background_music: 'racing.mp3',
  background: 'racing.mp3',
};

const resolveSoundName = (rawName) => {
  if (!rawName) return null;
  const lower = String(rawName).toLowerCase().replace(/-/g, '_').replace(/\.mp3$/, '');
  return SOUND_FILES[lower] || (rawName.endsWith('.mp3') ? rawName.replace(/-/g, '_').toLowerCase() : `${lower}.mp3`);
};

const isMusicTrack = (filename) => {
  if (!filename) return false;
  const lower = String(filename).toLowerCase();
  return lower.includes('racing') || lower.includes('background') || lower.includes('music');
};

const SoundManager = {
  /**
   * Play an audio file by name from MAIN_BUNDLE (android/res/raw or iOS bundle)
   * @param {string} name - Sound file name (e.g. 'button_click.mp3' or 'coin_collect')
   * @param {boolean} loop - Whether to loop indefinitely
   * @param {number} volume - Volume level from 0 to 1
   */
  play(name, loop = false, volume = 1) {
    if (!isAppActive) return;
    const filename = resolveSoundName(name);
    if (!filename) return;

    // Check mute preferences
    const isMusic = isMusicTrack(filename);
    if (isMusic && !musicEnabled) return;
    if (!isMusic && !effectsEnabled) return;

    // Trigger haptic vibration if enabled
    if (vibrationEnabled) {
      if (filename.includes('crash') || filename.includes('blast') || filename.includes('accident') || filename.includes('collision')) {
        Vibration.vibrate(Platform.OS === 'android' ? [0, 80, 50, 180, 60, 320] : [0, 80, 50, 180, 60, 320]);
      } else if (filename.includes('coin')) {
        Vibration.vibrate(Platform.OS === 'android' ? 30 : [0, 30]);
      } else if (filename.includes('button')) {
        Vibration.vibrate(Platform.OS === 'android' ? 15 : [0, 15]);
      } else if (filename.includes('brake') || filename.includes('break')) {
        Vibration.vibrate(Platform.OS === 'android' ? 50 : [0, 50]);
      } else if (filename.includes('complete') || filename.includes('unlock')) {
        Vibration.vibrate(Platform.OS === 'android' ? [0, 60, 60, 120] : [0, 60, 60, 120]);
      }
    }

    if (!Sound) return;

    const calculatedVolume = isMusic
      ? volume * musicVolume
      : volume * effectsVolume;

    const isLooping = Boolean(loop);

    // If looping track is already loaded and active, just set volume and keep playing
    if (isLooping && sounds[filename]) {
      try {
        sounds[filename].setVolume(calculatedVolume);
      } catch {}
      return;
    }

    // Stop and release previous instance of this specific sound if playing
    if (sounds[filename]) {
      try {
        sounds[filename].stop();
        sounds[filename].release();
      } catch {}
      delete sounds[filename];
    }

    const platformFileName = Platform.OS === 'android' ? filename.replace(/\.mp3$/, '') : filename;
    const bundlePath = Platform.OS === 'android' ? '' : (Sound.MAIN_BUNDLE || '');

    try {
      let soundInstance = null;
      soundInstance = new Sound(platformFileName, bundlePath, (error) => {
        if (error) {
          console.warn('[SoundManager] Sound load note:', filename, error?.message || error);
          if (sounds[filename] === soundInstance) {
            delete sounds[filename];
          }
          return;
        }

        if (!soundInstance) return;

        soundInstance.setVolume(calculatedVolume);
        soundInstance.setNumberOfLoops(isLooping ? -1 : 0);

        soundInstance.play((success) => {
          if (!isLooping) {
            try {
              soundInstance.release();
            } catch {}
            if (sounds[filename] === soundInstance) {
              delete sounds[filename];
            }
          }
        });
      });

      sounds[filename] = soundInstance;
    } catch (err) {
      console.warn('[SoundManager] Play error for', filename, err);
    }
  },

  /**
   * Stop and release a specific playing sound
   */
  stop(name) {
    const filename = resolveSoundName(name);
    if (sounds[filename]) {
      try {
        sounds[filename].stop();
        sounds[filename].release();
      } catch {}
      delete sounds[filename];
    }
  },

  /**
   * Stop and release all active sounds
   */
  stopAll() {
    wasMusicPlayingBeforeBackground = false;
    wasEnginePlayingBeforeBackground = false;
    Object.keys(sounds).forEach((filename) => {
      this.stop(filename);
    });
  },

  // Game Flow Convenience Methods
  playEffect(key) {
    this.play(key, false, 1);
  },

  playStartSound() {
    this.play('engine_start.mp3', false, 1.0);
  },

  playMovingSound() {
    this.startEngineLoop();
  },

  stopMovingSound() {
    this.stopEngineLoop();
  },

  playBrake() {
    this.play('brake', false, 1.0);
  },

  stopBrake() {
    this.stop('brake');
  },

  playBrakeSound() {
    this.playBrake();
  },

  stopBrakeSound() {
    this.stopBrake();
  },

  playDash() {
    this.play('dash', false, 1);
  },

  playHealthSound() {
    this.play('health', false, 1.0);
  },

  playBlastSound() {
    this.play('blast', false, 1.0);
  },

  playCrashSound() {
    this.play('blast', false, 1.0);
  },

  playAccidentSound() {
    this.play('car_accident', false, 1.0);
  },

  playCollisionSound() {
    this.play('car_collision', false, 1.0);
  },

  playHonkSound() {
    this.play('car_honk', false, 1.0);
  },

  playBoostSound() {
    this.play('car_boosting', false, 1.0);
  },

  stopBoostSound() {
    this.stop('car_boosting');
  },

  playCoinSound() {
    this.play('coin_collecting', false, 1.0);
  },

  playCoinVoice() {
    this.play('coin_voice', false, 1.0);
  },

  playCountdownSound() {
    this.play('countdown_3_2_1_go', false, 1.0);
  },

  playMusic() {
    this.play('racing.mp3', true, 0.25);
  },

  stopMusic() {
    this.stop('racing.mp3');
  },

  pauseMusic() {
    const filename = 'racing.mp3';
    if (sounds[filename]) {
      sounds[filename].pause();
    }
  },

  startEngineLoop() {
    this.play('car_engine2.mp3', true, 0.7);
  },

  stopEngineLoop() {
    this.stop('car_engine2.mp3');
  },

  updateMovingSpeed(speedRatio) {
    if (sounds['car_engine2.mp3']) {
      const clamped = Math.max(0, Math.min(1, speedRatio));
      const targetVol = (0.45 + clamped * 0.45) * effectsVolume;
      try {
        sounds['car_engine2.mp3'].setVolume(targetVol);
      } catch {}
    }
  },

  initializeSounds() {
    console.log('[SoundManager] SoundManager ready.');
  },

  setMusicEnabled(value) {
    musicEnabled = Boolean(value);
    if (!musicEnabled) {
      this.stopMusic();
    }
  },

  setEffectsEnabled(value) {
    effectsEnabled = Boolean(value);
    if (!effectsEnabled) {
      this.stopEngineLoop();
    }
  },

  setVibrationEnabled(value) {
    vibrationEnabled = Boolean(value);
  },

  setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(1, volume));
    if (sounds['racing.mp3']) {
      sounds['racing.mp3'].setVolume(musicVolume);
    }
  },

  setEffectsVolume(volume) {
    effectsVolume = Math.max(0, Math.min(1, volume));
    if (sounds['car_engine2.mp3']) {
      sounds['car_engine2.mp3'].setVolume(effectsVolume * 0.6);
    }
  },

  getMusicVolume: () => musicVolume,
  getEffectsVolume: () => effectsVolume,

  releaseSounds() {
    this.stopAll();
  },
};

// Named exports for destructuring: import { playEffect, playMusic } from '../helpers/SoundManager';
export const play = SoundManager.play.bind(SoundManager);
export const stop = SoundManager.stop.bind(SoundManager);
export const stopAll = SoundManager.stopAll.bind(SoundManager);
export const playEffect = SoundManager.playEffect.bind(SoundManager);
export const playStartSound = SoundManager.playStartSound.bind(SoundManager);
export const playMovingSound = SoundManager.playMovingSound.bind(SoundManager);
export const stopMovingSound = SoundManager.stopMovingSound.bind(SoundManager);
export const playBrake = SoundManager.playBrake.bind(SoundManager);
export const stopBrake = SoundManager.stopBrake.bind(SoundManager);
export const playBrakeSound = SoundManager.playBrakeSound.bind(SoundManager);
export const stopBrakeSound = SoundManager.stopBrakeSound.bind(SoundManager);
export const playDash = SoundManager.playDash.bind(SoundManager);
export const playHealthSound = SoundManager.playHealthSound.bind(SoundManager);
export const playBlastSound = SoundManager.playBlastSound.bind(SoundManager);
export const playCrashSound = SoundManager.playCrashSound.bind(SoundManager);
export const playAccidentSound = SoundManager.playAccidentSound.bind(SoundManager);
export const playCollisionSound = SoundManager.playCollisionSound.bind(SoundManager);
export const playHonkSound = SoundManager.playHonkSound.bind(SoundManager);
export const playBoostSound = SoundManager.playBoostSound.bind(SoundManager);
export const stopBoostSound = SoundManager.stopBoostSound.bind(SoundManager);
export const playCoinSound = SoundManager.playCoinSound.bind(SoundManager);
export const playCoinVoice = SoundManager.playCoinVoice.bind(SoundManager);
export const playCountdownSound = SoundManager.playCountdownSound.bind(SoundManager);
export const updateMovingSpeed = SoundManager.updateMovingSpeed.bind(SoundManager);
export const playMusic = SoundManager.playMusic.bind(SoundManager);
export const stopMusic = SoundManager.stopMusic.bind(SoundManager);
export const pauseMusic = SoundManager.pauseMusic.bind(SoundManager);
export const startEngineLoop = SoundManager.startEngineLoop.bind(SoundManager);
export const stopEngineLoop = SoundManager.stopEngineLoop.bind(SoundManager);
export const initializeSounds = SoundManager.initializeSounds.bind(SoundManager);
export const setMusicEnabled = SoundManager.setMusicEnabled.bind(SoundManager);
export const setEffectsEnabled = SoundManager.setEffectsEnabled.bind(SoundManager);
export const setVibrationEnabled = SoundManager.setVibrationEnabled.bind(SoundManager);
export const setMusicVolume = SoundManager.setMusicVolume.bind(SoundManager);
export const setEffectsVolume = SoundManager.setEffectsVolume.bind(SoundManager);
export const getMusicVolume = SoundManager.getMusicVolume.bind(SoundManager);
export const getEffectsVolume = SoundManager.getEffectsVolume.bind(SoundManager);
export const releaseSounds = SoundManager.releaseSounds.bind(SoundManager);

export default SoundManager;

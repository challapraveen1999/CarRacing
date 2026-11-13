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

// Active sound instance registry: tracks both preparing and playing sounds to guarantee zero orphaned audio loops
const activeSounds = new Map();
let soundCounter = 0;
let isDrivingActive = false;

let musicEnabled = true;
let effectsEnabled = true;
let vibrationEnabled = true;
let musicVolume = 0.7;
let effectsVolume = 0.8;

// Identify whether a sound is a continuous/in-race driving effect
const isDrivingSound = (filename) => {
  if (!filename) return false;
  const lower = String(filename).toLowerCase();
  return (
    lower.includes('racing') ||
    lower.includes('engine') ||
    lower.includes('boost') ||
    lower.includes('break') ||
    lower.includes('brake') ||
    lower.includes('dash')
  );
};

// Guarantee continuous background audio loops are paused when phone is minimized/locked
if (AppState && typeof AppState.addEventListener === 'function') {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') {
      // Pause all active driving sounds while phone is backgrounded
      for (const record of activeSounds.values()) {
        if (record.isDriving && record.soundInstance) {
          try { record.soundInstance.pause(); } catch {}
        }
      }
    } else if (nextAppState === 'active') {
      // Resume driving sounds strictly if car is actively driving on track!
      if (isDrivingActive) {
        for (const record of activeSounds.values()) {
          if (record.isDriving && record.soundInstance && !record.isStopped) {
            try { record.soundInstance.play(); } catch {}
          }
        }
      }
    }
  });
}

// Normalized filename mapping: Strictly mapped to user's maintained audio files
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

  // 3. Car Break & Break Effect (car_break.mp3 & break_effect.mp3)
  car_break: 'car_break.mp3',
  break_effect: 'car_break.mp3',
  carbreak: 'car_break.mp3',
  breakeffect: 'car_break.mp3',
  brake: 'car_break.mp3',
  break: 'car_break.mp3',
  brake_sound: 'car_break.mp3',
  break_sound: 'car_break.mp3',
  skid: 'car_break.mp3',
  tire_skid: 'car_break.mp3',

  // 4. Car Dash & Health Case Collection (car_dash.mp3)
  car_dash: 'car_dash.mp3',
  cardash: 'car_dash.mp3',
  dash: 'car_dash.mp3',
  dash_sound: 'car_dash.mp3',
  boost_dash: 'car_dash.mp3',
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

  // 6. Car Honk & Car Horn (car_honk.mp3 & car_horn.mp3)
  car_honk: 'car_honk.mp3',
  car_horn: 'car_honk.mp3',
  carhorn: 'car_honk.mp3',
  carhonk: 'car_honk.mp3',
  honk: 'car_honk.mp3',
  horn: 'car_honk.mp3',
  horn_sound: 'car_honk.mp3',
  honk_sound: 'car_honk.mp3',
  beep: 'car_honk.mp3',

  // 7. Coin Collecting & Coin Collect (coin_collecting.mp3 & coin_collect.mp3)
  coin_collecting: 'coin_collecting.mp3',
  coin_collect: 'coin_collecting.mp3',
  coincollecting: 'coin_collecting.mp3',
  coincollect: 'coin_collecting.mp3',
  coin: 'coin_collecting.mp3',
  coins: 'coin_collecting.mp3',
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

// Fallback alternate resource names if primary fails to load
const FALLBACK_RESOURCE_MAP = {
  car_honk: 'car_horn',
  car_horn: 'car_honk',
  coin_collecting: 'coin_collect',
  coin_collect: 'coin_collecting',
  car_break: 'break_effect',
  break_effect: 'car_break',
  car_dash: 'car_boosting',
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
   * @param {boolean} force - Force playback bypassing mute toggles (for sound test/preview)
   */
  play(name, loop = false, volume = 1, force = false) {
    const filename = resolveSoundName(name);
    if (!filename) return;

    const isMusic = isMusicTrack(filename);
    const isDriving = isDrivingSound(filename);

    // STRICT DRIVING MODE RULE:
    // When car is on track that time ONLY to play driving sounds!
    // If driving is not active, block all driving sounds unless force=true (for Settings test preview)
    if (isDriving && !isDrivingActive && !force) {
      return;
    }

    // Check mute preferences unless force=true
    if (!force) {
      if (isMusic && !musicEnabled) return;
      if (!isMusic && !effectsEnabled) return;
    }

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

    const calculatedVolume = force
      ? volume
      : (isMusic ? volume * musicVolume : volume * effectsVolume);

    const isLooping = Boolean(loop);

    // If looping track is already loaded and active, just set volume and keep playing
    if (isLooping) {
      for (const record of activeSounds.values()) {
        if (record.filename === filename && record.isLooping && record.soundInstance && !record.isStopped) {
          try {
            record.soundInstance.setVolume(calculatedVolume);
          } catch {}
          return;
        }
      }
      // Stop any existing instance of this looping sound before creating new
      this.stop(filename);
    }

    soundCounter++;
    const currentSoundId = soundCounter;
    const soundRecord = {
      id: currentSoundId,
      name,
      filename,
      isMusic,
      isDriving,
      isLooping,
      soundInstance: null,
      isStopped: false,
    };
    activeSounds.set(currentSoundId, soundRecord);

    const platformFileName = Platform.OS === 'android' ? filename.replace(/\.mp3$/, '') : filename;
    const bundlePath = Platform.OS === 'android' ? '' : (Sound.MAIN_BUNDLE || '');

    const createAndPlay = (targetFileName, isRetry = false) => {
      try {
        let soundInstance = null;
        soundInstance = new Sound(targetFileName, bundlePath, (error) => {
          // If stopped while preparing, release immediately and exit
          if (soundRecord.isStopped) {
            if (soundInstance) {
              try { soundInstance.release(); } catch {}
            }
            activeSounds.delete(currentSoundId);
            return;
          }

          // If driving became inactive while preparing, release and exit
          if (soundRecord.isDriving && !isDrivingActive && !force) {
            soundRecord.isStopped = true;
            if (soundInstance) {
              try { soundInstance.release(); } catch {}
            }
            activeSounds.delete(currentSoundId);
            return;
          }

          if (error) {
            // Check if fallback resource exists
            const fallback = !isRetry ? FALLBACK_RESOURCE_MAP[targetFileName] : null;
            if (fallback && !soundRecord.isStopped) {
              createAndPlay(fallback, true);
              return;
            }
            console.warn('[SoundManager] Sound load note:', targetFileName, error?.message || error);
            activeSounds.delete(currentSoundId);
            return;
          }

          if (!soundInstance) {
            activeSounds.delete(currentSoundId);
            return;
          }

          soundRecord.soundInstance = soundInstance;

          try {
            soundInstance.setVolume(calculatedVolume);
            soundInstance.setNumberOfLoops(isLooping ? -1 : 0);

            soundInstance.play((success) => {
              if (!isLooping) {
                try {
                  soundInstance.release();
                } catch {}
                activeSounds.delete(currentSoundId);
              }
            });
          } catch (playErr) {
            console.warn('[SoundManager] play error:', playErr);
            activeSounds.delete(currentSoundId);
          }
        });

        soundRecord.soundInstance = soundInstance;
      } catch (err) {
        console.warn('[SoundManager] Play error for', targetFileName, err);
        activeSounds.delete(currentSoundId);
      }
    };

    createAndPlay(platformFileName);
  },

  /**
   * Stop and release a specific playing sound
   */
  stop(name) {
    const filename = resolveSoundName(name);
    if (!filename) return;
    const targetBase = filename.replace(/\.mp3$/, '').toLowerCase();
    for (const [id, record] of activeSounds.entries()) {
      const recBase = record.filename.replace(/\.mp3$/, '').toLowerCase();
      if (recBase === targetBase || record.filename === filename) {
        record.isStopped = true;
        if (record.soundInstance) {
          try {
            record.soundInstance.stop();
            record.soundInstance.release();
          } catch {}
        }
        activeSounds.delete(id);
      }
    }
  },

  /**
   * Stop and release all active driving sounds (engine, racing music, boost, brake, dash)
   */
  stopDrivingSounds() {
    for (const [id, record] of activeSounds.entries()) {
      if (record.isDriving) {
        record.isStopped = true;
        if (record.soundInstance) {
          try {
            record.soundInstance.stop();
            record.soundInstance.release();
          } catch {}
        }
        activeSounds.delete(id);
      }
    }
  },

  /**
   * Stop and release all active sounds
   */
  stopAll() {
    for (const record of activeSounds.values()) {
      record.isStopped = true;
      if (record.soundInstance) {
        try {
          record.soundInstance.stop();
          record.soundInstance.release();
        } catch {}
      }
    }
    activeSounds.clear();
  },

  /**
   * Set Driving Active mode:
   * When car is on track: setDrivingActive(true) allows driving sounds.
   * When car finishes/crashes/pauses/exits: setDrivingActive(false) immediately cuts all driving sounds!
   */
  setDrivingActive(active) {
    isDrivingActive = Boolean(active);
    if (!isDrivingActive) {
      this.stopDrivingSounds();
    }
  },

  isDriving() {
    return isDrivingActive;
  },

  // Game Flow Convenience Methods
  playEffect(key, force = false) {
    this.play(key, false, 1, force);
  },

  playStartSound(force = false) {
    this.play('engine_start.mp3', false, 1.0, force);
  },

  playMovingSound(force = false) {
    this.startEngineLoop(force);
  },

  stopMovingSound() {
    this.stopEngineLoop();
  },

  playBrake(force = false) {
    this.play('car_break', false, 1.0, force);
  },

  stopBrake() {
    this.stop('car_break');
    this.stop('break_effect');
  },

  playBrakeSound(force = false) {
    this.playBrake(force);
  },

  stopBrakeSound() {
    this.stopBrake();
  },

  playDash(force = false) {
    this.play('car_dash', false, 1.0, force);
  },

  playHealthSound(force = false) {
    this.play('health', false, 1.0, force);
  },

  playBlastSound(force = false) {
    this.play('blast', false, 1.0, force);
  },

  playCrashSound(force = false) {
    this.play('blast', false, 1.0, force);
  },

  playAccidentSound(force = false) {
    this.play('car_accident', false, 1.0, force);
  },

  playCollisionSound(force = false) {
    this.play('car_collision', false, 1.0, force);
  },

  playHonkSound(force = false) {
    this.play('car_honk', false, 1.0, force);
  },

  playHornSound(force = false) {
    this.play('car_horn', false, 1.0, force);
  },

  playBoostSound(force = false) {
    this.play('car_boosting', false, 1.0, force);
  },

  stopBoostSound() {
    this.stop('car_boosting');
  },

  playCoinSound(force = false) {
    this.play('coin_collecting', false, 1.0, force);
  },

  playCoinVoice(force = false) {
    this.play('coin_voice', false, 1.0, force);
  },

  playCountdownSound(force = false) {
    this.play('countdown_3_2_1_go', false, 1.0, force);
  },

  playMusic(force = false) {
    this.play('racing.mp3', true, 0.35, force);
  },

  stopMusic() {
    this.stop('racing.mp3');
  },

  pauseMusic() {
    for (const record of activeSounds.values()) {
      if (record.filename === 'racing.mp3' && record.soundInstance && !record.isStopped) {
        try {
          record.soundInstance.pause();
        } catch {}
      }
    }
  },

  startEngineLoop(force = false) {
    this.play('car_engine2.mp3', true, 0.7, force);
  },

  stopEngineLoop() {
    this.stop('car_engine2.mp3');
  },

  updateMovingSpeed(speedRatio) {
    if (!isDrivingActive) return;
    const clamped = Math.max(0, Math.min(1, speedRatio));
    const targetVol = (0.45 + clamped * 0.45) * effectsVolume;
    for (const record of activeSounds.values()) {
      if (record.filename === 'car_engine2.mp3' && record.soundInstance && !record.isStopped) {
        try {
          record.soundInstance.setVolume(targetVol);
        } catch {}
      }
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
    for (const record of activeSounds.values()) {
      if (record.filename === 'racing.mp3' && record.soundInstance && !record.isStopped) {
        try {
          record.soundInstance.setVolume(musicVolume);
        } catch {}
      }
    }
  },

  setEffectsVolume(volume) {
    effectsVolume = Math.max(0, Math.min(1, volume));
    for (const record of activeSounds.values()) {
      if (record.filename === 'car_engine2.mp3' && record.soundInstance && !record.isStopped) {
        try {
          record.soundInstance.setVolume(effectsVolume * 0.6);
        } catch {}
      }
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
export const playHornSound = SoundManager.playHornSound.bind(SoundManager);
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
export const setDrivingActive = SoundManager.setDrivingActive.bind(SoundManager);
export const isDriving = SoundManager.isDriving.bind(SoundManager);
export const stopDrivingSounds = SoundManager.stopDrivingSounds.bind(SoundManager);

export default SoundManager;

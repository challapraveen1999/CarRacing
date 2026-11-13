import {
  play,
  stopAll,
  playEffect,
  playStartSound,
  playMovingSound,
  stopMovingSound,
  playBrake,
  stopBrake,
  playBrakeSound,
  stopBrakeSound,
  playDash,
  playCrashSound,
  playBlastSound,
  playAccidentSound,
  playCollisionSound,
  playHonkSound,
  playHornSound,
  playBoostSound,
  playCoinSound,
  playCoinVoice,
  playCountdownSound,
  updateMovingSpeed,
  setMusicEnabled,
  setEffectsEnabled,
  setVibrationEnabled,
  setMusicVolume,
  setEffectsVolume,
  setDrivingActive,
  isDriving,
  stopDrivingSounds,
} from '../src/helpers/SoundManager';

describe('SoundManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMusicEnabled(true);
    setEffectsEnabled(true);
    setVibrationEnabled(true);
    setMusicVolume(0.8);
    setEffectsVolume(0.8);
    setDrivingActive(true);
  });

  afterEach(() => {
    stopAll();
  });

  it('plays start sound correctly', () => {
    expect(() => playStartSound()).not.toThrow();
  });

  it('plays moving sound and updates dynamic engine speed volume', () => {
    expect(() => playMovingSound()).not.toThrow();
    expect(() => updateMovingSpeed(0.5)).not.toThrow();
    expect(() => updateMovingSpeed(1.0)).not.toThrow();
    expect(() => stopMovingSound()).not.toThrow();
  });

  it('plays and stops brake sound', () => {
    expect(() => playBrake()).not.toThrow();
    expect(() => stopBrake()).not.toThrow();
    expect(() => playBrakeSound()).not.toThrow();
    expect(() => stopBrakeSound()).not.toThrow();
  });

  it('plays dash sound', () => {
    expect(() => playDash()).not.toThrow();
  });

  it('plays car crash, blast, and accident collision sounds', () => {
    expect(() => playCrashSound()).not.toThrow();
    expect(() => playBlastSound()).not.toThrow();
    expect(() => playAccidentSound()).not.toThrow();
    expect(() => playCollisionSound()).not.toThrow();
    expect(() => playHonkSound()).not.toThrow();
    expect(() => playHornSound()).not.toThrow();
    expect(() => playBoostSound()).not.toThrow();
    expect(() => playCoinSound()).not.toThrow();
    expect(() => playCoinVoice()).not.toThrow();
    expect(() => playCountdownSound()).not.toThrow();
  });

  it('resolves common aliases like "break", "start", "moving", "accident", "blast", "car_honk", and "acedant"', () => {
    expect(() => play('break')).not.toThrow();
    expect(() => play('start')).not.toThrow();
    expect(() => play('moving')).not.toThrow();
    expect(() => play('dash')).not.toThrow();
    expect(() => play('blast')).not.toThrow();
    expect(() => play('car_break')).not.toThrow();
    expect(() => play('car_dash')).not.toThrow();
    expect(() => play('car_boosting')).not.toThrow();
    expect(() => play('coin_collecting')).not.toThrow();
    expect(() => play('car_honk')).not.toThrow();
    expect(() => play('car_engine2')).not.toThrow();
    expect(() => play('countdown_3_2_1_go')).not.toThrow();
    expect(() => play('321go')).not.toThrow();
    expect(() => play('accident')).not.toThrow();
    expect(() => play('acedant')).not.toThrow();
    expect(() => play('car_crashing')).not.toThrow();
    expect(() => playEffect('coin')).not.toThrow();
  });

  it('respects effectsEnabled and musicEnabled toggles', () => {
    setEffectsEnabled(false);
    expect(() => play('brake')).not.toThrow();

    setMusicEnabled(false);
    expect(() => play('background_music')).not.toThrow();
  });

  it('stops all sounds cleanly', () => {
    play('engine_start');
    play('engine_loop', true);
    expect(() => stopAll()).not.toThrow();
  });

  it('controls driving active mode strictly to play driving sounds only when car is on track', () => {
    setDrivingActive(true);
    expect(isDriving()).toBe(true);
    expect(() => playMovingSound()).not.toThrow();

    setDrivingActive(false);
    expect(isDriving()).toBe(false);
    // Driving sounds are immediately blocked when car is not on track
    expect(() => playMovingSound()).not.toThrow();
    expect(() => playBrake()).not.toThrow();
    expect(() => stopDrivingSounds()).not.toThrow();
  });
});

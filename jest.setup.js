/* eslint-disable no-undef */
jest.mock('react-native-sound', () => {
  return class MockSound {
    static setCategory = jest.fn();
    static MAIN_BUNDLE = 'MAIN_BUNDLE';
    constructor(name, bundle, cb) {
      this.name = name;
      const callback = typeof bundle === 'function' ? bundle : cb;
      if (typeof callback === 'function') {
        process.nextTick(() => callback(null));
      }
    }
    setNumberOfLoops = jest.fn();
    setVolume = jest.fn();
    play = jest.fn(cb => cb && cb(true));
    stop = jest.fn(cb => cb && cb());
    pause = jest.fn();
    release = jest.fn();
    setCurrentTime = jest.fn();
  };
});

const store = {};
const mockAsyncStorage = {
  setItem: jest.fn((k, v) => {
    store[k] = v;
    return Promise.resolve(null);
  }),
  getItem: jest.fn(k => Promise.resolve(store[k] || null)),
  removeItem: jest.fn(k => {
    delete store[k];
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach(k => delete store[k]);
    return Promise.resolve(null);
  }),
  multiGet: jest.fn(keys =>
    Promise.resolve(keys.map(k => [k, store[k] || null])),
  ),
  multiSet: jest.fn(pairs => {
    pairs.forEach(([k, v]) => {
      store[k] = v;
    });
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn(keys => {
    keys.forEach(k => delete store[k]);
    return Promise.resolve(null);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

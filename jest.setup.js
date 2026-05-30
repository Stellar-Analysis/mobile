import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    API_BASE_URL: 'http://localhost:8080',
    API_TIMEOUT: '30000',
    STELLAR_NETWORK: 'testnet',
  },
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-keychain', () => {
  let store = null;
  return {
    setGenericPassword: jest.fn((username, password) => {
      store = { username, password };
      return Promise.resolve(true);
    }),
    getGenericPassword: jest.fn(() => Promise.resolve(store ? store : false)),
    resetGenericPassword: jest.fn(() => {
      store = null;
      return Promise.resolve(true);
    }),
    ACCESSIBLE: {},
    ACCESS_CONTROL: {},
    BIOMETRY_TYPE: {
      TOUCH_ID: 'TouchID',
      FACE_ID: 'FaceID',
      FINGERPRINT: 'Fingerprint',
    },
  };
});

jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  BiometryTypes: {
    TouchID: 'TouchID',
    FaceID: 'FaceID',
    Biometrics: 'Biometrics',
  },
  default: jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(() => Promise.resolve({ available: false })),
    simplePrompt: jest.fn(() => Promise.resolve({ success: false })),
  })),
}));

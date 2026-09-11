import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'stellar-analysis-storage',
  encryptionKey: 'stellar-analysis-encryption-key',
});

export const storageUtils = {
  setItem: (key: string, value: string) => storage.set(key, value),
  getItem: (key: string) => storage.getString(key),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clearAll(),
};

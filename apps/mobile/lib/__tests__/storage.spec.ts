import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { __resetStore as resetSecureStore } from '../../__mocks__/expo-secure-store';
import { __resetStore as resetAsyncStore } from '../../__mocks__/@react-native-async-storage/async-storage';
import { secureStorage, appStorage } from '../storage';
import { STORAGE_KEYS } from '../constants';

beforeEach(() => {
  jest.clearAllMocks();
  resetSecureStore();
  resetAsyncStore();
});

describe('secureStorage', () => {
  it('stores and retrieves access token', async () => {
    await secureStorage.setAccessToken('token-123');
    const result = await secureStorage.getAccessToken();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'token-123');
    expect(result).toBe('token-123');
  });

  it('stores and retrieves refresh token', async () => {
    await secureStorage.setRefreshToken('refresh-abc');
    const result = await secureStorage.getRefreshToken();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.REFRESH_TOKEN,
      'refresh-abc'
    );
    expect(result).toBe('refresh-abc');
  });

  it('returns null when no token stored', async () => {
    const result = await secureStorage.getAccessToken();
    expect(result).toBeNull();
  });

  it('clears both tokens', async () => {
    await secureStorage.setAccessToken('a');
    await secureStorage.setRefreshToken('b');
    await secureStorage.clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);

    const access = await secureStorage.getAccessToken();
    const refresh = await secureStorage.getRefreshToken();
    expect(access).toBeNull();
    expect(refresh).toBeNull();
  });
});

describe('appStorage', () => {
  it('stores and retrieves a string value', async () => {
    await appStorage.set('key', 'value');
    const result = await appStorage.get('key');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('key', 'value');
    expect(result).toBe('value');
  });

  it('returns null for missing key', async () => {
    const result = await appStorage.get('missing');
    expect(result).toBeNull();
  });

  it('removes a key', async () => {
    await appStorage.set('key', 'value');
    await appStorage.remove('key');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('key');
    const result = await appStorage.get('key');
    expect(result).toBeNull();
  });

  it('stores and retrieves JSON', async () => {
    const data = { theme: 'dark', volume: 0.5 };
    await appStorage.setJSON('prefs', data);
    const result = await appStorage.getJSON<typeof data>('prefs');

    expect(result).toEqual(data);
  });

  it('returns null for missing JSON key', async () => {
    const result = await appStorage.getJSON('missing');
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON', async () => {
    // Directly set bad JSON via the mock
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json{{{');
    const result = await appStorage.getJSON('bad');
    expect(result).toBeNull();
  });
});

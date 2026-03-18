import { __resetStore as resetSecureStore } from '../../__mocks__/expo-secure-store';
import { request, ApiException, getCachedAccessToken, setCachedAccessToken } from '../api';
import { secureStorage } from '../storage';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  resetSecureStore();
  setCachedAccessToken(null);
});

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    headers: new Headers(),
  } as Response;
}

describe('ApiException', () => {
  it('stores bilingual error messages', () => {
    const err = new ApiException(
      { code: 'BAD', message: 'bad', message_en: 'Bad thing', message_fr: 'Mauvaise chose' },
      422
    );
    expect(err.code).toBe('BAD');
    expect(err.statusCode).toBe(422);
    expect(err.getLocalizedMessage('en')).toBe('Bad thing');
    expect(err.getLocalizedMessage('fr')).toBe('Mauvaise chose');
  });

  it('falls back to generic message when fields missing', () => {
    const err = new ApiException({ code: '', message: '' });
    expect(err.message_en).toBe('An error occurred');
    expect(err.message_fr).toBe('Une erreur est survenue');
    expect(err.code).toBe('UNKNOWN_ERROR');
  });
});

describe('request()', () => {
  it('makes a GET request with auth header from cache', async () => {
    setCachedAccessToken('cached-token');
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

    const result = await request('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer cached-token',
        }),
      })
    );
    expect(result).toEqual({ id: 1 });
  });

  it('falls back to SecureStore when no cached token', async () => {
    await secureStorage.setAccessToken('stored-token');
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer stored-token',
        }),
      })
    );
    // Should also populate the cache
    expect(getCachedAccessToken()).toBe('stored-token');
  });

  it('sends no auth header when no token available', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/api/public');

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it('serializes body as JSON for POST requests', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ created: true }));

    await request('/api/items', {
      method: 'POST',
      body: { name: 'test' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    );
  });

  it('returns empty object for 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 204));

    const result = await request('/api/delete-thing', { method: 'DELETE' });
    expect(result).toEqual({});
  });

  it('throws ApiException on error response', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          code: 'NOT_FOUND',
          message: 'Not found',
          message_en: 'Resource not found',
          message_fr: 'Ressource introuvable',
        },
        404
      )
    );

    await expect(request('/api/missing')).rejects.toThrow(ApiException);

    try {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ code: 'NOT_FOUND', message: 'Not found' }, 404)
      );
      await request('/api/missing');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).statusCode).toBe(404);
    }
  });

  it('uses NETWORK_ERROR fallback when error response is not JSON', async () => {
    const badResponse = {
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
      headers: new Headers(),
    } as unknown as Response;
    mockFetch.mockResolvedValueOnce(badResponse);

    try {
      await request('/api/broken');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).code).toBe('NETWORK_ERROR');
    }
  });

  it('merges custom headers', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/api/test', {
      headers: { 'X-Custom': 'value' } as Record<string, string>,
    });

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['X-Custom']).toBe('value');
    expect(callHeaders['Content-Type']).toBe('application/json');
  });
});

describe('token refresh on 401', () => {
  it('retries request after successful token refresh', async () => {
    setCachedAccessToken('expired-token');
    await secureStorage.setRefreshToken('valid-refresh');

    // First call: 401
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));
    // Refresh call: success
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    );
    // Retry: success
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: 'success' }));

    const result = await request('/api/protected');

    expect(result).toEqual({ data: 'success' });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Verify refresh endpoint was called
    expect(mockFetch.mock.calls[1][0]).toBe('http://localhost:3001/api/auth/refresh');
  });

  it('clears tokens when refresh fails', async () => {
    setCachedAccessToken('expired');
    await secureStorage.setRefreshToken('bad-refresh');

    // First call: 401
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));
    // Refresh call: fails
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Invalid' }, 401));

    await expect(request('/api/protected')).rejects.toThrow(ApiException);
    expect(getCachedAccessToken()).toBeNull();
  });

  it('does not retry on 401 if already a retry', async () => {
    setCachedAccessToken('token');

    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));

    // Call with _isRetry = true
    await expect(request('/api/test', {}, true)).rejects.toThrow(ApiException);
    // Should only call fetch once (no refresh attempt)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent refresh attempts', async () => {
    setCachedAccessToken('expired');
    await secureStorage.setRefreshToken('valid-refresh');

    // Two 401 responses
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));
    // Single refresh call
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ accessToken: 'new-token', refreshToken: 'new-refresh' })
    );
    // Two retry responses
    mockFetch.mockResolvedValueOnce(jsonResponse({ a: 1 }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ b: 2 }));

    const [r1, r2] = await Promise.all([request('/api/endpoint-a'), request('/api/endpoint-b')]);

    expect(r1).toEqual({ a: 1 });
    expect(r2).toEqual({ b: 2 });

    // Should only have ONE refresh call, not two
    const refreshCalls = mockFetch.mock.calls.filter(
      call => call[0] === 'http://localhost:3001/api/auth/refresh'
    );
    expect(refreshCalls).toHaveLength(1);
  });
});

import { renderHook, act } from '@testing-library/react-native';
import { useErrorHandling } from '@hooks/useErrorHandling';

jest.mock('@services/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { logger } from '@services/logger';

describe('useErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with no error', () => {
      const { result } = renderHook(() => useErrorHandling());
      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.errorCount).toBe(0);
    });
  });

  describe('captureError', () => {
    it('sets hasError and stores the error', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError(new Error('something failed'));
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('something failed');
    });

    it('increments errorCount on each call', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => { result.current.captureError(new Error('first')); });
      act(() => { result.current.captureError(new Error('second')); });

      expect(result.current.errorCount).toBe(2);
    });

    it('calls logger.error with context', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError(new Error('network timeout'), { endpoint: '/api/v1/data' });
      });

      expect(logger.error).toHaveBeenCalledTimes(1);
      const [, , context] = (logger.error as jest.Mock).mock.calls[0];
      expect(context).toMatchObject({ endpoint: '/api/v1/data' });
    });

    it('handles non-Error string inputs gracefully', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError('plain string error');
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.error?.message).toBe('plain string error');
    });

    it('handles unknown inputs without throwing', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError(null);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.error?.message).toBe('An unexpected error occurred');
    });

    it('marks network errors as recoverable', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError(new Error('fetch failed due to network'));
      });

      expect(result.current.error?.recoverable).toBe(true);
    });

    it('marks non-network errors as not recoverable', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError(new Error('validation error'));
      });

      expect(result.current.error?.recoverable).toBe(false);
    });
  });

  describe('sensitive data redaction', () => {
    it('redacts Stellar secret keys from error messages', () => {
      const { result } = renderHook(() => useErrorHandling());
      const secretKey = 'SBCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

      act(() => {
        result.current.captureError(new Error(`secret: ${secretKey}`));
      });

      expect(result.current.error?.message).not.toContain(secretKey);
      expect(result.current.error?.message).toContain('[REDACTED]');
    });

    it('redacts JWT tokens from error messages', () => {
      const { result } = renderHook(() => useErrorHandling());
      const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36';

      act(() => {
        result.current.captureError(new Error(`token=${jwt}`));
      });

      expect(result.current.error?.message).not.toContain(jwt);
    });

    it('does not redact generic error messages', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.captureError(new Error('Payment corridor not available'));
      });

      expect(result.current.error?.message).toBe('Payment corridor not available');
    });
  });

  describe('clearError', () => {
    it('clears the error and resets hasError', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => { result.current.captureError(new Error('something')); });
      act(() => { result.current.clearError(); });

      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('does not reset errorCount', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => { result.current.captureError(new Error('one')); });
      act(() => { result.current.clearError(); });

      expect(result.current.errorCount).toBe(1);
    });
  });

  describe('resetErrorCount', () => {
    it('resets errorCount to zero', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => { result.current.captureError(new Error('a')); });
      act(() => { result.current.captureError(new Error('b')); });
      act(() => { result.current.resetErrorCount(); });

      expect(result.current.errorCount).toBe(0);
    });
  });
});

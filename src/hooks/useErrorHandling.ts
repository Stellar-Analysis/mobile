import { useState, useCallback, useRef } from 'react';
import { logger } from '@services/logger';

export interface AppError {
  message: string;
  code?: string;
  recoverable: boolean;
  timestamp: number;
}

export interface ErrorHandlingState {
  error: AppError | null;
  hasError: boolean;
  errorCount: number;
}

export interface ErrorHandlingActions {
  captureError: (error: unknown, context?: Record<string, unknown>) => void;
  clearError: () => void;
  resetErrorCount: () => void;
}

const SENSITIVE_PATTERNS = [
  /G[A-Z0-9]{55}/,           // Stellar public key
  /S[A-Z0-9]{55}/,           // Stellar secret key
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,    // email
];

function sanitizeErrorMessage(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

function normalizeError(error: unknown): AppError {
  if (error instanceof Error) {
    const isNetworkError =
      error.name === 'NetworkError' ||
      error.message.includes('fetch') ||
      error.message.includes('network');

    return {
      message: sanitizeErrorMessage(error.message),
      code: error.name,
      recoverable: isNetworkError,
      timestamp: Date.now(),
    };
  }

  if (typeof error === 'string') {
    return {
      message: sanitizeErrorMessage(error),
      recoverable: false,
      timestamp: Date.now(),
    };
  }

  return {
    message: 'An unexpected error occurred',
    recoverable: false,
    timestamp: Date.now(),
  };
}

export function useErrorHandling(): ErrorHandlingState & ErrorHandlingActions {
  const [state, setState] = useState<ErrorHandlingState>({
    error: null,
    hasError: false,
    errorCount: 0,
  });

  const errorCountRef = useRef(0);

  const captureError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    const appError = normalizeError(error);
    errorCountRef.current += 1;

    logger.error('useErrorHandling: error captured', error instanceof Error ? error : new Error(String(error)), {
      code: appError.code,
      recoverable: appError.recoverable,
      errorCount: errorCountRef.current,
      ...context,
    });

    setState({
      error: appError,
      hasError: true,
      errorCount: errorCountRef.current,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, hasError: false }));
  }, []);

  const resetErrorCount = useCallback(() => {
    errorCountRef.current = 0;
    setState(prev => ({ ...prev, errorCount: 0 }));
  }, []);

  return {
    ...state,
    captureError,
    clearError,
    resetErrorCount,
  };
}

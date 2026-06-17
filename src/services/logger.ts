/**
 * Secure Mobile Logging Service
 * 
 * Features:
 * - Comprehensive sensitive data redaction
 * - Environment-aware logging levels
 * - Structured logging with metadata
 * - Opt-in debug mode for production
 * - Native logging integration
 * - Error tracking with automatic PII filtering
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@services/logger';
 * 
 * logger.debug('User action', { action: 'tap', screen: 'home' });
 * logger.info('API call completed', { endpoint: '/api/data', status: 200 });
 * logger.warn('Deprecated feature used', { feature: 'oldAPI' });
 * logger.error('Network request failed', error, { endpoint: '/api/auth' });
 * ```
 */

import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';

// Environment detection
const isDevelopment = __DEV__;
const enableDebugMode = __DEV__ || global.__FLIPPER__;

// Enable production logging only in debug builds or when explicitly enabled
const enableProductionLogging = isDevelopment || 
  (typeof global !== 'undefined' && global.__DEV_LOGGING_ENABLED__);

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogContext {
  userId?: string;
  screenName?: string;
  feature?: string;
  platform: string;
  buildType: 'debug' | 'release';
  timestamp: string;
}

/**
 * Comprehensive sensitive data redaction for mobile logging
 */
function redactSensitiveData(data: unknown): unknown {
  if (typeof data === 'string') {
    let result = data;
    
    // Redact Stellar addresses (56 chars starting with G)
    result = result.replace(/G[A-Z0-9]{55}/g, 'G****[REDACTED]');
    
    // Redact Stellar secret keys (56 chars starting with S)  
    result = result.replace(/S[A-Z0-9]{55}/g, 'S****[REDACTED_SECRET]');
    
    // Redact JWT tokens
    result = result.replace(/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, '[REDACTED_JWT]');
    
    // Redact API keys and long tokens (32+ chars)
    result = result.replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[REDACTED_KEY]');
    
    // Redact email addresses
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '****@[REDACTED]');
    
    // Redact phone numbers
    result = result.replace(/(\+\d{1,3})\d{7,}/g, '$1****[REDACTED]');
    
    // Redact potential credit card numbers
    result = result.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-[REDACTED]');
    
    // Redact potential SSNs or government IDs
    result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-[REDACTED]');
    
    // Redact mnemonic phrases (12/24 common words)
    if (result.split(' ').length >= 12) {
      const words = result.split(' ');
      if (words.length === 12 || words.length === 24) {
        result = `[${words.length}_WORD_MNEMONIC_REDACTED]`;
      }
    }
    
    return result;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive field names (case-insensitive)
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('credential') ||
        lowerKey.includes('private') ||
        lowerKey.includes('seed') ||
        lowerKey.includes('mnemonic') ||
        lowerKey.includes('jwt') ||
        lowerKey.includes('bearer') ||
        lowerKey.includes('signature') ||
        lowerKey.includes('otp') ||
        lowerKey.includes('pin')
      ) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    
    return redacted;
  }
  
  return data;
}

/**
 * Create base context for all log entries
 */
function createBaseContext(additionalContext?: Partial<LogContext>): LogContext {
  return {
    platform: Platform.OS,
    buildType: isDevelopment ? 'debug' : 'release',
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Format log message for console output
 */
function formatMessage(level: string, message: string, context: LogContext): string {
  return `[${context.timestamp}] [${level}] [${context.platform}] ${message}`;
}

/**
 * Send error to crash reporting service
 */
function sendToErrorTracking(
  error: Error,
  message: string,
  metadata?: LogMetadata
): void {
  try {
    if (!crashlytics || isDevelopment) {
      return;
    }

    // Set user context if available
    if (metadata?.userId && typeof metadata.userId === 'string') {
      crashlytics().setUserId(metadata.userId);
    }

    // Add custom attributes (redacted)
    const redactedMetadata = metadata ? redactSensitiveData(metadata) : {};
    Object.entries(redactedMetadata).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        crashlytics().setAttribute(key, String(value));
      }
    });

    // Record the error
    crashlytics().recordError(error);
    
    // Log a custom event for additional context
    crashlytics().log(`Error: ${message}`);
    
  } catch (trackingError) {
    // Fallback: log tracking failure without exposing the original error
    if (isDevelopment) {
      console.warn('Failed to send error to tracking service', trackingError);
    }
  }
}

/**
 * Normalize error objects for consistent logging
 */
function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown error occurred');
  }
}

/**
 * Main logger interface
 */
export const logger = {
  /**
   * Debug-level logging
   * Only outputs in development or when debug mode is enabled
   */
  debug: (message: string, metadata?: LogMetadata, context?: Partial<LogContext>): void => {
    if (!enableDebugMode) {
      return;
    }
    
    const baseContext = createBaseContext(context);
    const redactedMetadata = metadata ? redactSensitiveData(metadata) : undefined;
    
    if (redactedMetadata) {
      console.debug(formatMessage('DEBUG', message, baseContext), redactedMetadata);
    } else {
      console.debug(formatMessage('DEBUG', message, baseContext));
    }
  },

  /**
   * Info-level logging
   * Outputs in development or when production logging is enabled
   */
  info: (message: string, metadata?: LogMetadata, context?: Partial<LogContext>): void => {
    if (!isDevelopment && !enableProductionLogging) {
      return;
    }
    
    const baseContext = createBaseContext(context);
    const redactedMetadata = metadata ? redactSensitiveData(metadata) : undefined;
    
    if (redactedMetadata) {
      console.info(formatMessage('INFO', message, baseContext), redactedMetadata);
    } else {
      console.info(formatMessage('INFO', message, baseContext));
    }
  },

  /**
   * Warning-level logging
   * Always outputs but with redacted sensitive data
   */
  warn: (message: string, metadata?: LogMetadata, context?: Partial<LogContext>): void => {
    const baseContext = createBaseContext(context);
    const redactedMetadata = metadata ? redactSensitiveData(metadata) : undefined;
    
    if (redactedMetadata) {
      console.warn(formatMessage('WARN', message, baseContext), redactedMetadata);
    } else {
      console.warn(formatMessage('WARN', message, baseContext));
    }
  },

  /**
   * Error-level logging
   * Always outputs and sends to crash reporting in production
   */
  error: (
    message: string, 
    error?: Error | unknown, 
    metadata?: LogMetadata,
    context?: Partial<LogContext>
  ): void => {
    const baseContext = createBaseContext(context);
    const redactedMetadata = metadata ? redactSensitiveData(metadata) : undefined;
    const normalizedError = error ? normalizeError(error) : new Error(message);

    // Always log to console with redacted data
    if (redactedMetadata) {
      console.error(formatMessage('ERROR', message, baseContext), normalizedError, redactedMetadata);
    } else {
      console.error(formatMessage('ERROR', message, baseContext), normalizedError);
    }

    // Send to crash reporting in production builds
    if (!isDevelopment) {
      sendToErrorTracking(normalizedError, message, { ...redactedMetadata, ...baseContext });
    }
  },

  /**
   * Network request logging
   */
  network: (
    method: string,
    url: string,
    status?: number,
    duration?: number,
    metadata?: LogMetadata,
    context?: Partial<LogContext>
  ): void => {
    if (!enableDebugMode && !enableProductionLogging) {
      return;
    }

    const baseContext = createBaseContext(context);
    const networkData = {
      method,
      url: redactSensitiveData(url),
      status,
      duration: duration ? `${duration}ms` : undefined,
      ...metadata,
    };
    const redactedNetworkData = redactSensitiveData(networkData);

    const logMessage = `Network ${method} ${url}${status ? ` → ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    
    if (status && status >= 400) {
      logger.warn(logMessage, redactedNetworkData as LogMetadata, baseContext);
    } else {
      logger.debug(logMessage, redactedNetworkData as LogMetadata, baseContext);
    }
  },

  /**
   * User action logging
   */
  userAction: (
    action: string,
    metadata?: LogMetadata,
    context?: Partial<LogContext>
  ): void => {
    if (!enableDebugMode && !enableProductionLogging) {
      return;
    }

    const baseContext = createBaseContext(context);
    logger.info(`User action: ${action}`, metadata, baseContext);
  },

  /**
   * Performance measurement logging
   */
  performance: (
    label: string,
    duration: number,
    metadata?: LogMetadata,
    context?: Partial<LogContext>
  ): void => {
    if (!enableDebugMode) {
      return;
    }

    const baseContext = createBaseContext(context);
    const perfData = { duration: `${duration}ms`, ...metadata };
    logger.debug(`Performance: ${label}`, perfData, baseContext);
  },

  /**
   * Auth-related logging (extra security for sensitive operations)
   */
  auth: (
    event: string,
    metadata?: LogMetadata,
    context?: Partial<LogContext>
  ): void => {
    const baseContext = createBaseContext(context);
    const authMetadata = metadata ? redactSensitiveData(metadata) : undefined;
    
    // Auth events are important for security - always log but redacted
    logger.info(`Auth: ${event}`, authMetadata as LogMetadata, baseContext);
  },
};

/**
 * Create a scoped logger with context
 */
export function createScopedLogger(
  scope: string,
  defaultContext?: Partial<LogContext>
) {
  return {
    debug: (message: string, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.debug(`[${scope}] ${message}`, metadata, { ...defaultContext, ...context }),
    info: (message: string, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.info(`[${scope}] ${message}`, metadata, { ...defaultContext, ...context }),
    warn: (message: string, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.warn(`[${scope}] ${message}`, metadata, { ...defaultContext, ...context }),
    error: (message: string, error?: Error | unknown, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.error(`[${scope}] ${message}`, error, metadata, { ...defaultContext, ...context }),
    network: (method: string, url: string, status?: number, duration?: number, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.network(method, url, status, duration, metadata, { ...defaultContext, ...context }),
    userAction: (action: string, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.userAction(`[${scope}] ${action}`, metadata, { ...defaultContext, ...context }),
    performance: (label: string, duration: number, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.performance(`[${scope}] ${label}`, duration, metadata, { ...defaultContext, ...context }),
    auth: (event: string, metadata?: LogMetadata, context?: Partial<LogContext>) =>
      logger.auth(`[${scope}] ${event}`, metadata, { ...defaultContext, ...context }),
  };
}

/**
 * Performance measurement wrapper
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>,
  metadata?: LogMetadata,
  context?: Partial<LogContext>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.performance(label, duration, metadata, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${label} failed after ${duration}ms`, error as Error, metadata, context);
    throw error;
  }
}

// Export for testing
export const __testing__ = {
  redactSensitiveData,
  createBaseContext,
  formatMessage,
  normalizeError,
  isDevelopment,
  enableDebugMode,
  enableProductionLogging,
};
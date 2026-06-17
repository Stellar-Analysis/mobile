/**
 * Tests for mobile secure logging service
 */

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  __esModule: true,
  default: () => ({
    setUserId: jest.fn(),
    setAttribute: jest.fn(),
    recordError: jest.fn(),
    log: jest.fn(),
  })
}));

// Mock console methods
const originalConsole = global.console;
let mockConsole: any;

beforeEach(() => {
  mockConsole = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  global.console = mockConsole;
});

afterEach(() => {
  global.console = originalConsole;
});

// Mock __DEV__ global
const mockDev = (isDev: boolean) => {
  const originalDev = (global as any).__DEV__;
  (global as any).__DEV__ = isDev;
  return () => {
    (global as any).__DEV__ = originalDev;
  };
};

import { logger, createScopedLogger, measurePerformance, __testing__ } from '../logger';

describe('Mobile Logger Redaction', () => {
  describe('redactSensitiveData', () => {
    it('should redact Stellar addresses', () => {
      const data = "Account: GCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R";
      const result = __testing__.redactSensitiveData(data);
      expect(result).toContain('G****[REDACTED]');
      expect(result).not.toContain('GCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R');
    });

    it('should redact Stellar secret keys', () => {
      const data = "Secret: SCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R";
      const result = __testing__.redactSensitiveData(data);
      expect(result).toContain('S****[REDACTED_SECRET]');
      expect(result).not.toContain('SCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R');
    });

    it('should redact JWT tokens', () => {
      const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const data = `Token: ${jwt}`;
      const result = __testing__.redactSensitiveData(data);
      expect(result).toContain('[REDACTED_JWT]');
      expect(result).not.toContain(jwt);
    });

    it('should redact mnemonic phrases', () => {
      const mnemonic12 = "abandon ability able about above absent absorb abstract absurd abuse access accident";
      const mnemonic24 = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual";
      
      expect(__testing__.redactSensitiveData(mnemonic12)).toBe('[12_WORD_MNEMONIC_REDACTED]');
      expect(__testing__.redactSensitiveData(mnemonic24)).toBe('[24_WORD_MNEMONIC_REDACTED]');
    });

    it('should redact SSNs and government IDs', () => {
      const data = "SSN: 123-45-6789";
      const result = __testing__.redactSensitiveData(data);
      expect(result).toContain('***-**-[REDACTED]');
      expect(result).not.toContain('123-45-6789');
    });

    it('should handle sensitive object fields', () => {
      const sensitiveFields = [
        'password', 'secret', 'token', 'key', 'auth', 'credential',
        'private', 'seed', 'mnemonic', 'jwt', 'bearer', 'signature', 
        'otp', 'pin'
      ];

      sensitiveFields.forEach(field => {
        const data = { [field]: 'sensitive_value', safe: 'safe_value' };
        const result = __testing__.redactSensitiveData(data) as any;
        
        expect(result[field]).toBe('[REDACTED]');
        expect(result.safe).toBe('safe_value');
      });
    });

    it('should handle case-insensitive field names', () => {
      const data = {
        PASSWORD: 'secret',
        Secret_Key: 'key',
        api_TOKEN: 'token',
        userCredential: 'cred',
        safe_field: 'safe'
      };
      
      const result = __testing__.redactSensitiveData(data) as any;
      
      expect(result.PASSWORD).toBe('[REDACTED]');
      expect(result.Secret_Key).toBe('[REDACTED]');
      expect(result.api_TOKEN).toBe('[REDACTED]');
      expect(result.userCredential).toBe('[REDACTED]');
      expect(result.safe_field).toBe('safe');
    });
  });

  describe('Environment Awareness', () => {
    it('should log debug in development', () => {
      const restore = mockDev(true);
      
      logger.debug('Debug message', { key: 'value' });
      
      expect(mockConsole.debug).toHaveBeenCalled();
      restore();
    });

    it('should not log debug in production', () => {
      const restore = mockDev(false);
      
      logger.debug('Debug message', { key: 'value' });
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      restore();
    });

    it('should always log warnings and errors', () => {
      const restore = mockDev(false);
      
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
      restore();
    });
  });

  describe('Context Creation', () => {
    it('should create base context with platform and timestamp', () => {
      const context = __testing__.createBaseContext();
      
      expect(context.platform).toBe('ios');
      expect(context.buildType).toBeDefined();
      expect(context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should merge additional context', () => {
      const context = __testing__.createBaseContext({
        userId: 'user_123',
        screenName: 'HomeScreen'
      });
      
      expect(context.userId).toBe('user_123');
      expect(context.screenName).toBe('HomeScreen');
      expect(context.platform).toBe('ios');
    });
  });

  describe('Specialized Logging Methods', () => {
    beforeEach(() => {
      mockDev(true);
    });

    afterEach(() => {
      mockDev(false);
    });

    it('should log network requests with redaction', () => {
      logger.network('POST', '/auth/login', 200, 150, {
        request: {
          account: 'GCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R',
          password: 'secret123'
        }
      });
      
      const call = mockConsole.debug.mock.calls[0];
      expect(call[0]).toContain('Network POST /auth/login → 200 (150ms)');
      
      const metadata = call[1];
      expect(metadata.request.account).toContain('G****[REDACTED]');
      expect(metadata.request.password).toBe('[REDACTED]');
    });

    it('should log network errors as warnings', () => {
      logger.network('GET', '/api/data', 500, 1000);
      
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should log user actions', () => {
      logger.userAction('tap_login_button', { screen: 'LoginScreen' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('User action: tap_login_button'),
        expect.objectContaining({ screen: 'LoginScreen' })
      );
    });

    it('should log performance metrics', () => {
      logger.performance('api_call', 250, { endpoint: '/api/data' });
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Performance: api_call'),
        expect.objectContaining({ duration: '250ms', endpoint: '/api/data' })
      );
    });

    it('should log auth events with extra security', () => {
      logger.auth('login_success', {
        account: 'GCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R',
        method: 'sep10'
      });
      
      const call = mockConsole.info.mock.calls[0];
      expect(call[0]).toContain('Auth: login_success');
      
      const metadata = call[1];
      expect(metadata.account).toContain('G****[REDACTED]');
      expect(metadata.method).toBe('sep10');
    });
  });

  describe('Scoped Logger', () => {
    it('should prefix messages with scope', () => {
      const restore = mockDev(true);
      const scopedLogger = createScopedLogger('AuthService');
      
      scopedLogger.debug('Processing authentication');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[AuthService] Processing authentication'),
        undefined
      );
      restore();
    });

    it('should merge default context', () => {
      const restore = mockDev(true);
      const scopedLogger = createScopedLogger('PaymentService', {
        feature: 'payments'
      });
      
      scopedLogger.info('Payment initiated', { amount: 100 }, { userId: 'user_123' });
      
      const call = mockConsole.info.mock.calls[0];
      const context = call[1];
      expect(context.feature).toBe('payments');
      expect(context.userId).toBe('user_123');
      restore();
    });
  });

  describe('Performance Measurement', () => {
    it('should measure async function performance', async () => {
      const restore = mockDev(true);
      
      const slowFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      };
      
      const result = await measurePerformance(
        'slow_operation',
        slowFunction,
        { operation: 'test' }
      );
      
      expect(result).toBe('result');
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Performance: slow_operation'),
        expect.objectContaining({ 
          duration: expect.stringMatching(/^\d+ms$/),
          operation: 'test'
        })
      );
      restore();
    });

    it('should log errors and re-throw on failure', async () => {
      const restore = mockDev(true);
      
      const failingFunction = async () => {
        throw new Error('Operation failed');
      };
      
      await expect(
        measurePerformance('failing_operation', failingFunction)
      ).rejects.toThrow('Operation failed');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('failing_operation failed after'),
        expect.any(Error),
        undefined
      );
      restore();
    });
  });

  describe('Error Normalization', () => {
    it('should normalize string errors', () => {
      const error = __testing__.normalizeError('String error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('String error');
    });

    it('should normalize object errors', () => {
      const error = __testing__.normalizeError({ code: 'ERR_001', message: 'Custom error' });
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('ERR_001');
    });

    it('should handle circular references', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      const error = __testing__.normalizeError(circular);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unknown error occurred');
    });
  });

  describe('Integration Tests', () => {
    it('should handle realistic mobile app scenarios', () => {
      const restore = mockDev(true);
      
      // Simulate Stellar wallet operation
      const walletLogger = createScopedLogger('WalletService', {
        feature: 'stellar_wallet'
      });
      
      walletLogger.auth('sep10_challenge_requested', {
        account: 'GCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R',
        client_domain: 'wallet.example.com'
      }, {
        userId: 'user_12345',
        screenName: 'WalletScreen'
      });
      
      const call = mockConsole.info.mock.calls[0];
      expect(call[0]).toContain('[WalletService] Auth: sep10_challenge_requested');
      
      const metadata = call[1];
      expect(metadata.account).toContain('G****[REDACTED]');
      expect(metadata.client_domain).toBe('wallet.example.com');
      expect(metadata.feature).toBe('stellar_wallet');
      expect(metadata.userId).toBe('user_12345');
      expect(metadata.screenName).toBe('WalletScreen');
      
      restore();
    });

    it('should handle payment logging with sensitive data', () => {
      const restore = mockDev(true);
      
      logger.userAction('payment_initiated', {
        amount: 100,
        destination: 'GCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R',
        source: 'GBCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3S',
        memo: 'Payment for services',
        secret_key: 'SCKFBEIYTKP5ROORWS2HE6XXVV6MQVE6YDJHB5P7C4GGQXJN6ZHGKF3R'
      });
      
      const call = mockConsole.info.mock.calls[0];
      const metadata = call[1];
      
      expect(metadata.amount).toBe(100);
      expect(metadata.memo).toBe('Payment for services');
      expect(metadata.destination).toContain('G****[REDACTED]');
      expect(metadata.source).toContain('G****[REDACTED]');
      expect(metadata.secret_key).toBe('[REDACTED]');
      
      restore();
    });
  });
});
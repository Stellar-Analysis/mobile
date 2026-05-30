import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

import { apiClient } from '@services/api';
import { useAuthStore } from '@store/authStore';
import { AuthTokens, User } from '@types/index';

/** Credentials submitted from the login form. */
export interface LoginCredentials {
  identifier: string;
  password: string;
}

/** Field-level validation messages, keyed by form field. */
export interface LoginFieldErrors {
  identifier?: string;
  password?: string;
}

/** Shape of a successful `/auth/login` response. */
export interface LoginResponse {
  tokens: AuthTokens;
  user: User;
}

/** Options accepted by {@link useLoginScreen}. */
export interface UseLoginScreenOptions {
  /** Invoked after a successful authentication. */
  onLoginSuccess?: () => void;
}

/** Public API returned by {@link useLoginScreen}. */
export interface UseLoginScreenReturn {
  identifier: string;
  password: string;
  showPassword: boolean;
  fieldErrors: LoginFieldErrors;
  formError: string | null;
  loading: boolean;
  isValid: boolean;
  setIdentifier: (value: string) => void;
  setPassword: (value: string) => void;
  toggleShowPassword: () => void;
  handleSubmit: () => Promise<void>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate the identifier (email or username) field.
 *
 * @param value - Raw identifier input.
 * @returns A validation message, or `undefined` when valid.
 */
export function validateIdentifier(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Email or username is required';
  }
  if (trimmed.includes('@') && !EMAIL_REGEX.test(trimmed)) {
    return 'Enter a valid email address';
  }
  if (!trimmed.includes('@') && trimmed.length < MIN_USERNAME_LENGTH) {
    return `Username must be at least ${MIN_USERNAME_LENGTH} characters`;
  }
  return undefined;
}

/**
 * Validate the password field.
 *
 * @param value - Raw password input.
 * @returns A validation message, or `undefined` when valid.
 */
export function validatePassword(value: string): string | undefined {
  if (!value) {
    return 'Password is required';
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return undefined;
}

/**
 * Translate a login failure into a user-facing, non-alarming message.
 *
 * @param error - The error thrown by the auth request.
 * @returns A human-readable error string.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to connect. Check your internet connection and try again.';
    }
    if (error.response.status === 401 || error.response.status === 403) {
      return 'Incorrect email/username or password.';
    }
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Hook that owns all login-form state: input values, password visibility,
 * field-level and global validation/error state, loading status, and the
 * submit handler that authenticates against the API and updates the auth store.
 *
 * @param options - Optional success callback.
 * @returns State and handlers for rendering a login screen.
 */
export function useLoginScreen(
  options: UseLoginScreenOptions = {},
): UseLoginScreenReturn {
  const { onLoginSuccess } = options;

  const [identifier, setIdentifierState] = useState('');
  const [password, setPasswordState] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setIdentifier = useCallback((value: string) => {
    setIdentifierState(value);
    setFieldErrors(prev => ({ ...prev, identifier: undefined }));
    setFormError(null);
  }, []);

  const setPassword = useCallback((value: string) => {
    setPasswordState(value);
    setFieldErrors(prev => ({ ...prev, password: undefined }));
    setFormError(null);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const isValid = useMemo(
    () => !validateIdentifier(identifier) && !validatePassword(password),
    [identifier, password],
  );

  const handleSubmit = useCallback(async () => {
    const errors: LoginFieldErrors = {
      identifier: validateIdentifier(identifier),
      password: validatePassword(password),
    };

    if (errors.identifier || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      useAuthStore.getState().setTokens(response.tokens);
      useAuthStore.getState().setUser(response.user);
      onLoginSuccess?.();
    } catch (error) {
      setFormError(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [identifier, password, onLoginSuccess]);

  return {
    identifier,
    password,
    showPassword,
    fieldErrors,
    formError,
    loading,
    isValid,
    setIdentifier,
    setPassword,
    toggleShowPassword,
    handleSubmit,
  };
}

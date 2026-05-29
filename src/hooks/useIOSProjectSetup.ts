import React from 'react';
import { Platform } from 'react-native';

export type IOSSetupStatus = 'checking' | 'ready' | 'unavailable';

export interface IOSProjectSetupState {
  status: IOSSetupStatus;
  isIOS: boolean;
  osVersion: string;
  isSupported: boolean;
}

export interface UseIOSProjectSetupResult extends IOSProjectSetupState {
  recheck: () => void;
}

function buildState(): IOSProjectSetupState {
  const isIOS = Platform.OS === 'ios';
  const osVersion = Platform.Version?.toString() ?? 'unknown';
  // iOS 14+ requirement: major version >= 14
  const major = isIOS ? parseInt(osVersion, 10) : 0;
  const isSupported = isIOS ? major >= 14 : true; // Android always passes this check

  return {
    status: 'ready',
    isIOS,
    osVersion,
    isSupported,
  };
}

export function useIOSProjectSetup(): UseIOSProjectSetupResult {
  const [state, setState] = React.useState<IOSProjectSetupState>(() => ({
    ...buildState(),
    status: 'checking',
  }));

  const recheck = React.useCallback(() => {
    setState(prev => ({ ...prev, status: 'checking' }));
    // Simulate async platform check (e.g. reading native module info)
    const id = setTimeout(() => setState(buildState()), 0);
    return () => clearTimeout(id);
  }, []);

  React.useEffect(() => {
    const id = setTimeout(() => setState(buildState()), 0);
    return () => clearTimeout(id);
  }, []);

  return { ...state, recheck };
}

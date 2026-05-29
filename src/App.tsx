import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import type { RootStackParamList } from './navigation/RootNavigator';
import { useAppStore } from './store/appStore';
import { processOfflineQueue } from './hooks/useOfflineQueue';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { OfflineCachingIndicator } from './components/OfflineCaching';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['stellar-insights://'],
  config: {
    screens: {
      Main: {
        screens: {
          Anchors: 'anchors',
          Corridors: {
            screens: {
              CorridorsList: 'corridors',
              CorridorDetail: 'corridors/:corridorId',
            },
          },
        },
      },
      Auth: 'auth',
    },
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

function App(): React.JSX.Element {
  const { theme, isOnline } = useAppStore();
  const isDark = theme === 'dark';

  React.useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer linking={linking}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <NetworkStatusIndicator />
            <OfflineCachingIndicator showCacheSize={true} />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

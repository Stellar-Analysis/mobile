import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '@store/appStore';

export function setupNetworkMonitoring(): void {
  NetInfo.addEventListener(state => {
    const isOnline = state.isConnected && state.isInternetReachable;
    useAppStore.getState().setOnlineStatus(isOnline ?? false);

    if (isOnline) {
      // Trigger sync when coming back online
      syncOfflineData();
    }
  });
}

async function syncOfflineData(): Promise<void> {
  // TODO: Sync queued mutations from offline mode
  console.log('Syncing offline data...');
}

import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export const NOTIFICATION_CHANNEL_ID = 'default';

export async function setupNotifications(): Promise<void> {
  let authStatus: number;
  try {
    authStatus = await messaging().requestPermission();
  } catch {
    // Notification permission request failed (e.g. simulator / restricted device)
    return;
  }

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    // Notification permission denied — skip channel/listener setup
    return;
  }

  // Create notification channel (Android)
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
  }

  // Handle foreground messages
  messaging().onMessage(async (remoteMessage) => {
    if (!remoteMessage.notification) return;
    await notifee.displayNotification({
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
      android: {
        channelId: NOTIFICATION_CHANNEL_ID,
        smallIcon: 'ic_launcher',
      },
    });
  });
}

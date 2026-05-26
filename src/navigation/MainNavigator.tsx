import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '@screens/main/DashboardScreen';
import { CorridorsScreen } from '@screens/main/CorridorsScreen';
import { AnchorsScreen } from '@screens/main/AnchorsScreen';
import { SettingsScreen } from '@screens/main/SettingsScreen';
import { OfflineQueue } from '@components/OfflineQueue';
import { InfiniteScroll } from '@components/InfiniteScroll';

export type MainTabParamList = {
  Dashboard: undefined;
  Corridors: undefined;
  Anchors: undefined;
  OfflineQueue: undefined;
  InfiniteScroll: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Corridors" component={CorridorsScreen} />
      <Tab.Screen name="Anchors" component={AnchorsScreen} />
      <Tab.Screen
        name="OfflineQueue"
        component={OfflineQueue}
        options={{ title: 'Offline Queue' }}
      />
      <Tab.Screen
        name="InfiniteScroll"
        component={InfiniteScroll}
        options={{ title: 'Infinite Scroll' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

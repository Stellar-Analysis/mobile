import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { DashboardScreen } from '@screens/main/DashboardScreen';
import { CorridorsScreen } from '@screens/main/CorridorsScreen';
import { AnchorsList } from '@components/AnchorsList';
import { SettingsScreen } from '@screens/main/SettingsScreen';
import { OfflineQueue } from '@components/OfflineQueue';
import { InfiniteScroll } from '@components/InfiniteScroll';
import { PullToRefresh } from '@components/PullToRefresh';
import { OfflineCaching } from '@components/OfflineCaching';
import { NetworkSwitchButton } from '@components/NetworkSwitchDialog';
import { SearchFunctionality } from '@components/SearchFunctionality';

export type MainTabParamList = {
  Dashboard: undefined;
  Corridors: undefined;
  Anchors: undefined;
  OfflineQueue: undefined;
  InfiniteScroll: undefined;
  PullToRefresh: undefined;
  OfflineCaching: undefined;
  NetworkSwitchDialog: undefined;
  SearchFunctionality: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Wrapper component for Network Switch
const NetworkSwitchScreen = () => {
  const [dialogVisible, setDialogVisible] = React.useState(true);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <NetworkSwitchButton onPress={() => setDialogVisible(true)} />
    </View>
  );
};

// Wrapper component for Search Functionality
const SearchFunctionalityScreen = () => {
  const [searchData] = React.useState([
    {
      id: '1',
      name: 'Stellar Development Foundation',
      description: 'Official Stellar organization',
    },
    { id: '2', name: 'Stellar Lumens', description: 'Cryptocurrency token' },
    { id: '3', name: 'Stellar Protocol', description: 'Blockchain protocol' },
    { id: '4', name: 'Stellar Quest', description: 'Learning platform' },
    { id: '5', name: 'Stellar Anchor', description: 'Bridge between different networks' },
  ]);

  return (
    <SearchFunctionality
      data={searchData}
      renderItem={({ item }) => (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 12, color: '#666666' }}>{item.description}</Text>
        </View>
      )}
      placeholder="Search Stellar resources..."
    />
  );
};

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Corridors" component={CorridorsScreen} />
      <Tab.Screen
        name="Anchors"
        component={AnchorsList}
        options={{ title: 'Anchors' }}
      />
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
      <Tab.Screen
        name="PullToRefresh"
        component={PullToRefresh}
        options={{ title: 'Pull to Refresh' }}
      />
      <Tab.Screen
        name="OfflineCaching"
        component={OfflineCaching}
        options={{ title: 'Offline Caching' }}
      />
      <Tab.Screen
        name="NetworkSwitchDialog"
        component={NetworkSwitchScreen}
        options={{ title: 'Network Switch' }}
      />
      <Tab.Screen
        name="SearchFunctionality"
        component={SearchFunctionalityScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

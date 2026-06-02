import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { DashboardScreen } from '@components/DashboardScreen';
import { CorridorsList } from '@components/CorridorsList';
import { AnchorsList } from '@components/AnchorsList';
import { SettingsScreen } from '@screens/main/SettingsScreen';
import { CorridorDetail } from '@components/CorridorDetail';
import { AnchorDetail } from '@components/AnchorDetail';
import { OfflineQueue } from '@components/OfflineQueue';
import { InfiniteScroll } from '@components/InfiniteScroll';
import { PullToRefresh } from '@components/PullToRefresh';
import { OfflineCaching } from '@components/OfflineCaching';
import { NetworkSwitchButton } from '@components/NetworkSwitchDialog';
import { SearchFunctionality } from '@components/SearchFunctionality';
import { IOSProjectSetup } from '@components/IOSProjectSetup';
import { HapticPatternsComponent } from '@components/HapticPatternsComponent';
import { PictureinPictureComponent } from '@components/PictureinPictureComponent';
import { VRSupportComponent } from '@components/VRSupportComponent';
import { NFCSupportComponent } from '@components/NFCSupportComponent';
import { BluetoothSupportComponent } from '@components/BluetoothSupportComponent';
import { BeaconSupportComponent } from '@components/BeaconSupportComponent';
import { AirDropIntegrationComponent } from '@components/AirDropIntegrationComponent';
import { ShortcutsSupportComponent } from '@components/ShortcutsSupportComponent';
import { AppIntentsComponent } from '@components/AppIntentsComponent';
import { GestureControlsComponent } from '@components/GestureControlsComponent';
import { QuickActionsComponent } from '@components/QuickActionsComponent';
import { ShareExtensionComponent } from '@components/ShareExtensionComponent';
import { ActionExtensionComponent } from '@components/ActionExtensionComponent';
import { ForceTouchComponent } from '@components/ForceTouchComponent';
import { HandoffSupportComponent } from '@components/HandoffSupportComponent';
import { GeofencingComponent } from '@components/GeofencingComponent';
import { BackgroundSyncComponent } from '@components/BackgroundSyncComponent';
import { ContactsIntegrationComponent } from '@components/ContactsIntegrationComponent';
import { MapsIntegrationComponent } from '@components/MapsIntegrationComponent';
import { WidgetSupportComponent } from '@components/WidgetSupportComponent';
import { TouchSupportComponent } from '@components/3DTouchSupportComponent';
import { ShaketoRefreshComponent } from '@components/ShaketoRefreshComponent';
import { AppClipsComponent } from '@components/AppClipsComponent';
import { LiveActivitiesComponent } from '@components/LiveActivitiesComponent';
import { WatchAppComponent } from '@components/WatchAppComponent';
import { WearOSAppComponent } from '@components/WearOSAppComponent';
import type { SearchableItem } from '@hooks/useSearchFunctionality';

export type CorridorsStackParamList = {
  CorridorsList: undefined;
  CorridorDetail: {
    corridorId: string;
  };
};

export type AnchorsStackParamList = {
  AnchorsList: undefined;
  AnchorDetail: {
    anchorId: string;
  };
};

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
  IOSProjectSetup: undefined;
  HapticPatterns: undefined;
  PictureInPicture: undefined;
  VRSupport: undefined;
  NFCSupport: undefined;
  BluetoothSupport: undefined;
  BeaconSupport: undefined;
  AirDropIntegration: undefined;
  ShortcutsSupport: undefined;
  AppIntents: undefined;
  QuickActions: undefined;
  ShareExtension: undefined;
  ActionExtension: undefined;
  ForceTouch: undefined;
  HandoffSupport: undefined;
  Geofencing: undefined;
  BackgroundSync: undefined;
  GestureControls: undefined;
  ContactsIntegration: undefined;
  MapsIntegration: undefined;
  WidgetSupport: undefined;
  ThreeDTouchSupport: undefined;
  ShakeToRefresh: undefined;
  AppClips: undefined;
  LiveActivities: undefined;
  WatchApp: undefined;
  WearOSApp: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const CorridorsStack = createNativeStackNavigator<CorridorsStackParamList>();
const AnchorsStack = createNativeStackNavigator<AnchorsStackParamList>();

function CorridorsNavigator() {
  return (
    <CorridorsStack.Navigator>
      <CorridorsStack.Screen
        name="CorridorsList"
        component={CorridorsList}
        options={{ title: 'Corridors', headerShown: false }}
      />
      <CorridorsStack.Screen
        name="CorridorDetail"
        component={CorridorDetail}
        options={{ title: 'Corridor Detail' }}
      />
    </CorridorsStack.Navigator>
  );
}

function AnchorsNavigator() {
  return (
    <AnchorsStack.Navigator>
      <AnchorsStack.Screen
        name="AnchorsList"
        component={AnchorsList}
        options={{ title: 'Anchors', headerShown: false }}
      />
      <AnchorsStack.Screen
        name="AnchorDetail"
        component={AnchorDetail}
        options={{ title: 'Anchor Detail' }}
      />
    </AnchorsStack.Navigator>
  );
}

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
  const [searchData] = React.useState<SearchableItem[]>([
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
            {(item as { name: string }).name}
          </Text>
          <Text style={{ fontSize: 12, color: '#666666' }}>
            {(item as { description: string }).description}
          </Text>
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
      <Tab.Screen
        name="Corridors"
        component={CorridorsNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Anchors" component={AnchorsNavigator} options={{ headerShown: false }} />
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
      <Tab.Screen
        name="IOSProjectSetup"
        component={IOSProjectSetup}
        options={{ title: 'iOS Setup' }}
      />
      <Tab.Screen
        name="HapticPatterns"
        component={HapticPatternsComponent}
        options={{ title: 'Haptics' }}
      />
      <Tab.Screen
        name="PictureInPicture"
        component={PictureinPictureComponent}
        options={{ title: 'PiP' }}
      />
      <Tab.Screen
        name="VRSupport"
        component={VRSupportComponent}
        options={{ title: 'VR Support' }}
      />
      <Tab.Screen name="NFCSupport" component={NFCSupportComponent} options={{ title: 'NFC' }} />
      <Tab.Screen
        name="BluetoothSupport"
        component={BluetoothSupportComponent}
        options={{ title: 'Bluetooth' }}
      />
      <Tab.Screen
        name="BeaconSupport"
        component={BeaconSupportComponent}
        options={{ title: 'Beacon' }}
      />
      <Tab.Screen
        name="AirDropIntegration"
        component={AirDropIntegrationComponent}
        options={{ title: 'AirDrop' }}
      />
      <Tab.Screen
        name="ShortcutsSupport"
        component={ShortcutsSupportComponent}
        options={{ title: 'Shortcuts' }}
      />
      <Tab.Screen
        name="AppIntents"
        component={AppIntentsComponent}
        options={{ title: 'App Intents' }}
      />
      <Tab.Screen
        name="QuickActions"
        component={QuickActionsComponent}
        options={{ title: 'Quick Actions' }}
      />
      <Tab.Screen
        name="ShareExtension"
        component={ShareExtensionComponent}
        options={{ title: 'Share' }}
      />
      <Tab.Screen
        name="ActionExtension"
        component={ActionExtensionComponent}
        options={{ title: 'Actions' }}
      />
      <Tab.Screen
        name="ForceTouch"
        component={ForceTouchComponent}
        options={{ title: 'Force Touch' }}
      />
      <Tab.Screen
        name="HandoffSupport"
        component={HandoffSupportComponent}
        options={{ title: 'Handoff' }}
      />
      <Tab.Screen
        name="Geofencing"
        component={GeofencingComponent}
        options={{ title: 'Geofencing' }}
      />
      <Tab.Screen
        name="BackgroundSync"
        component={BackgroundSyncComponent}
        options={{ title: 'Background Sync' }}
      />
      <Tab.Screen
        name="GestureControls"
        component={GestureControlsComponent}
        options={{ title: 'Gesture Controls' }}
      />
      <Tab.Screen
        name="ContactsIntegration"
        component={ContactsIntegrationComponent}
        options={{ title: 'Contacts' }}
      />
      <Tab.Screen
        name="MapsIntegration"
        component={MapsIntegrationComponent}
        options={{ title: 'Maps' }}
      />
      <Tab.Screen
        name="WidgetSupport"
        component={WidgetSupportComponent}
        options={{ title: 'Widgets' }}
      />
      <Tab.Screen
        name="ThreeDTouchSupport"
        component={TouchSupportComponent}
        options={{ title: '3D Touch' }}
      />
      <Tab.Screen
        name="ShakeToRefresh"
        component={ShaketoRefreshComponent}
        options={{ title: 'Shake to Refresh' }}
      />
      <Tab.Screen name="AppClips" component={AppClipsComponent} options={{ title: 'App Clips' }} />
      <Tab.Screen
        name="LiveActivities"
        component={LiveActivitiesComponent}
        options={{ title: 'Live Activities' }}
      />
      <Tab.Screen name="WatchApp" component={WatchAppComponent} options={{ title: 'Watch App' }} />
      <Tab.Screen name="WearOSApp" component={WearOSAppComponent} options={{ title: 'Wear OS' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

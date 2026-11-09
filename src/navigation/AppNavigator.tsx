import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Bell,
  ContactRound,
  MessageCircle,
  Settings,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { ChatProvider, useChatData } from '../context/ChatContext';
import type { RootStackParams, TabParams } from '../types';
import { colors } from '../theme';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator<TabParams>();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};
const icons = {
  Home: MessageCircle,
  Contacts: ContactRound,
  Notifications: Bell,
  Settings,
};
function MainTabs() {
  const { unread } = useChatData();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: ({ color, focused, size }) => {
          const Icon = icons[route.name];
          return (
            <Icon
              color={color}
              size={size - 2}
              strokeWidth={focused ? 2 : 1.6}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Tin nhắn',
          tabBarBadge: unread || undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: 'Danh bạ' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Thông báo' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
}
function SignedInNavigator() {
  return (
    <ChatProvider>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: styles.background }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </ChatProvider>
  );
}
export default function AppNavigator() {
  const { user, loading, error, retry } = useAuth();
  if (loading || error) {
    return (
      <View style={styles.loading}>
        {error ? (
          <ErrorView message={error} onRetry={retry} />
        ) : (
          <LoadingView />
        )}
      </View>
    );
  }
  return (
    <NavigationContainer theme={theme}>
      {user ? (
        <SignedInNavigator key={user.uid} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={AuthScreen} />
          <Stack.Screen name="Register" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  background: { backgroundColor: colors.background },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    paddingTop: 8,
    minHeight: 65,
  },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  badge: { backgroundColor: colors.red, fontSize: 10 },
});

import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList, DashboardStackParamList } from './types';
import { ConversationListScreen } from '../screens/main/conversation-list-screen';
import { ChatScreen } from '../screens/main/chat-screen';
import { SettingsScreen } from '../screens/main/settings-screen';
import { HelpScreen } from '../screens/main/help-screen';
import { ModerationStack } from './moderation-stack';
import { AdminStack } from './admin-stack';
import { ParentStack } from './parent-stack';
import { SessionTimer } from '../components/SessionTimer';
import { useAuth } from '../contexts/auth-context';

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.displayName || '',
        })}
      />
    </DashboardStack.Navigator>
  );
}

export function MainTabs() {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  // Determine initial tab based on user role
  const getInitialRoute = (): keyof MainTabParamList => {
    if (user?.isSuperAdmin) return 'Admin';
    if (user?.isModerator) return 'Moderation';
    if (user?.isParent) return 'Parent';
    return 'Dashboard';
  };

  return (
    <View style={{ flex: 1 }}>
      <SessionTimer userId={user?.id} />
      <Tab.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardNavigator}
          options={{
            tabBarLabel: t('nav.messages', 'Messages'),
            tabBarAccessibilityLabel: t('nav.messages', 'Messages'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            ),
          }}
        />
        {user?.isModerator && !user?.isSuperAdmin && (
          <Tab.Screen
            name="Moderation"
            component={ModerationStack}
            options={{
              tabBarLabel: t('nav.moderation', 'Moderation'),
              tabBarAccessibilityLabel: t('nav.moderation', 'Moderation'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="shield-outline" size={size} color={color} />
              ),
            }}
          />
        )}
        {user?.isSuperAdmin && (
          <Tab.Screen
            name="Admin"
            component={AdminStack}
            options={{
              tabBarLabel: t('nav.admin', 'Admin'),
              tabBarAccessibilityLabel: t('nav.admin', 'Admin'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="key-outline" size={size} color={color} />
              ),
            }}
          />
        )}
        {user?.isParent && (
          <Tab.Screen
            name="Parent"
            component={ParentStack}
            options={{
              tabBarLabel: t('nav.parent', 'Parent'),
              tabBarAccessibilityLabel: t('nav.parent', 'Parent'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" size={size} color={color} />
              ),
            }}
          />
        )}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: t('nav.settings', 'Settings'),
            tabBarAccessibilityLabel: t('nav.settings', 'Settings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Help"
          component={HelpScreen}
          options={{
            tabBarLabel: t('nav.help', 'Help'),
            tabBarAccessibilityLabel: t('nav.help', 'Help'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="help-circle-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

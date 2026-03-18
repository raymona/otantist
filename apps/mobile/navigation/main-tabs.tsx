import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MainTabParamList, DashboardStackParamList } from './types';
import { ConversationListScreen } from '../screens/main/conversation-list-screen';
import { ChatScreen } from '../screens/main/chat-screen';
import { SettingsScreen } from '../screens/main/settings-screen';
import { HelpScreen } from '../screens/main/help-screen';
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

  return (
    <View style={{ flex: 1 }}>
      <SessionTimer userId={user?.id} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardNavigator}
          options={{
            tabBarLabel: t('nav.messages', 'Messages'),
            tabBarAccessibilityLabel: t('nav.messages', 'Messages'),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: t('nav.settings', 'Settings'),
            tabBarAccessibilityLabel: t('nav.settings', 'Settings'),
          }}
        />
        <Tab.Screen
          name="Help"
          component={HelpScreen}
          options={{
            tabBarLabel: t('nav.help', 'Help'),
            tabBarAccessibilityLabel: t('nav.help', 'Help'),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

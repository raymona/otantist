import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/auth-context';
import type { RootStackParamList } from './types';
import { AuthStack } from './auth-stack';
import { MainTabs } from './main-tabs';
import { AcceptTermsScreen } from '../screens/auth/accept-terms-screen';
import { OnboardingScreen } from '../screens/onboarding/onboarding-screen';
import { ModerationStack } from './moderation-stack';
import { AdminStack } from './admin-stack';
import { ParentStack } from './parent-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'otantist://'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};

export function RootNavigator() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine which screens to show based on auth/user state.
  // The FIRST screen in each group becomes the default route.
  const renderScreens = () => {
    if (!isAuthenticated || !user) {
      return <Stack.Screen name="Auth" component={AuthStack} />;
    }

    if (!user.legalAccepted) {
      return <Stack.Screen name="AcceptTerms" component={AcceptTermsScreen} />;
    }

    if (!user.onboardingComplete && !user.isModerator && !user.isSuperAdmin) {
      return (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </>
      );
    }

    // Authenticated + terms accepted + onboarding done (or moderator/admin)
    if (user.isModerator && !user.isSuperAdmin) {
      return (
        <>
          <Stack.Screen name="Moderation" component={ModerationStack} />
          <Stack.Screen name="Main" component={MainTabs} />
        </>
      );
    }

    if (user.isSuperAdmin) {
      return (
        <>
          <Stack.Screen name="Admin" component={AdminStack} />
          <Stack.Screen name="Main" component={MainTabs} />
        </>
      );
    }

    if (user.isParent) {
      return (
        <>
          <Stack.Screen name="Parent" component={ParentStack} />
          <Stack.Screen name="Main" component={MainTabs} />
        </>
      );
    }

    return <Stack.Screen name="Main" component={MainTabs} />;
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>{renderScreens()}</Stack.Navigator>
    </NavigationContainer>
  );
}

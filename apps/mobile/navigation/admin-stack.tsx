import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParamList } from './types';
import { PlaceholderScreen } from '../screens/placeholder-screen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminUsers"
        component={PlaceholderScreen}
        options={{ title: 'Admin - Users' }}
      />
      <Stack.Screen
        name="AdminInviteCodes"
        component={PlaceholderScreen}
        options={{ title: 'Admin - Invite Codes' }}
      />
    </Stack.Navigator>
  );
}

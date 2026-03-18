import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ParentStackParamList } from './types';
import { PlaceholderScreen } from '../screens/placeholder-screen';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export function ParentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ParentMembers"
        component={PlaceholderScreen}
        options={{ title: 'Parent Dashboard' }}
      />
      <Stack.Screen
        name="ParentMemberDetail"
        component={PlaceholderScreen}
        options={{ title: 'Member Detail' }}
      />
    </Stack.Navigator>
  );
}

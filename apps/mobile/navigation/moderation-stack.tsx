import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ModerationStackParamList } from './types';
import { PlaceholderScreen } from '../screens/placeholder-screen';

const Stack = createNativeStackNavigator<ModerationStackParamList>();

export function ModerationStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ModerationQueue"
        component={PlaceholderScreen}
        options={{ title: 'Moderation' }}
      />
      <Stack.Screen
        name="ModerationDetail"
        component={PlaceholderScreen}
        options={{ title: 'Review Item' }}
      />
    </Stack.Navigator>
  );
}

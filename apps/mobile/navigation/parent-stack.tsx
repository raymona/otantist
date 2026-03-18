import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { ParentStackParamList } from './types';
import { ParentMembersScreen } from '../screens/parent/parent-members-screen';
import { ParentMemberDetailScreen } from '../screens/parent/parent-member-detail-screen';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export function ParentStack() {
  const { t } = useTranslation('parent');

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ParentMembers"
        component={ParentMembersScreen}
        options={{ title: t('title') }}
      />
      <Stack.Screen
        name="ParentMemberDetail"
        component={ParentMemberDetailScreen}
        options={({ route }) => ({ title: route.params.displayName })}
      />
    </Stack.Navigator>
  );
}

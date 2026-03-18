import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { ModerationStackParamList } from './types';
import { ModerationQueueScreen } from '../screens/moderation/moderation-queue-screen';
import { ModerationDetailScreen } from '../screens/moderation/moderation-detail-screen';

const Stack = createNativeStackNavigator<ModerationStackParamList>();

export function ModerationStack() {
  const { t } = useTranslation('moderation');

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ModerationQueue"
        component={ModerationQueueScreen}
        options={{ title: t('title') }}
      />
      <Stack.Screen
        name="ModerationDetail"
        component={ModerationDetailScreen}
        options={{ title: t('detail.title') }}
      />
    </Stack.Navigator>
  );
}

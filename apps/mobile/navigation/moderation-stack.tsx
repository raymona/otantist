import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { ModerationStackParamList } from './types';
import { ModerationQueueScreen } from '../screens/moderation/moderation-queue-screen';
import { ModerationDetailScreen } from '../screens/moderation/moderation-detail-screen';
import { HeaderMenu } from '../components/HeaderMenu';

const Stack = createNativeStackNavigator<ModerationStackParamList>();

export function ModerationStack() {
  const { t } = useTranslation('moderation');

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ModerationQueue"
        component={ModerationQueueScreen}
        options={{
          title: t('title'),
          headerRight: () => <HeaderMenu />,
        }}
      />
      <Stack.Screen
        name="ModerationDetail"
        component={ModerationDetailScreen}
        options={{ title: t('detail.title') }}
      />
    </Stack.Navigator>
  );
}

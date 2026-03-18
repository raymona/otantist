import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AdminStackParamList } from './types';
import { AdminUsersScreen } from '../screens/admin/admin-users-screen';
import { AdminInviteCodesScreen } from '../screens/admin/admin-invite-codes-screen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  const { t } = useTranslation('admin');

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={({ navigation }) => ({
          title: t('title'),
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('AdminInviteCodes')}>
              <Text style={{ color: '#2563eb', fontSize: 14 }}>{t('invite_codes.title')}</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="AdminInviteCodes"
        component={AdminInviteCodesScreen}
        options={{ title: t('invite_codes.title') }}
      />
    </Stack.Navigator>
  );
}

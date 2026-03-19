import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AdminStackParamList } from './types';
import { AdminUsersScreen } from '../screens/admin/admin-users-screen';
import { AdminInviteCodesScreen } from '../screens/admin/admin-invite-codes-screen';
import { HeaderMenu } from '../components/HeaderMenu';

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => navigation.navigate('AdminInviteCodes')}>
                <Text style={{ color: '#2563eb', fontSize: 14 }}>{t('invite_codes.title')}</Text>
              </TouchableOpacity>
              <HeaderMenu />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="AdminInviteCodes"
        component={AdminInviteCodesScreen}
        options={{
          title: t('invite_codes.title'),
          headerRight: () => <HeaderMenu />,
        }}
      />
    </Stack.Navigator>
  );
}

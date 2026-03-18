import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../lib/api/auth';
import { ApiException } from '../../lib/api';
import type { AuthScreenProps } from '../../navigation/types';

export function ResetPasswordScreen({ route, navigation }: AuthScreenProps<'ResetPassword'>) {
  const { t, i18n } = useTranslation('auth');
  const token = route.params?.token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): string | null => {
    if (!password) return t('password_required');
    if (password.length < 8) return t('password_min_length');
    if (password !== confirmPassword) return t('passwords_must_match');
    return null;
  };

  const handleSubmit = async () => {
    setError('');

    if (!token) {
      setError(t('reset_password_error'));
      return;
    }

    const err = validate();
    if (err) return setError(err);

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(t('reset_password_error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Otantist</Text>
        <View style={styles.card}>
          <Text style={styles.errorIcon}>✗</Text>
          <Text style={styles.errorMessage}>{t('reset_password_error')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
            accessibilityRole="link"
          >
            <Text style={styles.link}>{t('back_to_login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isSuccess) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Otantist</Text>
        <View style={styles.card}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>{t('reset_password_success')}</Text>
          <Text style={styles.redirectText}>{t('redirecting_to_login')}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Otantist</Text>
        <Text style={styles.subtitle}>{t('reset_password_title')}</Text>

        {!!error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{t('new_password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            accessibilityLabel={t('new_password')}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('confirm_password')}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            accessibilityLabel={t('confirm_password')}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('reset_password')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkButton}
          accessibilityRole="link"
        >
          <Text style={styles.link}>{t('back_to_login')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#4b5563',
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: { fontSize: 40, color: '#22c55e', marginBottom: 12 },
  successText: {
    fontSize: 16,
    color: '#22c55e',
    textAlign: 'center',
    marginBottom: 8,
  },
  redirectText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  errorIcon: { fontSize: 40, color: '#ef4444', marginBottom: 12 },
  errorMessage: {
    fontSize: 16,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#b91c1c', fontSize: 14 },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  link: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

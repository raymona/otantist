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
import { useAuth, useApiError } from '../../contexts/auth-context';
import { ApiException } from '../../lib/api';
import type { AuthScreenProps } from '../../navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { t, i18n } = useTranslation('auth');
  const { register } = useAuth();
  const { getErrorMessage } = useApiError();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [language, setLanguage] = useState<'fr' | 'en'>((i18n.language as 'fr' | 'en') || 'fr');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string | null => {
    if (!email) return t('email_required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('email_invalid');
    if (!password) return t('password_required');
    if (password.length < 8) return t('password_min_length');
    if (password !== confirmPassword) return t('passwords_must_match');
    if (!inviteCode) return t('invite_code_required');
    return null;
  };

  const handleRegister = async () => {
    setError('');
    const err = validate();
    if (err) return setError(err);

    setIsLoading(true);
    try {
      await register({ email, password, inviteCode, language });
      // Auth context updates → RootNavigator shows AcceptTerms or Onboarding
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(getErrorMessage(err, lang));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const next = language === 'fr' ? 'en' : 'fr';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Otantist</Text>
        <Text style={styles.subtitle}>{t('create_account')}</Text>

        {!!error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel={t('email')}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            accessibilityLabel={t('password')}
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

        <View style={styles.field}>
          <Text style={styles.label}>{t('invite_code')}</Text>
          <TextInput
            style={styles.input}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            accessibilityLabel={t('invite_code')}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('language')}</Text>
          <TouchableOpacity
            style={styles.languagePicker}
            onPress={toggleLanguage}
            accessibilityRole="button"
            accessibilityLabel={`${t('language')}: ${language === 'fr' ? t('common:french') : t('common:english')}`}
          >
            <Text style={styles.languageText}>
              {language === 'fr' ? t('common:french') : t('common:english')}
            </Text>
            <Text style={styles.languageHint}>{t('common:tap_to_switch')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('register')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('already_have_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityRole="link">
            <Text style={styles.link}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
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
  languagePicker: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageText: { fontSize: 16, color: '#111827' },
  languageHint: { fontSize: 12, color: '#9ca3af' },
  link: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { color: '#4b5563', fontSize: 14 },
});

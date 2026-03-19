import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/auth-context';
import { authApi } from '../../lib/api/auth';
import { ApiException } from '../../lib/api';
import type { RootStackScreenProps } from '../../navigation/types';

export function AcceptTermsScreen({ navigation }: RootStackScreenProps<'AcceptTerms'>) {
  const { t, i18n } = useTranslation('auth');
  const { refreshUser } = useAuth();

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!accepted) {
      setError(t('terms_required'));
      return;
    }

    setIsLoading(true);
    try {
      await authApi.acceptTerms();
      await refreshUser();
      // RootNavigator will re-render and show Onboarding or Main
    } catch (err) {
      const lang = i18n.language as 'fr' | 'en';
      if (err instanceof ApiException) {
        setError(err.getLocalizedMessage(lang));
      } else {
        setError(t('common:error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Otantist</Text>
        <Text style={styles.subtitle}>{t('accept_terms_title')}</Text>

        <View style={styles.card}>
          <Text style={styles.description}>{t('accept_terms_message')}</Text>

          <View style={styles.termsBox}>
            <ScrollView style={styles.termsScroll} nestedScrollEnabled>
              <Text style={styles.termsHeading}>{t('terms_heading')}</Text>
              <Text style={styles.termsText}>{t('terms_paragraph_1')}</Text>
              <Text style={styles.termsText}>{t('terms_paragraph_2')}</Text>
              <Text style={styles.termsText}>{t('terms_paragraph_3')}</Text>
            </ScrollView>
          </View>

          {!!error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            accessibilityLabel={t('accept_terms_checkbox')}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>{t('accept_terms_checkbox')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, (!accepted || isLoading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !accepted}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoading, disabled: !accepted }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('accept_terms_button')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: { fontSize: 14, color: '#4b5563', marginBottom: 16 },
  termsBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
    maxHeight: 200,
  },
  termsScroll: { padding: 12 },
  termsHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
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

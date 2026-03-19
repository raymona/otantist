import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/auth-context';
import { feedbackApi } from '../../lib/api/feedback';

export function HelpScreen() {
  const { t } = useTranslation('help');
  const { user } = useAuth();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Feedback form
  const [feedbackName, setFeedbackName] = useState(user?.displayName || '');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sections = [
    'getting_around',
    'energy',
    'calm_mode',
    'messaging',
    'message_status',
    'settings',
    'safety',
    ...(user?.isParent ? ['parent'] : []),
  ];

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert(t('feedback_error_empty'));
      return;
    }

    setIsSending(true);
    try {
      await feedbackApi.submit({
        name: feedbackName,
        message: feedbackMessage,
      });
      Alert.alert(t('feedback_success'));
      setFeedbackMessage('');
    } catch {
      Alert.alert(t('common:error'));
    } finally {
      setIsSending(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => (prev === key ? null : key));
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>{t('title')}</Text>
        <Text style={styles.intro}>{t('intro')}</Text>

        {/* Help sections */}
        {sections.map(key => (
          <View key={key} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: expandedSection === key }}
            >
              <Text style={styles.sectionTitle}>{t(`sections.${key}.title`)}</Text>
              <Text style={styles.chevron}>{expandedSection === key ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {expandedSection === key && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionBody}>{t(`sections.${key}.content`)}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Feedback section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>{t('sections.feedback.title')}</Text>
          <Text style={styles.feedbackDesc}>{t('sections.feedback.content')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('feedback_name')}</Text>
            <TextInput
              style={styles.input}
              value={feedbackName}
              onChangeText={setFeedbackName}
              accessibilityLabel={t('feedback_name')}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('feedback_message')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel={t('feedback_message')}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSending && styles.buttonDisabled]}
            onPress={handleSubmitFeedback}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>{t('feedback_submit')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  intro: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 20,
    lineHeight: 22,
  },
  section: { marginBottom: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  chevron: { fontSize: 16, color: '#6b7280' },
  sectionContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  feedbackSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  feedbackDesc: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

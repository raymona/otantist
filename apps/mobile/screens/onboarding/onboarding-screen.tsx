import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth, useApiError } from '../../contexts/auth-context';
import { usersApi } from '../../lib/api/users';
import { preferencesApi } from '../../lib/api/preferences';
import { parentApi } from '../../lib/api/parent';
import type { AgeGroup, ProfileVisibility } from '../../lib/api/users';
import type { TonePreference, ColorIntensity } from '../../lib/api/preferences';
import type { RootStackScreenProps } from '../../navigation/types';

type Step = 'profile' | 'communication' | 'sensory' | 'conversation' | 'complete';
const STEPS: Step[] = ['profile', 'communication', 'sensory', 'conversation', 'complete'];

const TONES: TonePreference[] = ['gentle', 'direct', 'enthusiastic', 'formal'];
const COMM_MODES = ['text', 'emoji', 'voice', 'images'];
const INTENSITIES: ColorIntensity[] = ['standard', 'reduced', 'minimal'];

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const { t } = useTranslation('onboarding');
  const { user, logout, refreshUser } = useAuth();
  const { getErrorMessage } = useApiError();

  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [error, setError] = useState('');
  const [resumed, setResumed] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('visible');

  // Communication state
  const [preferredTone, setPreferredTone] = useState<TonePreference | ''>('');
  const [commModes, setCommModes] = useState<string[]>(['text']);
  const [slowRepliesOk, setSlowRepliesOk] = useState(true);
  const [oneMessageAtTime, setOneMessageAtTime] = useState(false);
  const [readWithoutReply, setReadWithoutReply] = useState(true);

  // Sensory state
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [colorIntensity, setColorIntensity] = useState<ColorIntensity>('standard');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationLimit, setNotificationLimit] = useState(5);
  const [notificationGrouped, setNotificationGrouped] = useState(true);

  // Parent code state (for minors)
  const [needsParentCode, setNeedsParentCode] = useState(false);
  const [parentCode, setParentCode] = useState('');
  const [isLinkingParent, setIsLinkingParent] = useState(false);

  // Conversation state
  const [goodTopics, setGoodTopics] = useState<string[]>([]);
  const [avoidTopics, setAvoidTopics] = useState<string[]>([]);
  const [interactionTips, setInteractionTips] = useState<string[]>([]);

  // Tag input states
  const [goodTopicInput, setGoodTopicInput] = useState('');
  const [avoidTopicInput, setAvoidTopicInput] = useState('');
  const [tipInput, setTipInput] = useState('');

  // Pre-populate and resume
  useEffect(() => {
    if (!user) return;

    if (user.displayName) setDisplayName(user.displayName);
    if (user.ageGroup) setAgeGroup(user.ageGroup as AgeGroup);
    if (user.profileVisibility) setProfileVisibility(user.profileVisibility as ProfileVisibility);

    const stepMap: Record<string, Step> = {
      basic_profile: 'profile',
      communication_preferences: 'communication',
      sensory_preferences: 'sensory',
      conversation_starters: 'conversation',
    };

    if (user.onboardingStep && stepMap[user.onboardingStep]) {
      const resumeStep = stepMap[user.onboardingStep];
      if (resumeStep !== 'profile') {
        setCurrentStep(resumeStep);
        setResumed(true);
      }
    }
  }, [user]);

  // Load saved preferences
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const commPrefs = await preferencesApi.getCommunication();
        if (commPrefs.commModes?.length) setCommModes(commPrefs.commModes);
        if (commPrefs.preferredTone) setPreferredTone(commPrefs.preferredTone);
        if (commPrefs.slowRepliesOk != null) setSlowRepliesOk(commPrefs.slowRepliesOk);
        if (commPrefs.oneMessageAtTime != null) setOneMessageAtTime(commPrefs.oneMessageAtTime);
        if (commPrefs.readWithoutReply != null) setReadWithoutReply(commPrefs.readWithoutReply);
      } catch {
        /* No saved data yet */
      }

      try {
        const sensPrefs = await preferencesApi.getSensory();
        if (sensPrefs.enableAnimations != null) setEnableAnimations(sensPrefs.enableAnimations);
        if (sensPrefs.colorIntensity) setColorIntensity(sensPrefs.colorIntensity);
        if (sensPrefs.soundEnabled != null) setSoundEnabled(sensPrefs.soundEnabled);
        if (sensPrefs.notificationLimit != null) setNotificationLimit(sensPrefs.notificationLimit);
        if (sensPrefs.notificationGrouped != null)
          setNotificationGrouped(sensPrefs.notificationGrouped);
      } catch {
        /* No saved data yet */
      }

      try {
        const convStarters = await preferencesApi.getConversationStarters();
        if (convStarters.goodTopics?.length) setGoodTopics(convStarters.goodTopics);
        if (convStarters.avoidTopics?.length) setAvoidTopics(convStarters.avoidTopics);
        if (convStarters.interactionTips?.length) setInteractionTips(convStarters.interactionTips);
      } catch {
        /* No saved data yet */
      }
    };

    loadSavedPreferences();
  }, []);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const saveCurrentStep = async (markComplete: boolean) => {
    if (currentStep === 'profile') {
      await usersApi.updateProfile({
        displayName: displayName || undefined,
        ageGroup: ageGroup || undefined,
        profileVisibility,
      });
    } else if (currentStep === 'communication') {
      await preferencesApi.updateCommunication({
        preferredTone: preferredTone || undefined,
        commModes,
        slowRepliesOk,
        oneMessageAtTime,
        readWithoutReply,
        ...(markComplete && { sectionComplete: true }),
      });
    } else if (currentStep === 'sensory') {
      await preferencesApi.updateSensory({
        enableAnimations,
        colorIntensity,
        soundEnabled,
        notificationLimit,
        notificationGrouped,
        ...(markComplete && { sectionComplete: true }),
      });
    } else if (currentStep === 'conversation') {
      await preferencesApi.updateConversationStarters({
        goodTopics,
        avoidTopics,
        interactionTips,
        ...(markComplete && { sectionComplete: true }),
      });
    }
  };

  const handleLinkParent = async () => {
    if (!parentCode.trim()) {
      setError(t('error_parent_code_required'));
      return;
    }
    setError('');
    setIsLinkingParent(true);
    try {
      await parentApi.linkToParent(parentCode.trim());
      setNeedsParentCode(false);
      setParentCode('');
      setCurrentStep('communication');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLinkingParent(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 'profile') {
      if (!displayName.trim()) {
        setError(t('error_display_name_required'));
        return;
      }
      if (!ageGroup) {
        setError(t('error_age_group_required'));
        return;
      }
    }
    if (currentStep === 'communication') {
      if (!preferredTone) {
        setError(t('error_tone_required'));
        return;
      }
      if (commModes.length === 0) {
        setError(t('error_comm_mode_required'));
        return;
      }
    }

    setError('');
    setIsLoading(true);
    try {
      await saveCurrentStep(true);

      if (currentStep === 'profile' && ageGroup === 'age_14_17') {
        setNeedsParentCode(true);
        setIsLoading(false);
        return;
      }

      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleSaveAndExit = async () => {
    setError('');
    setIsSavingAndExiting(true);
    try {
      await saveCurrentStep(false);
      await logout();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingAndExiting(false);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const [status] = await Promise.all([usersApi.getOnboardingStatus(), usersApi.getMe()]);

      if (!status.complete) {
        const stepMapping: Record<string, Step> = {
          basic_profile: 'profile',
          communication_preferences: 'communication',
          sensory_preferences: 'sensory',
          conversation_starters: 'conversation',
        };
        const targetStep = status.currentStep && stepMapping[status.currentStep];
        if (targetStep) setCurrentStep(targetStep);
        setError(t('error_not_complete'));
        return;
      }

      await refreshUser();
      // RootNavigator will re-render and navigate to Main/Parent/Moderation
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommMode = (mode: string) => {
    setCommModes(prev => (prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]));
  };

  const addTag = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim();
    if (trimmed) {
      setter(prev => [...prev, trimmed]);
      inputSetter('');
    }
  };

  const removeTag = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const progressPercent = ((currentStepIndex + 1) / (STEPS.length - 1)) * 100;

  // ---------- Renderers for each step ----------

  const renderProfileStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('profile_title')}</Text>
      <Text style={styles.stepDescription}>{t('profile_description')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('display_name')}</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('display_name_placeholder')}
          placeholderTextColor="#9ca3af"
          accessibilityLabel={t('display_name')}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('age_group')}</Text>
        {(['age_14_17', 'age_18_25', 'age_26_40', 'age_40_plus'] as AgeGroup[]).map(ag => (
          <TouchableOpacity
            key={ag}
            style={[styles.radioRow, ageGroup === ag && styles.radioRowSelected]}
            onPress={() => setAgeGroup(ag)}
            accessibilityRole="radio"
            accessibilityState={{ selected: ageGroup === ag }}
          >
            <View style={[styles.radio, ageGroup === ag && styles.radioSelected]}>
              {ageGroup === ag && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{t(ag)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('profile_visibility')}</Text>
        {(['visible', 'limited', 'hidden'] as ProfileVisibility[]).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.radioRow, profileVisibility === v && styles.radioRowSelected]}
            onPress={() => setProfileVisibility(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: profileVisibility === v }}
          >
            <View style={[styles.radio, profileVisibility === v && styles.radioSelected]}>
              {profileVisibility === v && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>{t(`visibility_${v}`)}</Text>
              <Text style={styles.radioDesc}>{t(`visibility_${v}_desc`)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderParentCodeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('parent_code_title')}</Text>
      <Text style={styles.stepDescription}>{t('parent_code_description')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('parent_code_title')}</Text>
        <TextInput
          style={[styles.input, styles.monoInput]}
          value={parentCode}
          onChangeText={text => setParentCode(text.toUpperCase())}
          placeholder={t('parent_code_placeholder')}
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          autoFocus
          accessibilityLabel={t('parent_code_title')}
        />
      </View>

      <Text style={styles.hintText}>{t('parent_code_no_code')}</Text>

      <View style={styles.parentCodeButtons}>
        <TouchableOpacity onPress={() => setNeedsParentCode(false)} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLinkParent}
          disabled={isLinkingParent}
          style={[styles.primaryButton, isLinkingParent && styles.buttonDisabled]}
          accessibilityState={{ busy: isLinkingParent }}
        >
          {isLinkingParent ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('parent_code_submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommunicationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('communication_title')}</Text>
      <Text style={styles.stepDescription}>{t('communication_description')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('preferred_tone')}</Text>
        <View style={styles.toneGrid}>
          {TONES.map(tone => (
            <TouchableOpacity
              key={tone}
              style={[styles.toneCard, preferredTone === tone && styles.toneCardSelected]}
              onPress={() => setPreferredTone(tone)}
              accessibilityRole="radio"
              accessibilityState={{ selected: preferredTone === tone }}
            >
              <Text style={[styles.toneLabel, preferredTone === tone && styles.toneLabelSelected]}>
                {t(`tone_${tone}`)}
              </Text>
              <Text style={styles.toneDesc}>{t(`tone_${tone}_desc`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('comm_modes')}</Text>
        <View style={styles.chipRow}>
          {COMM_MODES.map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.chip, commModes.includes(mode) && styles.chipSelected]}
              onPress={() => toggleCommMode(mode)}
              accessibilityRole="button"
              accessibilityState={{ selected: commModes.includes(mode) }}
            >
              <Text style={[styles.chipText, commModes.includes(mode) && styles.chipTextSelected]}>
                {t(`comm_mode_${mode}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.toggleField}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>{t('slow_replies_ok')}</Text>
          <Text style={styles.toggleDesc}>{t('slow_replies_ok_desc')}</Text>
        </View>
        <Switch
          value={slowRepliesOk}
          onValueChange={setSlowRepliesOk}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={slowRepliesOk ? '#2563eb' : '#f4f4f5'}
        />
      </View>

      <View style={styles.toggleField}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>{t('one_message_at_time')}</Text>
          <Text style={styles.toggleDesc}>{t('one_message_at_time_desc')}</Text>
        </View>
        <Switch
          value={oneMessageAtTime}
          onValueChange={setOneMessageAtTime}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={oneMessageAtTime ? '#2563eb' : '#f4f4f5'}
        />
      </View>

      <View style={styles.toggleField}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>{t('read_without_reply')}</Text>
          <Text style={styles.toggleDesc}>{t('read_without_reply_desc')}</Text>
        </View>
        <Switch
          value={readWithoutReply}
          onValueChange={setReadWithoutReply}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={readWithoutReply ? '#2563eb' : '#f4f4f5'}
        />
      </View>
    </View>
  );

  const renderSensoryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('sensory_title')}</Text>
      <Text style={styles.stepDescription}>{t('sensory_description')}</Text>

      <View style={styles.toggleField}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>{t('enable_animations')}</Text>
          <Text style={styles.toggleDesc}>{t('enable_animations_desc')}</Text>
        </View>
        <Switch
          value={enableAnimations}
          onValueChange={setEnableAnimations}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={enableAnimations ? '#2563eb' : '#f4f4f5'}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('color_intensity')}</Text>
        <View style={styles.chipRow}>
          {INTENSITIES.map(intensity => (
            <TouchableOpacity
              key={intensity}
              style={[styles.intensityChip, colorIntensity === intensity && styles.chipSelected]}
              onPress={() => setColorIntensity(intensity)}
              accessibilityRole="button"
              accessibilityState={{ selected: colorIntensity === intensity }}
            >
              <Text
                style={[styles.chipText, colorIntensity === intensity && styles.chipTextSelected]}
              >
                {t(`color_${intensity}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.toggleField}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>{t('sound_enabled')}</Text>
          <Text style={styles.toggleDesc}>{t('sound_enabled_desc')}</Text>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={soundEnabled ? '#2563eb' : '#f4f4f5'}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          {t('notification_limit')}: {notificationLimit}
        </Text>
        <Text style={styles.hintText}>{t('notification_limit_desc')}</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={20}
          step={1}
          value={notificationLimit}
          onValueChange={setNotificationLimit}
          minimumTrackTintColor="#2563eb"
          maximumTrackTintColor="#d1d5db"
          thumbTintColor="#2563eb"
          accessibilityLabel={t('notification_limit')}
          accessibilityValue={{
            min: 0,
            max: 20,
            now: notificationLimit,
          }}
        />
      </View>

      <View style={styles.toggleField}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>{t('notification_grouped')}</Text>
          <Text style={styles.toggleDesc}>{t('notification_grouped_desc')}</Text>
        </View>
        <Switch
          value={notificationGrouped}
          onValueChange={setNotificationGrouped}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={notificationGrouped ? '#2563eb' : '#f4f4f5'}
        />
      </View>
    </View>
  );

  const renderTagInput = (
    label: string,
    hint: string,
    placeholder: string,
    tags: string[],
    tagColor: string,
    inputValue: string,
    onChangeInput: (v: string) => void,
    onAdd: () => void,
    onRemove: (i: number) => void
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hintText}>{hint}</Text>
      <View style={styles.tagInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={inputValue}
          onChangeText={onChangeInput}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
          accessibilityLabel={t('common:add')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View
            key={`${tag}-${index}`}
            style={[
              styles.tag,
              tagColor === 'green' && styles.tagGreen,
              tagColor === 'red' && styles.tagRed,
              tagColor === 'blue' && styles.tagBlue,
            ]}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => onRemove(index)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`${t('common:remove')} ${tag}`}
            >
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderConversationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('conversation_title')}</Text>
      <Text style={styles.stepDescription}>{t('conversation_description')}</Text>

      {renderTagInput(
        t('good_topics'),
        t('good_topics_hint'),
        t('good_topics_placeholder'),
        goodTopics,
        'green',
        goodTopicInput,
        setGoodTopicInput,
        () => addTag(goodTopicInput, setGoodTopics, setGoodTopicInput),
        i => removeTag(i, setGoodTopics)
      )}

      {renderTagInput(
        t('avoid_topics'),
        t('avoid_topics_hint'),
        t('avoid_topics_placeholder'),
        avoidTopics,
        'red',
        avoidTopicInput,
        setAvoidTopicInput,
        () => addTag(avoidTopicInput, setAvoidTopics, setAvoidTopicInput),
        i => removeTag(i, setAvoidTopics)
      )}

      {renderTagInput(
        t('interaction_tips'),
        t('interaction_tips_hint'),
        t('interaction_tips_placeholder'),
        interactionTips,
        'blue',
        tipInput,
        setTipInput,
        () => addTag(tipInput, setInteractionTips, setTipInput),
        i => removeTag(i, setInteractionTips)
      )}
    </View>
  );

  const renderCompleteStep = () => (
    <View style={[styles.stepContent, { alignItems: 'center', paddingVertical: 32 }]}>
      <Text style={styles.completeIcon}>✓</Text>
      <Text style={styles.completeTitle}>{t('complete_title')}</Text>
      <Text style={styles.completeDesc}>{t('complete_description')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Cancel / Logout */}
          <View style={styles.topBar}>
            <View />
            <TouchableOpacity onPress={logout} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{t('common:cancel')}</Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Text style={styles.title}>{t('common:app_name')}</Text>
          <Text style={styles.headerSubtitle}>{t('title')}</Text>
          {currentStep !== 'complete' && (
            <Text style={styles.stepIndicator}>
              {t('step', { current: currentStepIndex + 1, total: STEPS.length - 1 })}
            </Text>
          )}

          {/* Progress bar */}
          {currentStep !== 'complete' && (
            <View style={styles.progressContainer}>
              <View style={styles.stepsRow}>
                {STEPS.slice(0, -1).map((step, index) => (
                  <View
                    key={step}
                    style={[styles.stepDot, index <= currentStepIndex && styles.stepDotActive]}
                    accessibilityLabel={`${t('step', { current: index + 1, total: STEPS.length - 1 })}`}
                  >
                    <Text
                      style={[
                        styles.stepDotText,
                        index <= currentStepIndex && styles.stepDotTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )}

          {/* Resumed notice */}
          {resumed && (
            <View style={styles.resumeBanner} accessibilityRole="alert">
              <Text style={styles.resumeText}>{t('resume_message')}</Text>
            </View>
          )}

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Step content */}
          <View style={styles.card}>
            {currentStep === 'profile' && !needsParentCode && renderProfileStep()}
            {currentStep === 'profile' && needsParentCode && renderParentCodeStep()}
            {currentStep === 'communication' && renderCommunicationStep()}
            {currentStep === 'sensory' && renderSensoryStep()}
            {currentStep === 'conversation' && renderConversationStep()}
            {currentStep === 'complete' && renderCompleteStep()}

            {/* Navigation buttons */}
            {!needsParentCode && (
              <View style={styles.navButtons}>
                <View style={styles.navRow}>
                  {currentStepIndex > 0 && currentStep !== 'complete' ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                      <Text style={styles.backButtonText}>{t('back')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  {currentStep === 'complete' ? (
                    <TouchableOpacity
                      onPress={handleFinish}
                      disabled={isLoading}
                      style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                      accessibilityState={{ busy: isLoading }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>{t('go_to_app')}</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleNext}
                      disabled={isLoading || isSavingAndExiting}
                      style={[
                        styles.primaryButton,
                        (isLoading || isSavingAndExiting) && styles.buttonDisabled,
                      ]}
                      accessibilityState={{ busy: isLoading }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {currentStepIndex === STEPS.length - 2 ? t('finish') : t('next')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {currentStep !== 'complete' && (
                  <TouchableOpacity
                    onPress={handleSaveAndExit}
                    disabled={isLoading || isSavingAndExiting}
                    style={styles.saveExitButton}
                    accessibilityState={{ busy: isSavingAndExiting }}
                  >
                    {isSavingAndExiting ? (
                      <ActivityIndicator color="#6b7280" size="small" />
                    ) : (
                      <Text style={styles.saveExitText}>{t('save_and_exit')}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: { color: '#dc2626', fontSize: 14 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4b5563',
    marginTop: 4,
  },
  stepIndicator: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 4,
  },
  progressContainer: { marginTop: 16, marginBottom: 16 },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#2563eb' },
  stepDotText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  stepDotTextActive: { color: '#fff' },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  resumeBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resumeText: { color: '#1d4ed8', fontSize: 14 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#b91c1c', fontSize: 14 },
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
  stepContent: { marginBottom: 8 },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 20,
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
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
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 18,
    letterSpacing: 2,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  radioRowSelected: { backgroundColor: '#eff6ff' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#2563eb' },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  radioLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  radioDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toneCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  toneCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  toneLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toneLabelSelected: { color: '#2563eb' },
  toneDesc: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  chipSelected: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#fff' },
  intensityChip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  toggleField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: '#111827' },
  toggleDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
  },
  tagGreen: { backgroundColor: '#dcfce7' },
  tagRed: { backgroundColor: '#fef2f2' },
  tagBlue: { backgroundColor: '#eff6ff' },
  tagText: { fontSize: 14, color: '#374151', marginRight: 6 },
  tagRemove: { fontSize: 18, color: '#6b7280', fontWeight: '600' },
  completeIcon: {
    fontSize: 60,
    color: '#22c55e',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  completeDesc: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  navButtons: { marginTop: 24 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { paddingVertical: 10, paddingHorizontal: 16 },
  backButtonText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  parentCodeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveExitButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  saveExitText: {
    color: '#6b7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

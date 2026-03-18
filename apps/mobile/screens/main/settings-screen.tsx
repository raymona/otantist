import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useAuth, useApiError } from '../../contexts/auth-context';
import { usersApi } from '../../lib/api/users';
import { preferencesApi } from '../../lib/api/preferences';
import { safetyApi } from '../../lib/api/safety';
import type { AgeGroup, ProfileVisibility } from '../../lib/api/users';
import type { TonePreference, ColorIntensity, TimeBoundary } from '../../lib/api/preferences';
import type { BlockedUser } from '../../lib/types';
import { appStorage } from '../../lib/storage';
import { STORAGE_KEYS } from '../../lib/constants';

type SectionName =
  | 'profile'
  | 'communication'
  | 'sensory'
  | 'conversation'
  | 'timeBoundaries'
  | 'account';

const TONES: TonePreference[] = ['gentle', 'direct', 'enthusiastic', 'formal'];
const COMM_MODES = ['text', 'emoji', 'voice', 'images'];
const INTENSITIES: ColorIntensity[] = ['standard', 'reduced', 'minimal'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DEFAULT_BOUNDARIES: TimeBoundary[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  availableStart: '09:00',
  availableEnd: '21:00',
  isActive: false,
}));

export function SettingsScreen() {
  const { t, i18n } = useTranslation('settings');
  const { user, logout, refreshUser } = useAuth();
  const { getErrorMessage } = useApiError();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openSection, setOpenSection] = useState<SectionName | null>('profile');

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('visible');

  // Communication
  const [preferredTone, setPreferredTone] = useState<TonePreference | ''>('');
  const [commModes, setCommModes] = useState<string[]>([]);
  const [slowRepliesOk, setSlowRepliesOk] = useState(false);
  const [oneMessageAtTime, setOneMessageAtTime] = useState(false);
  const [readWithoutReply, setReadWithoutReply] = useState(false);

  // Sensory
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [colorIntensity, setColorIntensity] = useState<ColorIntensity>('standard');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationLimit, setNotificationLimit] = useState(5);
  const [notificationGrouped, setNotificationGrouped] = useState(true);

  // Conversation starters
  const [goodTopics, setGoodTopics] = useState<string[]>([]);
  const [avoidTopics, setAvoidTopics] = useState<string[]>([]);
  const [interactionTips, setInteractionTips] = useState<string[]>([]);
  const [goodTopicInput, setGoodTopicInput] = useState('');
  const [avoidTopicInput, setAvoidTopicInput] = useState('');
  const [tipInput, setTipInput] = useState('');

  // Time boundaries
  const [boundaries, setBoundaries] = useState<TimeBoundary[]>(DEFAULT_BOUNDARIES);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);

  // Session timer
  const [sessionDuration, setSessionDuration] = useState(0); // 0 = off

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load profile from user context
      if (user) {
        setDisplayName(user.displayName || '');
        if (user.ageGroup) setAgeGroup(user.ageGroup as AgeGroup);
        if (user.profileVisibility)
          setProfileVisibility(user.profileVisibility as ProfileVisibility);
      }

      // Load preferences
      const [commPrefs, sensPrefs, convStarters, timeBounds, blocked] = await Promise.all([
        preferencesApi.getCommunication().catch(() => null),
        preferencesApi.getSensory().catch(() => null),
        preferencesApi.getConversationStarters().catch(() => null),
        preferencesApi.getTimeBoundaries().catch(() => null),
        safetyApi.getBlockedUsers().catch(() => []),
      ]);

      if (commPrefs) {
        if (commPrefs.commModes?.length) setCommModes(commPrefs.commModes);
        if (commPrefs.preferredTone) setPreferredTone(commPrefs.preferredTone);
        if (commPrefs.slowRepliesOk != null) setSlowRepliesOk(commPrefs.slowRepliesOk);
        if (commPrefs.oneMessageAtTime != null) setOneMessageAtTime(commPrefs.oneMessageAtTime);
        if (commPrefs.readWithoutReply != null) setReadWithoutReply(commPrefs.readWithoutReply);
      }
      if (sensPrefs) {
        if (sensPrefs.enableAnimations != null) setEnableAnimations(sensPrefs.enableAnimations);
        if (sensPrefs.colorIntensity) setColorIntensity(sensPrefs.colorIntensity);
        if (sensPrefs.soundEnabled != null) setSoundEnabled(sensPrefs.soundEnabled);
        if (sensPrefs.notificationLimit != null) setNotificationLimit(sensPrefs.notificationLimit);
        if (sensPrefs.notificationGrouped != null)
          setNotificationGrouped(sensPrefs.notificationGrouped);
      }
      if (convStarters) {
        if (convStarters.goodTopics?.length) setGoodTopics(convStarters.goodTopics);
        if (convStarters.avoidTopics?.length) setAvoidTopics(convStarters.avoidTopics);
        if (convStarters.interactionTips?.length) setInteractionTips(convStarters.interactionTips);
      }
      if (timeBounds?.boundaries?.length) {
        const merged = DEFAULT_BOUNDARIES.map(d => {
          const saved = timeBounds.boundaries.find(b => b.dayOfWeek === d.dayOfWeek);
          return saved ? { ...saved, isActive: true } : d;
        });
        setBoundaries(merged);
      }

      setBlockedUsers(blocked);

      // Load session timer from storage
      const timerVal = await appStorage.get(STORAGE_KEYS.SESSION_TIMER);
      if (timerVal) setSessionDuration(parseInt(timerVal, 10) || 0);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        usersApi.updateProfile({
          displayName: displayName || undefined,
          ageGroup: ageGroup || undefined,
          profileVisibility,
        }),
        preferencesApi.updateCommunication({
          preferredTone: preferredTone || undefined,
          commModes,
          slowRepliesOk,
          oneMessageAtTime,
          readWithoutReply,
        }),
        preferencesApi.updateSensory({
          enableAnimations,
          colorIntensity,
          soundEnabled,
          notificationLimit,
          notificationGrouped,
        }),
        preferencesApi.updateConversationStarters({
          goodTopics,
          avoidTopics,
          interactionTips,
        }),
        preferencesApi.updateTimeBoundaries(boundaries),
        appStorage.set(STORAGE_KEYS.SESSION_TIMER, String(sessionDuration)),
      ]);
      await refreshUser();
      Alert.alert(t('save_success'));
    } catch (err) {
      Alert.alert(t('common:error'), getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageToggle = async () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
    await appStorage.set(STORAGE_KEYS.LANGUAGE, next);
    try {
      await usersApi.updateLanguage(next as 'fr' | 'en');
    } catch {
      // silent
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await safetyApi.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      // silent
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

  const toggleSection = (section: SectionName) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const SESSION_OPTIONS = [0, 15, 30, 45, 60, 90, 120];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const renderSectionHeader = (section: SectionName, title: string) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
      accessibilityRole="button"
      accessibilityState={{ expanded: openSection === section }}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.chevron}>{openSection === section ? '▾' : '▸'}</Text>
    </TouchableOpacity>
  );

  const renderTagInput = (
    label: string,
    tags: string[],
    tagColor: string,
    inputValue: string,
    onChangeInput: (v: string) => void,
    onAdd: () => void,
    onRemove: (i: number) => void
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tagInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={inputValue}
          onChangeText={onChangeInput}
          returnKeyType="done"
          onSubmitEditing={onAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
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
            >
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>{t('title')}</Text>

      {/* Save All */}
      <TouchableOpacity
        style={[styles.saveAllButton, isSaving && styles.buttonDisabled]}
        onPress={saveAll}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveAllText}>{t('save_all')}</Text>
        )}
      </TouchableOpacity>

      {/* Profile */}
      {renderSectionHeader('profile', t('section_profile'))}
      {openSection === 'profile' && (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('display_name')}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
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
                <Text style={styles.radioLabel}>{t(`onboarding:${ag}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('visibility')}</Text>
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
                <Text style={styles.radioLabel}>{t(`onboarding:visibility_${v}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Communication */}
      {renderSectionHeader('communication', t('section_communication'))}
      {openSection === 'communication' && (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('preferred_tone')}</Text>
            <View style={styles.chipRow}>
              {TONES.map(tone => (
                <TouchableOpacity
                  key={tone}
                  style={[styles.chip, preferredTone === tone && styles.chipSelected]}
                  onPress={() => setPreferredTone(tone)}
                >
                  <Text
                    style={[styles.chipText, preferredTone === tone && styles.chipTextSelected]}
                  >
                    {t(`onboarding:tone_${tone}`)}
                  </Text>
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
                >
                  <Text
                    style={[styles.chipText, commModes.includes(mode) && styles.chipTextSelected]}
                  >
                    {t(`onboarding:comm_mode_${mode}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('onboarding:slow_replies_ok')}</Text>
            <Switch value={slowRepliesOk} onValueChange={setSlowRepliesOk} />
          </View>
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('onboarding:one_message_at_time')}</Text>
            <Switch value={oneMessageAtTime} onValueChange={setOneMessageAtTime} />
          </View>
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('onboarding:read_without_reply')}</Text>
            <Switch value={readWithoutReply} onValueChange={setReadWithoutReply} />
          </View>
        </View>
      )}

      {/* Sensory */}
      {renderSectionHeader('sensory', t('section_sensory'))}
      {openSection === 'sensory' && (
        <View style={styles.sectionContent}>
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('onboarding:enable_animations')}</Text>
            <Switch value={enableAnimations} onValueChange={setEnableAnimations} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('onboarding:color_intensity')}</Text>
            <View style={styles.chipRow}>
              {INTENSITIES.map(i => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, colorIntensity === i && styles.chipSelected]}
                  onPress={() => setColorIntensity(i)}
                >
                  <Text style={[styles.chipText, colorIntensity === i && styles.chipTextSelected]}>
                    {t(`onboarding:color_${i}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('onboarding:sound_enabled')}</Text>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>
              {t('onboarding:notification_limit')}: {notificationLimit}
            </Text>
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
            />
          </View>
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('onboarding:notification_grouped')}</Text>
            <Switch value={notificationGrouped} onValueChange={setNotificationGrouped} />
          </View>
        </View>
      )}

      {/* Conversation Starters */}
      {renderSectionHeader('conversation', t('section_conversation'))}
      {openSection === 'conversation' && (
        <View style={styles.sectionContent}>
          {renderTagInput(
            t('onboarding:good_topics'),
            goodTopics,
            'green',
            goodTopicInput,
            setGoodTopicInput,
            () => addTag(goodTopicInput, setGoodTopics, setGoodTopicInput),
            i => removeTag(i, setGoodTopics)
          )}
          {renderTagInput(
            t('onboarding:avoid_topics'),
            avoidTopics,
            'red',
            avoidTopicInput,
            setAvoidTopicInput,
            () => addTag(avoidTopicInput, setAvoidTopics, setAvoidTopicInput),
            i => removeTag(i, setAvoidTopics)
          )}
          {renderTagInput(
            t('onboarding:interaction_tips'),
            interactionTips,
            'blue',
            tipInput,
            setTipInput,
            () => addTag(tipInput, setInteractionTips, setTipInput),
            i => removeTag(i, setInteractionTips)
          )}
        </View>
      )}

      {/* Time Boundaries */}
      {renderSectionHeader('timeBoundaries', t('section_time_boundaries'))}
      {openSection === 'timeBoundaries' && (
        <View style={styles.sectionContent}>
          <Text style={styles.hintText}>{t('time_boundaries_hint')}</Text>
          {boundaries.map((boundary, index) => (
            <View key={boundary.dayOfWeek} style={styles.boundaryRow}>
              <View style={styles.boundaryHeader}>
                <Text style={styles.dayLabel}>{t(`common:${DAYS[boundary.dayOfWeek]}`)}</Text>
                <Switch
                  value={boundary.isActive}
                  onValueChange={val => {
                    setBoundaries(prev =>
                      prev.map((b, i) => (i === index ? { ...b, isActive: val } : b))
                    );
                  }}
                />
              </View>
              {boundary.isActive && (
                <View style={styles.boundaryTimes}>
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>{t('available_start')}</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={boundary.availableStart}
                      onChangeText={val => {
                        setBoundaries(prev =>
                          prev.map((b, i) => (i === index ? { ...b, availableStart: val } : b))
                        );
                      }}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>{t('available_end')}</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={boundary.availableEnd}
                      onChangeText={val => {
                        setBoundaries(prev =>
                          prev.map((b, i) => (i === index ? { ...b, availableEnd: val } : b))
                        );
                      }}
                      placeholder="21:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Account */}
      {renderSectionHeader('account', t('section_account'))}
      {openSection === 'account' && (
        <View style={styles.sectionContent}>
          {/* Language toggle */}
          <View style={styles.toggleField}>
            <Text style={styles.toggleLabel}>{t('language')}</Text>
            <TouchableOpacity onPress={handleLanguageToggle} style={styles.langChip}>
              <Text style={styles.langChipText}>
                {i18n.language === 'fr' ? 'Français → EN' : 'English → FR'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Session timer */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('session_timer')}</Text>
            <Text style={styles.hintText}>{t('session_timer_hint')}</Text>
            <View style={styles.chipRow}>
              {SESSION_OPTIONS.map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.chip, sessionDuration === mins && styles.chipSelected]}
                  onPress={() => setSessionDuration(mins)}
                >
                  <Text
                    style={[styles.chipText, sessionDuration === mins && styles.chipTextSelected]}
                  >
                    {mins === 0 ? t('off') : `${mins}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Blocked users */}
          <TouchableOpacity
            style={styles.blockedToggle}
            onPress={() => setShowBlocked(!showBlocked)}
          >
            <Text style={styles.label}>
              {t('blocked_users')} ({blockedUsers.length})
            </Text>
            <Text style={styles.chevron}>{showBlocked ? '▾' : '▸'}</Text>
          </TouchableOpacity>
          {showBlocked && blockedUsers.length > 0 && (
            <View style={styles.blockedList}>
              {blockedUsers.map(bu => (
                <View key={bu.id} style={styles.blockedRow}>
                  <Text style={styles.blockedName}>{bu.displayName || t('common:anonymous')}</Text>
                  <TouchableOpacity
                    onPress={() => handleUnblock(bu.id)}
                    style={styles.unblockButton}
                  >
                    <Text style={styles.unblockText}>{t('unblock')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  saveAllButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveAllText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  chevron: { fontSize: 16, color: '#6b7280' },
  sectionContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  hintText: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
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
  radioLabel: { fontSize: 15, color: '#111827' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  chipSelected: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#fff' },
  toggleField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
  tagInputRow: { flexDirection: 'row', gap: 8 },
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
  boundaryRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  boundaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  boundaryTimes: { flexDirection: 'row', gap: 12, marginTop: 8 },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  timeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#111827',
  },
  langChip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
  },
  langChipText: { fontSize: 14, color: '#2563eb', fontWeight: '500' },
  blockedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  blockedList: { marginTop: 8 },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  blockedName: { fontSize: 14, color: '#374151' },
  unblockButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unblockText: { fontSize: 13, color: '#374151' },
  logoutButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});

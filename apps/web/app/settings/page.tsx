'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useSensory } from '@/lib/sensory-context';
import {
  usersApi,
  preferencesApi,
  type AgeGroup,
  type ProfileVisibility,
  type TonePreference,
  type ColorIntensity,
  type TimeBoundary,
} from '@/lib/api';
import StepProfile from '@/components/onboarding/StepProfile';
import StepCommunication from '@/components/onboarding/StepCommunication';
import StepSensory from '@/components/onboarding/StepSensory';
import StepConversation from '@/components/onboarding/StepConversation';
import TimeBoundariesEditor from '@/components/settings/TimeBoundariesEditor';

const DEFAULT_BOUNDARIES: TimeBoundary[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: '09:00',
  endTime: '21:00',
  isActive: false,
}));

type SectionName =
  | 'profile'
  | 'communication'
  | 'sensory'
  | 'conversation'
  | 'timeBoundaries'
  | 'language';

export default function SettingsPage() {
  const { t, i18n, ready: i18nReady } = useTranslation('settings');
  const router = useRouter();
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');
  const { refreshSensory } = useSensory();

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('visible');

  // Communication state
  const [preferredTone, setPreferredTone] = useState<TonePreference | ''>('');
  const [commModes, setCommModes] = useState<string[]>([]);
  const [slowRepliesOk, setSlowRepliesOk] = useState(false);
  const [oneMessageAtTime, setOneMessageAtTime] = useState(false);
  const [readWithoutReply, setReadWithoutReply] = useState(false);

  // Sensory state
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [colorIntensity, setColorIntensity] = useState<ColorIntensity>('standard');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationLimit, setNotificationLimit] = useState(10);
  const [notificationGrouped, setNotificationGrouped] = useState(false);

  // Conversation starters state
  const [goodTopics, setGoodTopics] = useState<string[]>([]);
  const [avoidTopics, setAvoidTopics] = useState<string[]>([]);
  const [interactionTips, setInteractionTips] = useState<string[]>([]);

  // Time boundaries state
  const [boundaries, setBoundaries] = useState<TimeBoundary[]>(DEFAULT_BOUNDARIES);

  // Language state
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  // Dirty tracking + save status
  const [dirtySections, setDirtySections] = useState<Set<SectionName>>(new Set());
  const [savingSection, setSavingSection] = useState<SectionName | null>(null);
  const [sectionStatus, setSectionStatus] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});

  const markDirty = (section: SectionName) => {
    setDirtySections(prev => new Set(prev).add(section));
    setSectionStatus(prev => {
      const next = { ...prev };
      delete next[section];
      return next;
    });
  };

  // Load all data on mount
  useEffect(() => {
    if (!isReady) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [user, commPrefs, sensoryPrefs, convStarters, timeBounds] = await Promise.all([
          usersApi.getMe(),
          preferencesApi.getCommunication(),
          preferencesApi.getSensory(),
          preferencesApi.getConversationStarters(),
          preferencesApi.getTimeBoundaries().catch(() => ({ boundaries: [] })),
        ]);

        // Profile
        setDisplayName(user.displayName || '');
        setAgeGroup((user.ageGroup as AgeGroup) || '');
        setProfileVisibility((user.profileVisibility as ProfileVisibility) || 'visible');

        // Communication
        setPreferredTone((commPrefs.preferredTone as TonePreference) || '');
        setCommModes(commPrefs.commModes || []);
        setSlowRepliesOk(commPrefs.slowRepliesOk ?? false);
        setOneMessageAtTime(commPrefs.oneMessageAtTime ?? false);
        setReadWithoutReply(commPrefs.readWithoutReply ?? false);

        // Sensory
        setEnableAnimations(sensoryPrefs.enableAnimations);
        setColorIntensity((sensoryPrefs.colorIntensity as ColorIntensity) || 'standard');
        setSoundEnabled(sensoryPrefs.soundEnabled);
        setNotificationLimit(sensoryPrefs.notificationLimit ?? 10);
        setNotificationGrouped(sensoryPrefs.notificationGrouped);

        // Conversation starters
        setGoodTopics(convStarters.goodTopics || []);
        setAvoidTopics(convStarters.avoidTopics || []);
        setInteractionTips(convStarters.interactionTips || []);

        // Time boundaries
        if (timeBounds.boundaries.length > 0) {
          setBoundaries(timeBounds.boundaries);
        }

        // Language
        setLanguage(user.language || 'fr');
      } catch {
        // Non-critical — sections will show default values
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isReady]);

  // Keep a ref so event handlers always see current dirty state
  const dirtySectionsRef = useRef(dirtySections);
  useEffect(() => {
    dirtySectionsRef.current = dirtySections;
  }, [dirtySections]);

  // Warn on unsaved changes (tab close / URL change)
  useEffect(() => {
    if (dirtySections.size === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtySections.size]);

  // Guard browser back button
  useEffect(() => {
    // Push a duplicate history entry so back button triggers popstate
    // instead of immediately leaving
    history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (dirtySectionsRef.current.size > 0 && !window.confirm(t('unsaved_warning'))) {
        // User cancelled — stay on settings, re-push the guard entry
        history.pushState(null, '', window.location.href);
      } else {
        // User confirmed or nothing dirty — actually go back
        history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [t]);

  // Auto-clear success status after 3s
  useEffect(() => {
    const entries = Object.entries(sectionStatus).filter(([, v]) => v.type === 'success');
    if (entries.length === 0) return;
    const timer = setTimeout(() => {
      setSectionStatus(prev => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(next)) {
          if (val.type === 'success') delete next[key];
        }
        return next;
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [sectionStatus]);

  // --- Save handlers ---

  const saveSection = async (section: SectionName, saveFn: () => Promise<void>) => {
    setSavingSection(section);
    try {
      await saveFn();
      setDirtySections(prev => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
      setSectionStatus(prev => ({ ...prev, [section]: { type: 'success', message: t('saved') } }));
    } catch {
      setSectionStatus(prev => ({
        ...prev,
        [section]: { type: 'error', message: t('error_saving') },
      }));
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveProfile = () =>
    saveSection('profile', async () => {
      await usersApi.updateProfile({
        displayName: displayName || undefined,
        ageGroup: ageGroup || undefined,
        profileVisibility,
      });
    });

  const handleSaveCommunication = () =>
    saveSection('communication', async () => {
      await preferencesApi.updateCommunication({
        preferredTone: preferredTone || undefined,
        commModes,
        slowRepliesOk,
        oneMessageAtTime,
        readWithoutReply,
      });
    });

  const handleSaveSensory = () =>
    saveSection('sensory', async () => {
      await preferencesApi.updateSensory({
        enableAnimations,
        colorIntensity,
        soundEnabled,
        notificationLimit,
        notificationGrouped,
      });
      await refreshSensory();
    });

  const handleSaveConversation = () =>
    saveSection('conversation', async () => {
      await preferencesApi.updateConversationStarters({
        goodTopics,
        avoidTopics,
        interactionTips,
      });
    });

  const handleSaveTimeBoundaries = () =>
    saveSection('timeBoundaries', async () => {
      await preferencesApi.updateTimeBoundaries(boundaries);
    });

  const handleSaveLanguage = () =>
    saveSection('language', async () => {
      await usersApi.updateLanguage(language);
      await i18n.changeLanguage(language);
    });

  // --- Comm mode toggle ---

  const handleToggleCommMode = useCallback((mode: string) => {
    setCommModes(prev => (prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]));
    markDirty('communication');
  }, []);

  // --- Time boundary change ---

  const handleBoundaryChange = useCallback(
    (dayOfWeek: number, field: keyof TimeBoundary, value: string | boolean) => {
      setBoundaries(prev =>
        prev.map(b => (b.dayOfWeek === dayOfWeek ? { ...b, [field]: value } : b))
      );
      markDirty('timeBoundaries');
    },
    []
  );

  // --- Tag handlers (conversation starters) ---

  const handleAddGoodTopic = useCallback((tag: string) => {
    setGoodTopics(prev => [...prev, tag]);
    markDirty('conversation');
  }, []);
  const handleRemoveGoodTopic = useCallback((index: number) => {
    setGoodTopics(prev => prev.filter((_, i) => i !== index));
    markDirty('conversation');
  }, []);
  const handleAddAvoidTopic = useCallback((tag: string) => {
    setAvoidTopics(prev => [...prev, tag]);
    markDirty('conversation');
  }, []);
  const handleRemoveAvoidTopic = useCallback((index: number) => {
    setAvoidTopics(prev => prev.filter((_, i) => i !== index));
    markDirty('conversation');
  }, []);
  const handleAddTip = useCallback((tag: string) => {
    setInteractionTips(prev => [...prev, tag]);
    markDirty('conversation');
  }, []);
  const handleRemoveTip = useCallback((index: number) => {
    setInteractionTips(prev => prev.filter((_, i) => i !== index));
    markDirty('conversation');
  }, []);

  // Loading states
  if (authLoading || !i18nReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <p className="text-gray-600">{t('common:loading')}</p>
      </div>
    );
  }

  if (!isReady) {
    return null;
  }

  const renderSectionFooter = (section: SectionName, onSave: () => void) => {
    const status = sectionStatus[section];
    const isSaving = savingSection === section;
    const isDirty = dirtySections.has(section);

    return (
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? t('saving') : t('save')}
        </button>
        {status && (
          <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
          >
            {status.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={() => {
              if (dirtySections.size > 0 && !window.confirm(t('unsaved_warning'))) {
                return;
              }
              router.push('/dashboard');
            }}
            className="text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            &larr; {t('back_to_dashboard')}
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {isLoadingData ? (
          <div role="status" className="flex justify-center py-12">
            <p className="text-gray-600">{t('common:loading')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Profile Section */}
            <section aria-labelledby="settings-profile">
              <h2 id="settings-profile" className="mb-4 text-lg font-semibold text-gray-900">
                {t('section_profile')}
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <StepProfile
                  displayName={displayName}
                  ageGroup={ageGroup}
                  profileVisibility={profileVisibility}
                  onDisplayNameChange={v => {
                    setDisplayName(v);
                    markDirty('profile');
                  }}
                  onAgeGroupChange={v => {
                    setAgeGroup(v);
                    markDirty('profile');
                  }}
                  onVisibilityChange={v => {
                    setProfileVisibility(v);
                    markDirty('profile');
                  }}
                />
                {renderSectionFooter('profile', handleSaveProfile)}
              </div>
            </section>

            {/* Communication Section */}
            <section aria-labelledby="settings-communication">
              <h2 id="settings-communication" className="mb-4 text-lg font-semibold text-gray-900">
                {t('section_communication')}
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <StepCommunication
                  preferredTone={preferredTone}
                  commModes={commModes}
                  slowRepliesOk={slowRepliesOk}
                  oneMessageAtTime={oneMessageAtTime}
                  readWithoutReply={readWithoutReply}
                  onToneChange={v => {
                    setPreferredTone(v);
                    markDirty('communication');
                  }}
                  onToggleCommMode={handleToggleCommMode}
                  onSlowRepliesChange={v => {
                    setSlowRepliesOk(v);
                    markDirty('communication');
                  }}
                  onOneMessageChange={v => {
                    setOneMessageAtTime(v);
                    markDirty('communication');
                  }}
                  onReadWithoutReplyChange={v => {
                    setReadWithoutReply(v);
                    markDirty('communication');
                  }}
                />
                {renderSectionFooter('communication', handleSaveCommunication)}
              </div>
            </section>

            {/* Sensory Section */}
            <section aria-labelledby="settings-sensory">
              <h2 id="settings-sensory" className="mb-4 text-lg font-semibold text-gray-900">
                {t('section_sensory')}
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <StepSensory
                  enableAnimations={enableAnimations}
                  colorIntensity={colorIntensity}
                  soundEnabled={soundEnabled}
                  notificationLimit={notificationLimit}
                  notificationGrouped={notificationGrouped}
                  onAnimationsChange={v => {
                    setEnableAnimations(v);
                    markDirty('sensory');
                  }}
                  onColorIntensityChange={v => {
                    setColorIntensity(v);
                    markDirty('sensory');
                  }}
                  onSoundChange={v => {
                    setSoundEnabled(v);
                    markDirty('sensory');
                  }}
                  onNotificationLimitChange={v => {
                    setNotificationLimit(v);
                    markDirty('sensory');
                  }}
                  onNotificationGroupedChange={v => {
                    setNotificationGrouped(v);
                    markDirty('sensory');
                  }}
                />
                {renderSectionFooter('sensory', handleSaveSensory)}
              </div>
            </section>

            {/* Conversation Starters Section */}
            <section aria-labelledby="settings-conversation">
              <h2 id="settings-conversation" className="mb-4 text-lg font-semibold text-gray-900">
                {t('section_conversation')}
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <StepConversation
                  goodTopics={goodTopics}
                  avoidTopics={avoidTopics}
                  interactionTips={interactionTips}
                  onAddGoodTopic={handleAddGoodTopic}
                  onRemoveGoodTopic={handleRemoveGoodTopic}
                  onAddAvoidTopic={handleAddAvoidTopic}
                  onRemoveAvoidTopic={handleRemoveAvoidTopic}
                  onAddTip={handleAddTip}
                  onRemoveTip={handleRemoveTip}
                />
                {renderSectionFooter('conversation', handleSaveConversation)}
              </div>
            </section>

            {/* Time Boundaries Section */}
            <section aria-labelledby="settings-time-boundaries">
              <h2
                id="settings-time-boundaries"
                className="mb-4 text-lg font-semibold text-gray-900"
              >
                {t('section_time_boundaries')}
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <TimeBoundariesEditor
                  boundaries={boundaries}
                  onBoundaryChange={handleBoundaryChange}
                />
                {renderSectionFooter('timeBoundaries', handleSaveTimeBoundaries)}
              </div>
            </section>

            {/* Language Section */}
            <section aria-labelledby="settings-language">
              <h2 id="settings-language" className="mb-4 text-lg font-semibold text-gray-900">
                {t('section_language')}
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
                <p className="mb-3 text-sm text-gray-600">{t('language_description')}</p>
                <fieldset>
                  <legend className="sr-only">{t('section_language')}</legend>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="language"
                        value="fr"
                        checked={language === 'fr'}
                        onChange={() => {
                          setLanguage('fr');
                          markDirty('language');
                        }}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">{t('language_fr')}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="language"
                        value="en"
                        checked={language === 'en'}
                        onChange={() => {
                          setLanguage('en');
                          markDirty('language');
                        }}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">{t('language_en')}</span>
                    </label>
                  </div>
                </fieldset>
                {renderSectionFooter('language', handleSaveLanguage)}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

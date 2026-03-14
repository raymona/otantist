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
import { useAuth } from '@/lib/auth-context';
import { parentApi, type GenerateCodeResponse } from '@/lib/parent-api';
import { useApiError } from '@/lib/use-api-error';
import StepProfile from '@/components/onboarding/StepProfile';
import StepCommunication from '@/components/onboarding/StepCommunication';
import StepSensory from '@/components/onboarding/StepSensory';
import StepConversation from '@/components/onboarding/StepConversation';
import TimeBoundariesEditor from '@/components/settings/TimeBoundariesEditor';

const DEFAULT_BOUNDARIES: TimeBoundary[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  availableStart: '09:00',
  availableEnd: '21:00',
  isActive: false,
}));

type SectionName =
  | 'profile'
  | 'communication'
  | 'sensory'
  | 'conversation'
  | 'timeBoundaries'
  | 'language';

const SECTION_IDS: SectionName[] = [
  'profile',
  'communication',
  'sensory',
  'conversation',
  'timeBoundaries',
  'language',
];

export default function SettingsPage() {
  const { t, i18n, ready: i18nReady } = useTranslation('settings');
  const router = useRouter();
  const { isReady, isLoading: authLoading } = useAuthGuard('onboarded');
  const { user } = useAuth();
  const { refreshSensory } = useSensory();
  const { getErrorMessage } = useApiError();

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Accordion open/close state — all open by default
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(SECTION_IDS));

  // Unsaved changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

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

  // Link minor state
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GenerateCodeResponse | null>(null);
  const [linkMinorError, setLinkMinorError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

  // Dirty tracking + save status
  const [dirtySections, setDirtySections] = useState<Set<SectionName>>(new Set());
  const [savingSection, setSavingSection] = useState<SectionName | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
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

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const scrollToSection = (section: string) => {
    // Ensure section is open
    setOpenSections(prev => new Set(prev).add(section));
    // Delay scroll to allow accordion to expand
    setTimeout(() => {
      document
        .getElementById(`settings-${section}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

        // Time boundaries — merge saved boundaries into 7-day grid
        if (timeBounds.boundaries.length > 0) {
          setBoundaries(prev =>
            prev.map(def => {
              const saved = timeBounds.boundaries.find(
                (b: TimeBoundary) => b.dayOfWeek === def.dayOfWeek
              );
              return saved ? { ...saved, isActive: true } : def;
            })
          );
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
    history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (dirtySectionsRef.current.size > 0) {
        // Show custom modal instead of confirm()
        pendingNavigationRef.current = '/dashboard';
        setShowUnsavedModal(true);
        history.pushState(null, '', window.location.href);
      } else {
        history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const saveFunctions: Record<SectionName, () => Promise<void>> = {
    profile: async () => {
      await usersApi.updateProfile({
        displayName: displayName || undefined,
        ageGroup: ageGroup || undefined,
        profileVisibility,
      });
    },
    communication: async () => {
      await preferencesApi.updateCommunication({
        preferredTone: preferredTone || undefined,
        commModes,
        slowRepliesOk,
        oneMessageAtTime,
        readWithoutReply,
      });
    },
    sensory: async () => {
      await preferencesApi.updateSensory({
        enableAnimations,
        colorIntensity,
        soundEnabled,
        notificationLimit,
        notificationGrouped,
      });
      await refreshSensory();
    },
    conversation: async () => {
      await preferencesApi.updateConversationStarters({
        goodTopics,
        avoidTopics,
        interactionTips,
      });
    },
    timeBoundaries: async () => {
      await preferencesApi.updateTimeBoundaries(boundaries);
    },
    language: async () => {
      await usersApi.updateLanguage(language);
      await i18n.changeLanguage(language);
    },
  };

  const handleSaveSection = (section: SectionName) => saveSection(section, saveFunctions[section]);

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    const sectionsToSave = Array.from(dirtySections);
    for (const section of sectionsToSave) {
      await saveSection(section, saveFunctions[section]);
    }
    setIsSavingAll(false);
  };

  const handleNavigateAway = (destination: string) => {
    if (dirtySections.size > 0) {
      pendingNavigationRef.current = destination;
      setShowUnsavedModal(true);
    } else {
      router.push(destination);
    }
  };

  const handleUnsavedSaveAndLeave = async () => {
    await handleSaveAll();
    setShowUnsavedModal(false);
    if (pendingNavigationRef.current) {
      router.push(pendingNavigationRef.current);
    }
  };

  const handleUnsavedDiscard = () => {
    setDirtySections(new Set());
    setShowUnsavedModal(false);
    if (pendingNavigationRef.current) {
      router.push(pendingNavigationRef.current);
    }
  };

  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false);
    pendingNavigationRef.current = null;
  };

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

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    setLinkMinorError('');
    setCodeCopied(false);
    try {
      const result = await parentApi.generateLinkingCode();
      setGeneratedCode(result);
    } catch (err) {
      setLinkMinorError(getErrorMessage(err));
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  const handleCopyInviteCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode.inviteCode);
      setInviteCodeCopied(true);
      setTimeout(() => setInviteCodeCopied(false), 2000);
    } catch {
      // Fallback: no-op
    }
  };

  // Determine if user is a plain adult (can generate linking codes)
  const isAdultAccount = user && !user.isModerator && !user.isSuperAdmin;

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

  const sectionLabels: Record<string, string> = {
    profile: t('section_profile'),
    communication: t('section_communication'),
    sensory: t('section_sensory'),
    conversation: t('section_conversation'),
    timeBoundaries: t('section_time_boundaries'),
    language: t('section_language'),
  };

  const renderSectionFooter = (section: SectionName, onSave: () => void) => {
    const status = sectionStatus[section];
    const isSaving = savingSection === section;
    const isDirty = dirtySections.has(section);

    return (
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

  const renderAccordionHeader = (section: string, label: string) => {
    const isOpen = openSections.has(section);
    const isDirty = dirtySections.has(section as SectionName);

    return (
      <button
        type="button"
        onClick={() => toggleSection(section)}
        aria-expanded={isOpen}
        aria-controls={`section-content-${section}`}
        className="flex w-full items-center justify-between rounded-t-lg bg-white px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-3">
          <h2 id={`settings-${section}`} className="text-lg font-semibold text-gray-900">
            {label}
          </h2>
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {t('save')}
            </span>
          )}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigateAway('/dashboard')}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('back_to_dashboard')}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
          </div>

          {/* Save All button — visible when there are dirty sections */}
          {dirtySections.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-amber-600 sm:inline">
                {t('dirty_count', { count: dirtySections.size })}
              </span>
              <button
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {isSavingAll ? t('save_all_saving') : t('save_all')}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
        {/* Sidebar navigation — desktop only */}
        <nav
          aria-label={t('title')}
          className="sticky top-20 hidden h-fit w-52 flex-shrink-0 rounded-lg border border-gray-200 bg-white py-2 lg:block"
        >
          {SECTION_IDS.map(section => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                dirtySections.has(section) ? 'font-medium text-amber-700' : 'text-gray-700'
              }`}
            >
              {sectionLabels[section]}
              {dirtySections.has(section) && (
                <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
              )}
            </button>
          ))}
          {isAdultAccount && (
            <button
              onClick={() => scrollToSection('link-minor')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('section_link_minor')}
            </button>
          )}
        </nav>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {isLoadingData ? (
            <div role="status" className="flex justify-center py-12">
              <p className="text-gray-600">{t('common:loading')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Section */}
              <section
                className="overflow-hidden rounded-lg border border-gray-200"
                aria-labelledby="settings-profile"
              >
                {renderAccordionHeader('profile', sectionLabels.profile)}
                {openSections.has('profile') && (
                  <div
                    id="section-content-profile"
                    className="border-t border-gray-100 bg-white px-5 py-5"
                  >
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
                      ageGroupLocked
                    />
                    {renderSectionFooter('profile', () => handleSaveSection('profile'))}
                  </div>
                )}
              </section>

              {/* Communication Section */}
              <section
                className="overflow-hidden rounded-lg border border-gray-200"
                aria-labelledby="settings-communication"
              >
                {renderAccordionHeader('communication', sectionLabels.communication)}
                {openSections.has('communication') && (
                  <div
                    id="section-content-communication"
                    className="border-t border-gray-100 bg-white px-5 py-5"
                  >
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
                    {renderSectionFooter('communication', () => handleSaveSection('communication'))}
                  </div>
                )}
              </section>

              {/* Sensory Section */}
              <section
                className="overflow-hidden rounded-lg border border-gray-200"
                aria-labelledby="settings-sensory"
              >
                {renderAccordionHeader('sensory', sectionLabels.sensory)}
                {openSections.has('sensory') && (
                  <div
                    id="section-content-sensory"
                    className="border-t border-gray-100 bg-white px-5 py-5"
                  >
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
                    {renderSectionFooter('sensory', () => handleSaveSection('sensory'))}
                  </div>
                )}
              </section>

              {/* Conversation Starters Section */}
              <section
                className="overflow-hidden rounded-lg border border-gray-200"
                aria-labelledby="settings-conversation"
              >
                {renderAccordionHeader('conversation', sectionLabels.conversation)}
                {openSections.has('conversation') && (
                  <div
                    id="section-content-conversation"
                    className="border-t border-gray-100 bg-white px-5 py-5"
                  >
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
                    {renderSectionFooter('conversation', () => handleSaveSection('conversation'))}
                  </div>
                )}
              </section>

              {/* Time Boundaries Section */}
              <section
                className="overflow-hidden rounded-lg border border-gray-200"
                aria-labelledby="settings-timeBoundaries"
              >
                {renderAccordionHeader('timeBoundaries', sectionLabels.timeBoundaries)}
                {openSections.has('timeBoundaries') && (
                  <div
                    id="section-content-timeBoundaries"
                    className="border-t border-gray-100 bg-white px-5 py-5"
                  >
                    <TimeBoundariesEditor
                      boundaries={boundaries}
                      onBoundaryChange={handleBoundaryChange}
                    />
                    {renderSectionFooter('timeBoundaries', () =>
                      handleSaveSection('timeBoundaries')
                    )}
                  </div>
                )}
              </section>

              {/* Language Section */}
              <section
                className="overflow-hidden rounded-lg border border-gray-200"
                aria-labelledby="settings-language"
              >
                {renderAccordionHeader('language', sectionLabels.language)}
                {openSections.has('language') && (
                  <div
                    id="section-content-language"
                    className="border-t border-gray-100 bg-white px-5 py-5"
                  >
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
                    {renderSectionFooter('language', () => handleSaveSection('language'))}
                  </div>
                )}
              </section>

              {/* Link a Minor Section — only for adult accounts */}
              {isAdultAccount && (
                <section
                  className="overflow-hidden rounded-lg border border-gray-200"
                  aria-labelledby="settings-link-minor"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('link-minor')}
                    aria-expanded={openSections.has('link-minor')}
                    aria-controls="section-content-link-minor"
                    className="flex w-full items-center justify-between rounded-t-lg bg-white px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <h2 id="settings-link-minor" className="text-lg font-semibold text-gray-900">
                      {t('section_link_minor')}
                    </h2>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform ${openSections.has('link-minor') ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openSections.has('link-minor') && (
                    <div
                      id="section-content-link-minor"
                      className="border-t border-gray-100 bg-white px-5 py-5"
                    >
                      <p className="mb-4 text-sm text-gray-600">{t('link_minor_description')}</p>

                      {linkMinorError && (
                        <p
                          role="alert"
                          className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                          {linkMinorError}
                        </p>
                      )}

                      {generatedCode ? (
                        <div className="space-y-4">
                          {/* Invite code (for registration) */}
                          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center">
                            <p className="mb-1 text-sm font-medium text-green-700">
                              {t('invite_code_label')}
                            </p>
                            <p className="font-mono text-2xl font-bold tracking-wider text-green-900">
                              {generatedCode.inviteCode}
                            </p>
                            <button
                              onClick={handleCopyInviteCode}
                              className="mt-2 rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
                            >
                              {inviteCodeCopied ? t('code_copied') : t('copy_code')}
                            </button>
                          </div>

                          {/* Linking code (for profile setup) */}
                          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center">
                            <p className="mb-1 text-sm font-medium text-blue-700">
                              {t('linking_code_label')}
                            </p>
                            <p className="font-mono text-2xl font-bold tracking-wider text-blue-900">
                              {generatedCode.code}
                            </p>
                            <button
                              onClick={handleCopyCode}
                              className="mt-2 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                            >
                              {codeCopied ? t('code_copied') : t('copy_code')}
                            </button>
                          </div>

                          <p className="text-center text-xs text-blue-600">
                            {t('code_expires', {
                              date: new Date(generatedCode.expiresAt).toLocaleDateString(),
                            })}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={handleGenerateCode}
                              disabled={isGeneratingCode}
                              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                            >
                              {t('generate_code')}
                            </button>
                          </div>
                          <p className="text-sm text-gray-500">{t('code_instructions')}</p>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateCode}
                          disabled={isGeneratingCode}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isGeneratingCode ? t('generating_code') : t('generate_code')}
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Unsaved changes modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-modal-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="unsaved-modal-title" className="text-lg font-semibold text-gray-900">
              {t('unsaved_modal_title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{t('unsaved_modal_body')}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                onClick={handleUnsavedCancel}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t('unsaved_modal_cancel')}
              </button>
              <button
                onClick={handleUnsavedDiscard}
                className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                {t('unsaved_modal_discard')}
              </button>
              <button
                onClick={handleUnsavedSaveAndLeave}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                {t('unsaved_modal_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
